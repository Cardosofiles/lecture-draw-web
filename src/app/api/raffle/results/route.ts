import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Prizes = Awaited<ReturnType<typeof queryPrizes>>

function queryPrizes() {
  return prisma.rafflePrize.findMany({
    orderBy: { prizeNumber: 'asc' },
    select: {
      id: true,
      prizeNumber: true,
      description: true,
      winnerId: true,
      transferredToId: true,
      drawnAt: true,
    },
  })
}

/**
 * Every attendee polls this endpoint and they all get byte-identical data, so a
 * short-lived cache collapses a roomful of pollers into one query per window.
 * `inFlight` matters as much as the TTL: without it a burst of 400 simultaneous
 * requests would all miss the cache and stampede the database at once.
 */
const TTL_MS = 2_000
let cache: { data: Prizes; expiresAt: number } | null = null
let inFlight: Promise<Prizes> | null = null

async function getPrizes(): Promise<Prizes> {
  if (cache && cache.expiresAt > Date.now()) return cache.data
  if (inFlight) return inFlight

  inFlight = queryPrizes()
    .then((data) => {
      cache = { data, expiresAt: Date.now() + TTL_MS }
      return data
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(await getPrizes())
}
