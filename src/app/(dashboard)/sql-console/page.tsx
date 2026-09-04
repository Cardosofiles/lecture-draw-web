import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSchemaBrowser, getQueryHistory } from '@/actions/sql-console'
import { SqlConsoleView } from '@/modules/dashboard/sql-console/ui/views/sql-console-view'

export const metadata = { title: 'SQL Console — AI Lecture Raffle' }

export default async function SqlConsolePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const [schema, history] = await Promise.all([getSchemaBrowser(), getQueryHistory()])

  return <SqlConsoleView initialSchema={schema} initialHistory={history} />
}
