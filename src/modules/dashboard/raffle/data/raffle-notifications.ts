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
 * Qual lista de prêmios a tela deve exibir quando o servidor entrega props
 * novas. O servidor ganha sempre, com uma única exceção: quando ele ainda não
 * enxerga o sorteio que a tela já está mostrando.
 *
 * Essa exceção existe por causa da janela entre a Server Action devolver os
 * ganhadores e o `router.refresh()` alcançá-la — adotar o payload antigo nesse
 * intervalo jogaria os cards de volta para a tela de "aguardando sorteio".
 * Fora dela, tudo que vem do servidor é mais fresco do que o estado local:
 * é assim que uma transferência feita em outra aba aparece sem remontar.
 */
export function mergeServerPrizes<T extends { winnerId?: string | null }>(
  current: T[],
  incoming: T[]
): T[] {
  const incomingIsStale = !incoming.some((p) => p.winnerId) && current.some((p) => p.winnerId)
  return incomingIsStale ? current : incoming
}

/**
 * Poll delay in ms. Backs off as the wait drags on and adds jitter, so 400 tabs
 * opened at the same moment do not stay locked in step hammering the endpoint.
 */
export function nextPollDelay(attempt: number, random = Math.random): number {
  const base = Math.min(8_000 * 2 ** Math.floor(attempt / 20), 60_000)
  return Math.round(base * (0.8 + random() * 0.4))
}
