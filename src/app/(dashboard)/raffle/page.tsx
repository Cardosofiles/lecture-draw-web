import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRaffleResults, getRaffleEvent } from '@/actions/raffle'
import { RaffleView } from '@/modules/dashboard/raffle/ui/views/raffle-view'

export const metadata = { title: 'Sorteio — AI Lecture Raffle' }

export default async function RafflePageRoute() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const [prizes, event] = await Promise.all([getRaffleResults(), getRaffleEvent()])

  return (
    <RaffleView
      prizes={prizes}
      event={event}
      currentUserId={session.user.id}
      isAdmin={session.user.role === 'admin'}
    />
  )
}
