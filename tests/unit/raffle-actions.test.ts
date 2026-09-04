import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminSession,
  createPrismaMock,
  userSession,
  type PrismaMock,
} from "../helpers/mock-prisma";

const prisma: PrismaMock = createPrismaMock();
const getSession = vi.fn();

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: () => getSession() } } }));

const { drawRaffle, transferPrize, getRaffleResults, getRaffleEvent } =
  await import("@/actions/raffle");

function makeEntries(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `entry-${i}`,
    userId: `user-${i}`,
    user: { id: `user-${i}`, name: `User ${i}`, role: "user" },
  }));
}

function makePrizes(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `prize-${i}`,
    prizeNumber: i + 1,
    description: `PC Setup #${i + 1}`,
    winnerId: null,
    transferredToId: null,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.raffleEvent.updateMany.mockResolvedValue({ count: 1 });
  prisma.$transaction.mockImplementation(async (ops: unknown) =>
    typeof ops === "function"
      ? (ops as (tx: unknown) => Promise<unknown>)(prisma)
      : Array.isArray(ops)
        ? Promise.all(ops)
        : ops,
  );
  prisma.rafflePrize.update.mockImplementation(
    async ({ where, data }: { where: { id: string }; data: unknown }) => ({
      id: where.id,
      ...(data as Record<string, unknown>),
    }),
  );
});

describe("drawRaffle — authorization", () => {
  it("rejects an unauthenticated caller", async () => {
    getSession.mockResolvedValue(null);
    await expect(drawRaffle()).rejects.toThrow(/somente administradores/i);
  });

  it("rejects a non-admin caller", async () => {
    getSession.mockResolvedValue(userSession());
    await expect(drawRaffle()).rejects.toThrow(/somente administradores/i);
    expect(prisma.rafflePrize.update).not.toHaveBeenCalled();
  });
});

describe("drawRaffle — preconditions", () => {
  beforeEach(() => getSession.mockResolvedValue(adminSession));

  it("refuses to re-run a draw that already happened", async () => {
    prisma.raffleEvent.findFirst.mockResolvedValue({
      id: "e1",
      isActive: true,
      drawnAt: new Date(),
    });
    await expect(drawRaffle()).rejects.toThrow(/já foi realizado/i);
  });

  it("refuses to draw when no active event exists", async () => {
    prisma.raffleEvent.findFirst.mockResolvedValue(null);
    prisma.raffleEntry.findMany.mockResolvedValue(makeEntries(10));
    prisma.rafflePrize.findMany.mockResolvedValue(makePrizes(5));
    await expect(drawRaffle()).rejects.toThrow(/Nenhum evento ativo/i);
    expect(prisma.rafflePrize.update).not.toHaveBeenCalled();
  });

  it("requires at least 5 eligible participants", async () => {
    prisma.raffleEvent.findFirst.mockResolvedValue({ id: "e1", drawnAt: null });
    prisma.raffleEntry.findMany.mockResolvedValue(makeEntries(4));
    await expect(drawRaffle()).rejects.toThrow(/pelo menos 5/i);
  });

  it("excludes admins from the eligible-participant query", async () => {
    prisma.raffleEvent.findFirst.mockResolvedValue({ id: "e1", drawnAt: null });
    prisma.raffleEntry.findMany.mockResolvedValue(makeEntries(4));
    await expect(drawRaffle()).rejects.toThrow();
    expect(prisma.raffleEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { role: { not: "admin" } } },
      }),
    );
  });

  it("requires 5 seeded prizes", async () => {
    prisma.raffleEvent.findFirst.mockResolvedValue({ id: "e1", drawnAt: null });
    prisma.raffleEntry.findMany.mockResolvedValue(makeEntries(10));
    prisma.rafflePrize.findMany.mockResolvedValue(makePrizes(0));
    await expect(drawRaffle()).rejects.toThrow(/Prêmios não configurados/i);
  });
});

