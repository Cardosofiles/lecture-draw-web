import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from '@/lib/auth'
import { env } from '@/shared/env'

/**
 * No browser a origem vem de `window.location.origin`, e não da env.
 *
 * É o que mantém o cookie de sessão e o callback do OAuth na mesma origem que
 * o participante realmente digitou — inclusive nos previews da Vercel, onde
 * cada deploy ganha um domínio próprio que a env não conhece.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : env.NEXT_PUBLIC_APP_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
})

export const { signIn, signOut, useSession, getSession } = authClient
