import { vi } from 'vitest'

/** Minimal in-memory stand-in for the delegates the server actions touch. */
export function createPrismaMock() {
  return {
    raffleEvent: {
      findFirst: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    raffleEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    rafflePrize: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    transferLog: {
      create: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    queryLog: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    user: { findUnique: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    // Supports both forms: an array of promises and an interactive callback.
    $transaction: vi.fn(async function (this: unknown, ops: unknown): Promise<unknown> {
      if (typeof ops === 'function') {
        return (ops as (tx: unknown) => Promise<unknown>)(this)
      }
      return Array.isArray(ops) ? Promise.all(ops) : ops
    }),
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  }
}

export type PrismaMock = ReturnType<typeof createPrismaMock>

export const adminSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@x.dev', role: 'admin' },
}

export const userSession = (id = 'user-1') => ({
  user: { id, name: 'User', email: `${id}@x.dev`, role: 'user' },
})
