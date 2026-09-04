import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRaffleResults, getRaffleEvent } from '@/actions/raffle'
import { RafflePage } from '@/components/raffle/RafflePage'

export const metadata = { title: 'Sorteio — AI Lecture Raffle' }

export default async function RafflePageRoute() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const [prizes, event] = await Promise.all([getRaffleResults(), getRaffleEvent()])

  return (
    <RafflePage
      prizes={prizes}
      event={event}
      currentUserId={session.user.id}
      isAdmin={session.user.role === 'admin'}
    />
  )
}
