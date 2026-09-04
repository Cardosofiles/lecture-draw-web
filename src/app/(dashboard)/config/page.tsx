import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { ConfigView } from '@/modules/dashboard/config/ui/views/config-view'

export const metadata: Metadata = { title: 'Configurações — AI Lecture Raffle' }

/**
 * O guard de sessão fica aqui, como nas demais páginas do grupo — o proxy
 * cobre a rota, mas quem lê `session` do banco é o servidor.
 */
export default async function ConfigPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return <ConfigView />
}
