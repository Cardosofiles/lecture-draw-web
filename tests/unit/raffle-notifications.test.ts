import { describe, expect, it } from "vitest";
import {
  drawRefreshedKey,
  hasBeenDrawn,
  nextPollDelay,
  pendingWinnerPrize,
  winnerSeenKey,
  type PrizeSnapshot,
} from "@/lib/raffle-notifications";

const DRAW_1 = "2026-09-03T22:00:00.000Z";
const DRAW_2 = "2026-09-03T23:30:00.000Z";

function prize(over: Partial<PrizeSnapshot> = {}): PrizeSnapshot {
  return {
    id: "prize-1",
    prizeNumber: 1,
    description: "PC Setup #1",
    winnerId: null,
    transferredToId: null,
    drawnAt: DRAW_1,
    ...over,
  };
}

/** Stand-in for one browser's localStorage, shared by everyone using it. */
function storage() {
  const seen = new Set<string>();
  return {
    has: (k: string) => seen.has(k),
    mark: (k: string) => seen.add(k),
    size: () => seen.size,
  };
}

describe("winner modal targeting", () => {
  it("shows the modal to the user who won", () => {
    const prizes = [prize({ winnerId: "ana" })];
    const store = storage();
    expect(pendingWinnerPrize(prizes, "ana", store.has)).toMatchObject({
      id: "prize-1",
    });
  });

  it("shows nothing to a user who did not win", () => {
    const prizes = [prize({ winnerId: "ana" })];
    expect(pendingWinnerPrize(prizes, "bruno", storage().has)).toBeNull();
  });

  it("shows nothing before the draw", () => {
    const prizes = [prize({ winnerId: null, drawnAt: null })];
    expect(pendingWinnerPrize(prizes, "ana", storage().has)).toBeNull();
  });

  it("does not repeat the modal for the same user and draw", () => {
    const prizes = [prize({ winnerId: "ana" })];
    const store = storage();
    const first = pendingWinnerPrize(prizes, "ana", store.has)!;
    store.mark(winnerSeenKey("ana", first));
    expect(pendingWinnerPrize(prizes, "ana", store.has)).toBeNull();
  });

  it("REGRESSION: two users sharing one browser each get their own modal", () => {
    // The old key was a single global flag, so whoever opened the page first
    // permanently suppressed the modal for everyone else on that device.
    const store = storage();
    const prizes = [
      prize({ id: "p1", prizeNumber: 1, winnerId: "ana" }),
      prize({ id: "p2", prizeNumber: 2, winnerId: "bruno" }),
    ];

    const anaPrize = pendingWinnerPrize(prizes, "ana", store.has)!;
    store.mark(winnerSeenKey("ana", anaPrize));
    expect(anaPrize.id).toBe("p1");

    const brunoPrize = pendingWinnerPrize(prizes, "bruno", store.has);
    expect(brunoPrize, "Bruno was silently skipped").not.toBeNull();
    expect(brunoPrize!.id).toBe("p2");
  });

  it("REGRESSION: a re-draw notifies the winner again", () => {
    const store = storage();
    const first = [prize({ winnerId: "ana", drawnAt: DRAW_1 })];
    store.mark(winnerSeenKey("ana", pendingWinnerPrize(first, "ana", store.has)!));
    expect(pendingWinnerPrize(first, "ana", store.has)).toBeNull();

    const second = [prize({ winnerId: "ana", drawnAt: DRAW_2 })];
    expect(
      pendingWinnerPrize(second, "ana", store.has),
      "a second draw reused the first draw's flag",
    ).not.toBeNull();
  });

  it("keeps one flag per user per draw", () => {
    const store = storage();
    store.mark(winnerSeenKey("ana", prize({ winnerId: "ana" })));
    store.mark(winnerSeenKey("bruno", prize({ id: "p2", winnerId: "bruno" })));
    expect(store.size()).toBe(2);
  });
});

describe("router refresh key", () => {
  it("is stable within one draw and changes on the next", () => {
    const a = drawRefreshedKey([prize({ winnerId: "ana", drawnAt: DRAW_1 })]);
    const b = drawRefreshedKey([prize({ winnerId: "ana", drawnAt: DRAW_1 })]);
    const c = drawRefreshedKey([prize({ winnerId: "ana", drawnAt: DRAW_2 })]);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });
});

describe("hasBeenDrawn", () => {
  it("is false while every prize is unassigned", () => {
    expect(hasBeenDrawn([prize(), prize({ id: "p2" })])).toBe(false);
  });

  it("is true as soon as one prize has a winner", () => {
    expect(hasBeenDrawn([prize(), prize({ id: "p2", winnerId: "ana" })])).toBe(
      true,
    );
  });
});

describe("poll pacing", () => {
  it("starts at ~8s instead of the old 3s", () => {
    expect(nextPollDelay(0, () => 0.5)).toBe(8_000);
  });

  it("jitters so simultaneous tabs drift apart", () => {
    expect(nextPollDelay(0, () => 0)).toBe(6_400);
    expect(nextPollDelay(0, () => 0.999)).toBeGreaterThan(9_500);
  });

  it("backs off as the wait drags on, capped at a minute", () => {
    expect(nextPollDelay(20, () => 0.5)).toBe(16_000);
    expect(nextPollDelay(40, () => 0.5)).toBe(32_000);
    expect(nextPollDelay(400, () => 0.5)).toBe(60_000);
  });

  it("keeps 400 attendees under a sane request rate", () => {
    const delay = nextPollDelay(0, () => 0.5);
    const reqPerSecond = (400 / delay) * 1000;
    expect(reqPerSecond).toBeLessThan(60);
  });
});