describe("drawRaffle — happy path", () => {
  beforeEach(() => {
    getSession.mockResolvedValue(adminSession);
    prisma.raffleEvent.findFirst.mockResolvedValue({ id: "e1", drawnAt: null });
    prisma.raffleEntry.findMany.mockResolvedValue(makeEntries(20));
    prisma.rafflePrize.findMany.mockResolvedValue(makePrizes(5));
  });

  it("assigns exactly 5 prizes to 5 distinct winners", async () => {
    const results = await drawRaffle();
    expect(results).toHaveLength(5);
    const winners = results.map((r) => r.winnerId);
    expect(new Set(winners).size).toBe(5);
    expect(winners.every((w) => typeof w === "string")).toBe(true);
  });

  it("clears any previous transfer and stamps drawnAt on every prize", async () => {
    const results = await drawRaffle();
    for (const r of results) {
      expect(r.transferredToId).toBeNull();
      expect(r.drawnAt).toBeInstanceOf(Date);
    }
  });

  it("marks the active event as drawn", async () => {
    await drawRaffle();
    expect(prisma.raffleEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "e1" }),
        data: { drawnAt: expect.any(Date) },
      }),
    );
  });

  it("does not always pick the same winners (shuffle is effective)", async () => {
    const runs = await Promise.all([drawRaffle(), drawRaffle(), drawRaffle()]);
    const signatures = runs.map((r) => r.map((p) => p.winnerId).join(","));
    expect(new Set(signatures).size).toBeGreaterThan(1);
  });

  it("runs the whole draw inside a single transaction", async () => {
    await drawRaffle();
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.$transaction.mock.calls[0][0]).toBeTypeOf("function");
  });

  it("claims the event atomically before writing any prize", async () => {
    await drawRaffle();
    // `drawnAt: null` in the filter is what makes a concurrent draw lose.
    expect(prisma.raffleEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ drawnAt: null }),
      }),
    );
    expect(
      prisma.raffleEvent.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(prisma.rafflePrize.update.mock.invocationCallOrder[0]);
  });

  it("aborts when a concurrent draw already claimed the event", async () => {
    prisma.raffleEvent.updateMany.mockResolvedValue({ count: 0 });
    await expect(drawRaffle()).rejects.toThrow(/já foi realizado/i);
    expect(prisma.rafflePrize.update).not.toHaveBeenCalled();
  });
});

describe("transferPrize", () => {
  beforeEach(() => getSession.mockResolvedValue(userSession("winner-1")));

  it("requires authentication", async () => {
    getSession.mockResolvedValue(null);
    await expect(transferPrize("p1", "u2")).rejects.toThrow(
      /Autenticação necessária/i,
    );
  });

  it("rejects an unknown prize", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue(null);
    await expect(transferPrize("nope", "u2")).rejects.toThrow(
      /Prêmio não encontrado/i,
    );
  });

  it("rejects a caller who is not the winner", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "someone-else",
      transferredToId: null,
    });
    await expect(transferPrize("p1", "u2")).rejects.toThrow(
      /não é o ganhador/i,
    );
  });

  it("rejects a prize that was already transferred", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "winner-1",
      transferredToId: "u9",
    });
    await expect(transferPrize("p1", "u2")).rejects.toThrow(
      /já foi transferido/i,
    );
  });

  it("rejects an unknown recipient", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "winner-1",
      transferredToId: null,
    });
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(transferPrize("p1", "ghost")).rejects.toThrow(
      /Destinatário não encontrado/i,
    );
  });

  it("rejects a recipient who is not a participant", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "winner-1",
      transferredToId: null,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "u2",
      isParticipant: false,
    });
    await expect(transferPrize("p1", "u2")).rejects.toThrow(
      /não é um participante/i,
    );
  });

  it("rejects a self-transfer", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "winner-1",
      transferredToId: null,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "winner-1",
      isParticipant: true,
    });
    await expect(transferPrize("p1", "winner-1")).rejects.toThrow(
      /para si mesmo/i,
    );
  });

  it("REGRESSION: refuses to transfer a prize to an admin", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "winner-1",
      transferredToId: null,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      isParticipant: true,
      role: "admin",
    });
    await expect(transferPrize("p1", "admin-1")).rejects.toThrow();
  });

  it("writes the prize update and the audit log in one transaction", async () => {
    prisma.rafflePrize.findUnique.mockResolvedValue({
      id: "p1",
      winnerId: "winner-1",
      transferredToId: null,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "u2",
      isParticipant: true,
      role: "user",
    });
    prisma.rafflePrize.update.mockResolvedValue({
      id: "p1",
      transferredToId: "u2",
    });
    prisma.transferLog.create.mockResolvedValue({ id: "log-1" });

    const result = await transferPrize("p1", "u2");

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.transferLog.create).toHaveBeenCalledWith({
      data: { prizeId: "p1", fromUserId: "winner-1", toUserId: "u2" },
    });
    expect(result).toMatchObject({ transferredToId: "u2" });
  });
});

describe("read helpers", () => {
  it("getRaffleResults returns prizes ordered by prizeNumber", async () => {
    prisma.rafflePrize.findMany.mockResolvedValue(makePrizes(5));
    await getRaffleResults();
    expect(prisma.rafflePrize.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { prizeNumber: "asc" } }),
    );
  });

  it("getRaffleEvent only looks at the active event", async () => {
    prisma.raffleEvent.findFirst.mockResolvedValue(null);
    await getRaffleEvent();
    expect(prisma.raffleEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
