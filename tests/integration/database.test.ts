import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const hasDb = Boolean(process.env.DATABASE_URL)
const d = hasDb ? describe : describe.skip

/**
 * Portões de prontidão do evento: dependem de gente que já logou e do admin
 * promovido pelo seed. Não dizem nada sobre o banco efêmero que o CI sobe do
 * zero, então só rodam com READINESS=1 — o job "Prontidão do Neon", apontado
 * para o banco de verdade.
 */
const readiness = hasDb && process.env.READINESS === '1' ? describe : describe.skip

const prisma = hasDb
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    } as ConstructorParameters<typeof PrismaClient>[0])
  : (null as unknown as PrismaClient)

const ROLLBACK = '__rollback__'

/** Runs `fn` inside a transaction that is always rolled back. */
async function inRollback(fn: (tx: PrismaClient) => Promise<void>) {
  try {
    await prisma.$transaction(async (tx) => {
      await fn(tx as unknown as PrismaClient)
      throw new Error(ROLLBACK)
    })
  } catch (e) {
    if (!(e instanceof Error) || e.message !== ROLLBACK) throw e
  }
}

beforeAll(async () => {
  if (hasDb) await prisma.$queryRaw`SELECT 1`
})

afterAll(async () => {
  if (hasDb) await prisma.$disconnect()
})

d('connectivity', () => {
  it('connects to the configured Postgres database', async () => {
    const r = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`
    expect(r[0].ok).toBe(1)
  })
})

d('schema is in sync with prisma/schema.prisma', () => {
  it('has every model table', async () => {
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'`
    const tables = rows.map((r) => r.table_name)
    for (const t of [
      'User',
      'Session',
      'Account',
      'Verification',
      'RaffleEntry',
      'RafflePrize',
      'TransferLog',
      'RaffleEvent',
      'QueryLog',
    ]) {
      expect(tables, `missing table ${t}`).toContain(t)
    }
  })

  it('exposes the custom User columns Better Auth relies on', async () => {
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User'`
    const cols = rows.map((r) => r.column_name)
    expect(cols).toEqual(expect.arrayContaining(['role', 'isParticipant']))
  })

  it('every Prisma delegate can be queried', async () => {
    await expect(
      Promise.all([
        prisma.user.count(),
        prisma.session.count(),
        prisma.account.count(),
        prisma.verification.count(),
        prisma.raffleEntry.count(),
        prisma.rafflePrize.count(),
        prisma.transferLog.count(),
        prisma.raffleEvent.count(),
        prisma.queryLog.count(),
      ])
    ).resolves.toBeDefined()
  })
})

d('seed data required for the raffle to run', () => {
  it('has an active RaffleEvent', async () => {
    const event = await prisma.raffleEvent.findFirst({
      where: { isActive: true },
    })
    expect(event, 'no active RaffleEvent — run `pnpm db:seed`').not.toBeNull()
  })

  it('has the 5 prizes the draw needs', async () => {
    const count = await prisma.rafflePrize.count()
    expect(count, 'RafflePrize is empty — run `pnpm db:seed`').toBe(5)
  })

  it('numbers the prizes 1..5 without gaps', async () => {
    const prizes = await prisma.rafflePrize.findMany({
      orderBy: { prizeNumber: 'asc' },
      select: { prizeNumber: true },
    })
    expect(prizes.map((p) => p.prizeNumber)).toEqual([1, 2, 3, 4, 5])
  })
})

readiness('prontidão do evento (só contra o banco real)', () => {
  it('has exactly one admin', async () => {
    const admins = await prisma.user.count({ where: { role: 'admin' } })
    expect(admins).toBe(1)
  })

  // Fica vermelho até 5 pessoas terem logado. Rode antes da palestra para
  // saber que o sorteio vai passar.
  it('EVENT READINESS: has at least 5 eligible participants for a draw', async () => {
    const eligible = await prisma.raffleEntry.count({
      where: { user: { role: { not: 'admin' } } },
    })
    expect(eligible, 'drawRaffle() throws below 5 eligible participants').toBeGreaterThanOrEqual(5)
  })
})

d('raffle data invariants', () => {
  it('no admin is enrolled as a raffle participant', async () => {
    const enrolledAdmins = await prisma.raffleEntry.count({
      where: { user: { role: 'admin' } },
    })
    expect(enrolledAdmins).toBe(0)
  })

  it('no prize is won by the same user twice', async () => {
    const won = await prisma.rafflePrize.findMany({
      where: { winnerId: { not: null } },
      select: { winnerId: true },
    })
    const ids = won.map((p) => p.winnerId!)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no prize is transferred to its own winner', async () => {
    const bad = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "RafflePrize"
      WHERE "transferredToId" IS NOT NULL AND "transferredToId" = "winnerId"`
    expect(Number(bad[0].n)).toBe(0)
  })

  it('every transferred prize has a matching TransferLog entry', async () => {
    const bad = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT COUNT(*) AS n FROM "RafflePrize" p
      WHERE p."transferredToId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "TransferLog" l
          WHERE l."prizeId" = p.id AND l."toUserId" = p."transferredToId")`
    expect(Number(bad[0].n)).toBe(0)
  })
})

d('referential integrity on account deletion', () => {
  it('cascades Session, Account and RaffleEntry off User', async () => {
    const rules = await prisma.$queryRaw<Array<{ tbl: string; del: string }>>`
      SELECT tc.table_name AS tbl, rc.delete_rule AS del
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'User'`
    const byTable = Object.fromEntries(rules.map((r) => [r.tbl, r.del]))
    expect(byTable.Session).toBe('CASCADE')
    expect(byTable.Account).toBe('CASCADE')
    expect(byTable.RaffleEntry).toBe('CASCADE')
  })

  it("deleteAccount()'s exact steps succeed for a user with query logs", async () => {
    // Mirrors src/actions/users.ts against the live schema, then rolls back.
    // QueryLog.userId and TransferLog.* are ON DELETE RESTRICT, so those rows
    // must be removed before user.delete().
    const owner = await prisma.queryLog.findFirst({ select: { userId: true } })
    if (!owner) return // nothing to prove without logs

    let failure: string | null = null
    await inRollback(async (tx) => {
      await tx.rafflePrize.updateMany({
        where: { winnerId: owner.userId },
        data: { winnerId: null, drawnAt: null },
      })
      await tx.rafflePrize.updateMany({
        where: { transferredToId: owner.userId },
        data: { transferredToId: null },
      })
      await tx.transferLog.deleteMany({
        where: {
          OR: [{ fromUserId: owner.userId }, { toUserId: owner.userId }],
        },
      })
      await tx.queryLog.deleteMany({ where: { userId: owner.userId } })
      try {
        await tx.user.delete({ where: { id: owner.userId } })
      } catch (e) {
        failure = e instanceof Error ? e.message : String(e)
      }
    })

    expect(failure, 'user.delete() was rejected by a foreign key').toBeNull()
  })
})
