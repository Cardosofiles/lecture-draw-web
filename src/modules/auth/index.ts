/**
 * A porta pública do módulo de identidade.
 *
 * O que não está aqui é privado. `src/app/` e os outros módulos importam
 * `@/modules/auth`, nunca `@/modules/auth/ui/components/...` — é o que mantém
 * a fronteira e permite mexer na estrutura interna sem varrer a árvore.
 *
 * `@/lib/auth` (a instância servidor do Better Auth) fica **de fora de
 * propósito**: ela carrega o Prisma Client, e reexportá-la daqui puxaria o
 * banco para dentro de qualquer client component que importasse este barrel.
 */

export { authClient, getSession, signIn, signOut, useSession } from './data/auth-client'
export { useParticipantCount } from './hooks/use-participant-count'
export { AuthErrorAlert } from './ui/components/auth-error-alert'
export { getFriendlyErrorMessage } from './ui/components/auth-messages'
export { AuthSocialButton } from './ui/components/auth-social-button'
export type { SocialProvider } from './ui/components/auth-social-button'
export { LoginView } from './ui/views/login-view'
