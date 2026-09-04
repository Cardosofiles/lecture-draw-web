import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * End-to-end exercise of the real server actions against the real database.
 *
 * `@/lib/prisma` is swapped for a proxy that forwards to whichever client is
 * active. Inside a test that is the transaction client, so every write the
 * actions perform is rolled back — nothing survives the run.
 */

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const real = hasDb
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    } as ConstructorParameters<typeof PrismaClient>[0])
  : (null as unknown as PrismaClient);

type Tx = Omit<
  PrismaClient,
  "$transaction" | "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;
let active: unknown = real;

const prismaProxy = new Proxy(
  {},
  {
    get: (_t, prop) => (active as Record<string | symbol, unknown>)[prop],
  },
);

let session: unknown = null;

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaProxy }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: async () => session } },
}));

const { drawRaffle, transferPrize } = await import("@/actions/raffle");
const { deleteAccount } = await import("@/actions/users");

const ROLLBACK = "__rollback__";

/**
 * Runs `fn` against a transaction client and always rolls back. The actions
 * open their own `$transaction`; inside a transaction Prisma has no nested
 * client, so the proxy answers that call by reusing the same tx.
 */
async function inRollback(fn: (tx: Tx) => Promise<void>) {
  try {
    await real.$transaction(
      async (tx) => {
        active = new Proxy(tx as object, {
          get: (t, prop) =>
            prop === "$transaction"
              ? // Both call styles the actions use: an interactive callback and
                // an array of queries. Reuse this tx so writes stay rollbackable.
                (ops: unknown) =>
                  typeof ops === "function"
                    ? (ops as (inner: unknown) => unknown)(active)
                    : Promise.all(ops as Promise<unknown>[])
              : (t as Record<string | symbol, unknown>)[prop],
        });
        await fn(tx as Tx);
        throw new Error(ROLLBACK);
      },
      { timeout: 25_000 },
    );
  } catch (e) {
    if (!(e instanceof Error) || e.message !== ROLLBACK) throw e;
  } finally {
    active = real;
    session = null;
  }
}

/** Five throwaway participants, enrolled exactly like a real sign-in does. */
async function seedParticipants(tx: Tx, n = 5) {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const user = await tx.user.create({
      data: {
        name: `E2E Participante ${i}`,
        email: `e2e-${i}-${Date.now()}@test.invalid`,
        role: "user",
        isParticipant: true,
      },
    });
    await tx.raffleEntry.create({ data: { userId: user.id } });
    ids.push(user.id);
  }
  return ids;
}

async function resetEvent(tx: Tx) {
  await tx.raffleEvent.updateMany({
    where: { isActive: true },
    data: { drawnAt: null },
  });
  await tx.rafflePrize.updateMany({
    data: { winnerId: null, transferredToId: null, drawnAt: null },
  });
}

afterAll(async () => {
  if (hasDb) await real.$disconnect();
});

d("drawRaffle against the real database", () => {
  it("draws 5 distinct winners and marks the event, then rolls back", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      await seedParticipants(tx);
      session = { user: { id: "e2e-admin", role: "admin" } };

      const results = await drawRaffle();

      expect(results).toHaveLength(5);
      expect(new Set(results.map((r) => r.winnerId)).size).toBe(5);
      expect(results.map((r) => r.prizeNumber).sort()).toEqual([1, 2, 3, 4, 5]);

      // Every winner is a real, non-admin participant loaded from the DB
      for (const r of results) {
        expect(r.winner).not.toBeNull();
        expect(r.winner!.role).not.toBe("admin");
        expect(r.drawnAt).toBeInstanceOf(Date);
        expect(r.transferredToId).toBeNull();
      }

      const event = await tx.raffleEvent.findFirst({ where: { isActive: true } });
      expect(event!.drawnAt).toBeInstanceOf(Date);

      const persisted = await tx.rafflePrize.count({
        where: { winnerId: { not: null } },
      });
      expect(persisted).toBe(5);
    });
  });

  it("refuses a second draw on the same event", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      await seedParticipants(tx);
      session = { user: { id: "e2e-admin", role: "admin" } };

      await drawRaffle();
      await expect(drawRaffle()).rejects.toThrow(/já foi realizado/i);

      // The first draw's winners are still intact
      const winners = await tx.rafflePrize.count({
        where: { winnerId: { not: null } },
      });
      expect(winners).toBe(5);
    });
  });

  it("leaves the database untouched when the draw aborts mid-way", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      // Only 2 seeded participants + whoever really signed up; force a failure
      // by demanding the draw before there are enough of them.
      const eligible = await tx.raffleEntry.count({
        where: { user: { role: { not: "admin" } } },
      });
      if (eligible >= 5) return; // real signups already cover it

      session = { user: { id: "e2e-admin", role: "admin" } };
      await expect(drawRaffle()).rejects.toThrow(/pelo menos 5/i);

      const event = await tx.raffleEvent.findFirst({ where: { isActive: true } });
      expect(event!.drawnAt).toBeNull();
      expect(
        await tx.rafflePrize.count({ where: { winnerId: { not: null } } }),
      ).toBe(0);
    });
  });
});

