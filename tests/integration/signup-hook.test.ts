import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The Better Auth `user.create.after` hook runs on every first sign-in — it is
 * what enrolls attendees (BR-02) and keeps the admin out of the raffle (BR-03).
 * Nothing else exercises it, so it is driven directly here against the real
 * database, inside a transaction that is always rolled back.
 */

const hasDb = Boolean(process.env.DATABASE_URL);
const d = hasDb ? describe : describe.skip;

const real = hasDb
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
    } as ConstructorParameters<typeof PrismaClient>[0])
  : (null as unknown as PrismaClient);

let active: unknown = real;
const prismaProxy = new Proxy(
  {},
  { get: (_t, prop) => (active as Record<string | symbol, unknown>)[prop] },
);

vi.mock("@/lib/prisma", () => ({ prisma: prismaProxy }));

const { auth } = await import("@/lib/auth");

const ROLLBACK = "__rollback__";

async function inRollback(fn: (tx: PrismaClient) => Promise<void>) {
  try {
    await real.$transaction(async (tx) => {
      active = tx;
      await fn(tx as unknown as PrismaClient);
      throw new Error(ROLLBACK);
    });
  } catch (e) {
    if (!(e instanceof Error) || e.message !== ROLLBACK) throw e;
  } finally {
    active = real;
  }
}

type CreatedUser = { id: string; email: string; name: string };

/** The hook Better Auth invokes after it inserts the User row. */
function afterCreateHook() {
  const hook = auth.options.databaseHooks?.user?.create?.after;
  expect(hook, "auth.ts no longer registers a user.create.after hook").toBeTypeOf(
    "function",
  );
  return hook as (user: CreatedUser) => Promise<void>;
}

afterAll(async () => {
  if (hasDb) await real.$disconnect();
});

d("first sign-in enrolment", () => {
  it("BR-02: a normal attendee gets a RaffleEntry", async () => {
    await inRollback(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Atendente Novo",
          email: `signup-${Date.now()}@test.invalid`,
          role: "user",
          isParticipant: true,
        },
      });

      await afterCreateHook()(user);

      expect(await tx.raffleEntry.count({ where: { userId: user.id } })).toBe(1);
      const stored = await tx.user.findUnique({ where: { id: user.id } });
      expect(stored!.role).toBe("user");
      expect(stored!.isParticipant).toBe(true);
    });
  });

  it("BR-03: the ADMIN_EMAIL account is promoted and never enrolled", async () => {
    expect(process.env.ADMIN_EMAIL, "ADMIN_EMAIL is not set in .env").toBeTruthy();

    // The real admin already exists and cannot be recreated, so point the hook
    // at a throwaway address. Upper-cased to prove the match is case-insensitive.
    const adminEmail = `admin-${Date.now()}@test.invalid`;
    vi.stubEnv("ADMIN_EMAIL", adminEmail);

    await inRollback(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Admin Novo",
          email: adminEmail.toUpperCase(),
          role: "user",
          isParticipant: true,
        },
      });

      await afterCreateHook()(user);

      const stored = await tx.user.findUnique({ where: { id: user.id } });
      expect(stored!.role).toBe("admin");
      expect(stored!.isParticipant).toBe(false);
      expect(await tx.raffleEntry.count({ where: { userId: user.id } })).toBe(0);
    });

    vi.unstubAllEnvs();
  });

  it("REGRESSION: a retried OAuth callback does not poison the transaction", async () => {
    await inRollback(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Atendente Repetido",
          email: `dup-${Date.now()}@test.invalid`,
          role: "user",
          isParticipant: true,
        },
      });

      await afterCreateHook()(user);
      // A retried OAuth callback must not break the sign-in
      await expect(afterCreateHook()(user)).resolves.toBeUndefined();
      expect(await tx.raffleEntry.count({ where: { userId: user.id } })).toBe(1);
    });
  });

  it("the enrolled attendee is immediately eligible for the draw", async () => {
    await inRollback(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Elegivel",
          email: `elig-${Date.now()}@test.invalid`,
          role: "user",
          isParticipant: true,
        },
      });
      await afterCreateHook()(user);

      const eligible = await tx.raffleEntry.findMany({
        where: { user: { role: { not: "admin" } } },
        select: { userId: true },
      });
      expect(eligible.map((e) => e.userId)).toContain(user.id);
    });
  });
});
