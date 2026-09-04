import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

/**
 * The root is a dispatcher. It must never send a signed-in visitor to /login:
 * proxy.ts bounces them straight back here and the browser ping-pongs until
 * ERR_TOO_MANY_REDIRECTS.
 */
export default async function Home({ searchParams }: PageProps = {}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) {
    redirect('/dashboard')
  }

  const sp = searchParams ? await searchParams : {}
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') {
      params.set(key, value)
    }
  }
  const qs = params.toString()
  redirect(qs ? `/login?${qs}` : '/login')
}
