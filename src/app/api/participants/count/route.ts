import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// BR-09: public participant count — consumed by the unauthenticated /login page.
// Only an aggregate is exposed, never participant data.
export async function GET() {
  const count = await prisma.raffleEntry.count({
    where: { user: { role: { not: 'admin' } } },
  })
  return NextResponse.json({ count })
}
