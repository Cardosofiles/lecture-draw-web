import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminSession,
  createPrismaMock,
  userSession,
  type PrismaMock,
} from '../helpers/mock-prisma'

const prisma: PrismaMock = createPrismaMock()
const getSession = vi.fn()
const redirect = vi.fn((_path: string): never => {
  throw new Error('NEXT_REDIRECT')
})

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/navigation', () => ({ redirect: (p: string) => redirect(p) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: () => getSession() } } }))

const { deleteAccount, getAllParticipants, getParticipantCount } = await import('@/actions/users')

beforeEach(() => {
  vi.clearAllMocks()
  prisma.rafflePrize.updateMany.mockResolvedValue({ count: 0 })
  prisma.user.delete.mockResolvedValue({ id: 'user-1' })
})

describe('deleteAccount', () => {
  it('requires authentication', async () => {
    getSession.mockResolvedValue(null)
    await expect(deleteAccount()).rejects.toThrow(/Autenticação necessária/i)
    expect(prisma.user.delete).not.toHaveBeenCalled()
  })

  it('releases prizes won before deleting the user', async () => {
    getSession.mockResolvedValue(userSession('user-1'))
    await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT')
    expect(prisma.rafflePrize.updateMany).toHaveBeenCalledWith({
      where: { winnerId: 'user-1' },
      data: { winnerId: null, drawnAt: null },
    })
    expect(prisma.rafflePrize.updateMany).toHaveBeenCalledWith({
      where: { transferredToId: 'user-1' },
      data: { transferredToId: null },
    })
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
  })

  it('redirects to /login when finished', async () => {
    getSession.mockResolvedValue(userSession('user-1'))
    await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('REGRESSION: clears dependent QueryLog/TransferLog rows before deleting', async () => {
    // QueryLog.userId and TransferLog.fromUserId/toUserId are ON DELETE RESTRICT
    // in the live schema, so user.delete() throws unless those rows go first.
    getSession.mockResolvedValue(adminSession)
    await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT')

    expect(
      prisma.queryLog.deleteMany,
      "deleteAccount() never removes the user's QueryLog rows"
    ).toHaveBeenCalledWith({ where: { userId: 'admin-1' } })
    expect(
      prisma.transferLog.deleteMany,
      "deleteAccount() never removes the user's TransferLog rows"
    ).toHaveBeenCalled()
    expect(prisma.user.delete.mock.invocationCallOrder[0]).toBeGreaterThan(
      prisma.queryLog.deleteMany.mock.invocationCallOrder[0]
    )
  })
})

describe('getAllParticipants', () => {
  it('returns only participants and excludes admins', async () => {
    prisma.user.findMany.mockResolvedValue([])
    await getAllParticipants()
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isParticipant: true, role: { not: 'admin' } },
      })
    )
  })

  it('never selects sensitive columns', async () => {
    prisma.user.findMany.mockResolvedValue([])
    await getAllParticipants()
    const arg = prisma.user.findMany.mock.calls[0][0] as {
      select: Record<string, unknown>
    }
    expect(arg.select).toBeDefined()
    expect(Object.keys(arg.select)).not.toContain('password')
  })
})

describe('getParticipantCount', () => {
  it('counts raffle entries excluding admins', async () => {
    prisma.raffleEntry.count.mockResolvedValue(7)
    await expect(getParticipantCount()).resolves.toBe(7)
    expect(prisma.raffleEntry.count).toHaveBeenCalledWith({
      where: { user: { role: { not: 'admin' } } },
    })
  })
})