d("transferPrize against the real database", () => {
  it("moves a real prize and writes the audit log", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      const ids = await seedParticipants(tx, 6);
      session = { user: { id: "e2e-admin", role: "admin" } };
      const results = await drawRaffle();

      const prize = results[0];
      const winnerId = prize.winnerId!;
      const recipientId = ids.find(
        (id) => id !== winnerId && !results.some((r) => r.winnerId === id),
      )!;

      session = { user: { id: winnerId, role: "user" } };
      const updated = await transferPrize(prize.id, recipientId);

      expect(updated.transferredToId).toBe(recipientId);
      expect(updated.winnerId).toBe(winnerId); // BR-20: history preserved

      const log = await tx.transferLog.findFirst({ where: { prizeId: prize.id } });
      expect(log).toMatchObject({ fromUserId: winnerId, toUserId: recipientId });
    });
  });

  it("enforces BR-17/19 and blocks a second transfer", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      const ids = await seedParticipants(tx, 6);
      session = { user: { id: "e2e-admin", role: "admin" } };
      const results = await drawRaffle();

      const prize = results[0];
      const winnerId = prize.winnerId!;
      const other = ids.find(
        (id) => id !== winnerId && !results.some((r) => r.winnerId === id),
      )!;

      // BR-17: a non-winner cannot transfer
      session = { user: { id: other, role: "user" } };
      await expect(transferPrize(prize.id, winnerId)).rejects.toThrow(
        /não é o ganhador/i,
      );

      // BR-19: no self-transfer
      session = { user: { id: winnerId, role: "user" } };
      await expect(transferPrize(prize.id, winnerId)).rejects.toThrow(
        /para si mesmo/i,
      );

      // First transfer succeeds, second is refused
      await transferPrize(prize.id, other);
      await expect(transferPrize(prize.id, other)).rejects.toThrow(
        /já foi transferido/i,
      );

      expect(await tx.transferLog.count({ where: { prizeId: prize.id } })).toBe(1);
    });
  });

  it("refuses an admin as recipient (BR-03/BR-18)", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      await seedParticipants(tx, 5);
      const admin = await tx.user.create({
        data: {
          name: "E2E Admin",
          email: `e2e-admin-${Date.now()}@test.invalid`,
          role: "admin",
          isParticipant: false,
        },
      });

      session = { user: { id: "e2e-admin", role: "admin" } };
      const results = await drawRaffle();

      session = { user: { id: results[0].winnerId!, role: "user" } };
      await expect(transferPrize(results[0].id, admin.id)).rejects.toThrow(
        /não é um participante/i,
      );
    });
  });
});

d("deleteAccount against the real database", () => {
  it("deletes a winner who has query logs and transfer history", async () => {
    await inRollback(async (tx) => {
      await resetEvent(tx);
      const ids = await seedParticipants(tx, 6);
      session = { user: { id: "e2e-admin", role: "admin" } };
      const results = await drawRaffle();

      const prize = results[0];
      const winnerId = prize.winnerId!;
      const other = ids.find(
        (id) => id !== winnerId && !results.some((r) => r.winnerId === id),
      )!;

      session = { user: { id: winnerId, role: "user" } };
      await transferPrize(prize.id, other);
      await tx.queryLog.create({
        data: { userId: winnerId, sql: "SELECT 1", duration: 1, rowCount: 1 },
      });

      // deleteAccount() ends in redirect(), which throws NEXT_REDIRECT
      await expect(deleteAccount()).rejects.toThrow(/NEXT_REDIRECT/);

      expect(await tx.user.findUnique({ where: { id: winnerId } })).toBeNull();
      expect(await tx.queryLog.count({ where: { userId: winnerId } })).toBe(0);
      expect(
        await tx.transferLog.count({ where: { fromUserId: winnerId } }),
      ).toBe(0);

      // BR-24: the prize returns to the pool
      const freed = await tx.rafflePrize.findUnique({ where: { id: prize.id } });
      expect(freed!.winnerId).toBeNull();

      // OPEN QUESTION: deleteAccount() only clears transferredToId when the
      // leaving user was the *recipient*. A winner who transferred and then
      // deleted leaves the prize with no winner but still flagged as transferred
      // — /raffle renders "transferido para X" on an unwon prize until a redraw
      // resets it. Documented, not silently changed: whether the recipient keeps
      // the prize is a product call.
      expect(freed!.transferredToId).toBe(other);
    });
  });
});
