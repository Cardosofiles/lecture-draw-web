import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getParticipantCount } from '@/actions/users'
import { DashboardHome } from '@/components/dashboard/DashboardHome'

export const metadata = {
  title: 'Início — AI Lecture Raffle',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const [event, participantCount, prizes] = await Promise.all([
    prisma.raffleEvent.findFirst({ where: { isActive: true } }),
    getParticipantCount(),
    prisma.rafflePrize.findMany({ where: { winnerId: { not: null } } }),
  ])

  const hasBeenDrawn = prizes.length > 0

  return (
    <DashboardHome
      user={session.user}
      event={event}
      participantCount={participantCount}
      hasBeenDrawn={hasBeenDrawn}
    />
  )
}
