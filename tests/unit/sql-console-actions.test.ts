import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminSession,
  createPrismaMock,
  userSession,
  type PrismaMock,
} from '../helpers/mock-prisma'

const prisma: PrismaMock = createPrismaMock()
const getSession = vi.fn()

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: () => getSession() } } }))

const { executeSQL, getSchemaBrowser, getQueryHistory } = await import('@/actions/sql-console')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.queryLog.create.mockResolvedValue({})
  getSession.mockResolvedValue(adminSession)
})

describe('executeSQL — authorization', () => {
  it('rejects an anonymous caller', async () => {
    getSession.mockResolvedValue(null)
    await expect(executeSQL('SELECT 1')).rejects.toThrow(/Acesso negado/i)
  })

  it('rejects a non-admin caller', async () => {
    getSession.mockResolvedValue(userSession())
    await expect(executeSQL('SELECT * FROM "User"')).rejects.toThrow(/Acesso negado/i)
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled()
  })
})

describe('executeSQL — destructive-statement guard', () => {
  const blocked = [
    'DROP TABLE "User"',
    'drop   table users',
    'DROP DATABASE neondb',
    'DROP SCHEMA public CASCADE',
    'TRUNCATE TABLE "RafflePrize"',
    'ALTER TABLE "User" DROP COLUMN role',
  ]

  for (const sql of blocked) {
    it(`blocks: ${sql}`, async () => {
      await expect(executeSQL(sql)).rejects.toThrow(/bloqueada por segurança/i)
      expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled()
    })
  }

  it('REGRESSION: blocks TRUNCATE without the TABLE keyword', async () => {
    // Postgres accepts `TRUNCATE "User"` — the guard only matches TRUNCATE TABLE.
    await expect(executeSQL('TRUNCATE "User"')).rejects.toThrow(/bloqueada por segurança/i)
  })

  it('REGRESSION: blocks a destructive statement hidden behind a comment', async () => {
    await expect(executeSQL('SELECT 1; /**/ DROP TABLE "User"')).rejects.toThrow(
      /bloqueada por segurança/i
    )
  })

  it('allows a plain SELECT', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ id: 1 }])
    const res = await executeSQL('SELECT * FROM "User"')
    expect(res.rowCount).toBe(1)
  })
})

describe('executeSQL — read vs write routing', () => {
  it('routes SELECT through $queryRawUnsafe and counts rows', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ a: 1 }, { a: 2 }])
    const res = await executeSQL('SELECT a FROM "T"')
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT a FROM "T"')
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled()
    expect(res.rows).toHaveLength(2)
    expect(res.message).toBe('2 linhas retornadas')
  })

  it('routes a CTE (WITH ...) as a read query', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ a: 1 }])
    const res = await executeSQL('WITH x AS (SELECT 1) SELECT * FROM x')
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled()
    expect(res.message).toBe('1 linha retornada')
  })

  it('routes UPDATE through $executeRawUnsafe and reports affected rows', async () => {
    prisma.$executeRawUnsafe.mockResolvedValue(3)
    const res = await executeSQL('UPDATE "User" SET role = \'user\'')
    expect(prisma.$executeRawUnsafe).toHaveBeenCalled()
    expect(res.rows).toEqual([])
    expect(res.message).toBe('3 registros atualizados com sucesso')
  })

  it('handles a leading-whitespace / lowercase SELECT', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([])
    const res = await executeSQL('\n  select 1 ')
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled()
    expect(res.rowCount).toBe(0)
  })
})

describe('executeSQL — error translation and logging', () => {
  it('translates a missing-relation error to Portuguese', async () => {
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('relation "Foo" does not exist'))
    await expect(executeSQL('SELECT * FROM "Foo"')).rejects.toThrow(/Tabela não encontrada/i)
  })

  it('translates a syntax error', async () => {
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('syntax error at or near'))
    await expect(executeSQL('SELECT FROM')).rejects.toThrow(/Erro de sintaxe/i)
  })

  it('still writes a QueryLog row when the query fails', async () => {
    prisma.$queryRawUnsafe.mockRejectedValue(new Error('syntax error'))
    await expect(executeSQL('SELECT FROM')).rejects.toThrow()
    expect(prisma.queryLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        sql: 'SELECT FROM',
        error: expect.stringMatching(/sintaxe/i),
      }),
    })
  })

  it('logs a successful query with its duration and row count', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ a: 1 }])
    await executeSQL('SELECT 1')
    expect(prisma.queryLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ rowCount: 1, error: null }),
    })
  })

  it('does not fail the query when audit logging itself fails', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ a: 1 }])
    prisma.queryLog.create.mockRejectedValue(new Error('log table gone'))
    await expect(executeSQL('SELECT 1')).resolves.toMatchObject({ rowCount: 1 })
  })
})

describe('schema browser and history', () => {
  it('groups information_schema rows by table', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { table_name: 'User', column_name: 'id', data_type: 'text' },
      { table_name: 'User', column_name: 'email', data_type: 'text' },
      { table_name: 'QueryLog', column_name: 'sql', data_type: 'text' },
    ])
    const schema = await getSchemaBrowser()
    expect(Object.keys(schema).sort()).toEqual(['QueryLog', 'User'])
    expect(schema.User).toEqual([
      { column: 'id', type: 'text' },
      { column: 'email', type: 'text' },
    ])
  })

  it('scopes query history to the calling admin and caps it at 10', async () => {
    prisma.queryLog.findMany.mockResolvedValue([])
    await getQueryHistory()
    expect(prisma.queryLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'admin-1' }, take: 10 })
    )
  })

  it('blocks a non-admin from browsing the schema', async () => {
    getSession.mockResolvedValue(userSession())
    await expect(getSchemaBrowser()).rejects.toThrow(/Acesso negado/i)
  })
})
