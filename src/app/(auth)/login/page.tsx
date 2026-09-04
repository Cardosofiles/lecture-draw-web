import type { Metadata } from 'next'

import { LoginView } from '@/modules/auth/ui/views/login-view'

export const metadata: Metadata = {
  title: 'Entrar — AI Lecture Raffle',
  robots: { index: false, follow: false },
}

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

/**
 * A rota de login é um Server Component fino: lê o `?error=` que o provedor
 * social devolve e entrega a tela ao cliente.
 *
 * Ler o parâmetro aqui — e não com `useSearchParams` lá dentro — é o que
 * dispensa o `<Suspense>` que antes envolvia a tela inteira.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {}
  const error = typeof params.error === 'string' ? params.error : undefined

  return <LoginView socialError={error} />
}
