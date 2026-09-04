export interface PrizeSnapshot {
  id: string
  prizeNumber: number
  description: string
  winnerId: string | null
  transferredToId: string | null
  drawnAt?: string | Date | null
}

/**
 * Identifies one winner notification. Scoped to the user so two people sharing a
 * browser each get their own modal, and to the draw so a re-run shows it again.
 */
export function winnerSeenKey(userId: string, prize: PrizeSnapshot): string {
  const drawnAt = prize.drawnAt ? new Date(prize.drawnAt).toISOString() : 'undrawn'
  return `raffle_winner_seen:${userId}:${prize.id}:${drawnAt}`
}

export function drawRefreshedKey(prizes: PrizeSnapshot[]): string {
  const stamp = prizes
    .map((p) => (p.drawnAt ? new Date(p.drawnAt).toISOString() : ''))
    .filter(Boolean)
    .sort()
    .at(-1)
  return `raffle_draw_refreshed:${stamp ?? 'none'}`
}

export function hasBeenDrawn(prizes: PrizeSnapshot[]): boolean {
  return prizes.some((p) => p.winnerId)
}

/**
 * The prize to celebrate for this viewer, or null. Returns a prize only when the
 * viewer actually won it and this exact notification has not been shown yet.
 */
export function pendingWinnerPrize(
  prizes: PrizeSnapshot[],
  userId: string,
  hasSeen: (key: string) => boolean
): PrizeSnapshot | null {
  if (!hasBeenDrawn(prizes)) return null
  const mine = prizes.find((p) => p.winnerId === userId)
  if (!mine) return null
  return hasSeen(winnerSeenKey(userId, mine)) ? null : mine
}

/**
 * Poll delay in ms. Backs off as the wait drags on and adds jitter, so 400 tabs
 * opened at the same moment do not stay locked in step hammering the endpoint.
 */
export function nextPollDelay(attempt: number, random = Math.random): number {
  const base = Math.min(8_000 * 2 ** Math.floor(attempt / 20), 60_000)
  return Math.round(base * (0.8 + random() * 0.4))
}
