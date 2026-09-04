import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllParticipants } from '@/actions/users'
import { ParticipantsView } from '@/modules/dashboard/participants/ui/views/participants-view'

export const metadata = { title: 'Participantes — AI Lecture Raffle' }

export default async function ParticipantsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const participants = await getAllParticipants()

  return <ParticipantsView participants={participants} currentUserId={session.user.id} />
}
