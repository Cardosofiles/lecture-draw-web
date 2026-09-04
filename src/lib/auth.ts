import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { env } from '@/shared/env'

/**
 * As origens que o Better Auth aceita como destino de callback.
 *
 * O `Set` deduplica o caso comum em desenvolvimento, onde BETTER_AUTH_URL e
 * NEXT_PUBLIC_APP_URL são ambos `http://localhost:3000`. Os dois literais de
 * localhost só entram fora de produção — em produção, listar localhost como
 * origem confiável é superfície de ataque sem contrapartida.
 */
const trustedOrigins = Array.from(
  new Set([
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
    ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']),
  ])
)

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  trustedOrigins,

  // A plateia inteira sai pelo mesmo IP do NAT da rede do local, então a chave
  // do rate limit ("<ip>|<path>") é UMA para os ~400 participantes, não uma por
  // pessoa. Os defaults do Better Auth (3 req/10s em /sign-in*, 100 req/10s no
  // resto) viram, na prática, o teto da sala inteira e derrubariam o login nos
  // primeiros minutos do evento. Os limites abaixo são dimensionados para a
  // sala, mantendo um teto que ainda barra abuso vindo de um IP único.
  rateLimit: {
    // O default só liga em produção; ligar sempre faz dev e CI exercitarem
    // exatamente o limite que vai para o ar.
    enabled: true,
    // Armazenamento em memória é por instância: em serverless o teto efetivo
    // vira (instâncias × max). Aceitável aqui — isto é válvula de segurança,
    // não fronteira de segurança — e evita 2 idas ao Neon por request de auth.
    storage: 'memory',
    window: 60,
    max: 2000,
    customRules: {
      // Pico de chegada: a sala toda logando nos mesmos poucos minutos.
      '/sign-in/social': { window: 60, max: 900 },
      '/callback/*': { window: 60, max: 900 },
      '/get-session': { window: 60, max: 2000 },
      // Nada legítimo martela estes caminhos.
      '/sign-out': { window: 60, max: 120 },
      '/delete-user': { window: 60, max: 20 },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
      isParticipant: {
        type: 'boolean',
        defaultValue: true,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-enroll new users — but admins are excluded from the raffle.
          // `role` is always its "user" default at create time (the seed promotes
          // the admin afterwards), so the admin has to be spotted by e-mail.
          //
          // Lido de `process.env` a cada chamada, e não do `env` validado: o
          // schema resolve os valores uma única vez, no import, e a suíte de
          // integração troca ADMIN_EMAIL em runtime (`vi.stubEnv`) para exercitar
          // este ramo sem recriar o admin real. A presença e o formato continuam
          // garantidos no boot por `src/shared/env`.
          const adminEmail = (process.env.ADMIN_EMAIL ?? env.ADMIN_EMAIL).toLowerCase()
          if (user.email?.toLowerCase() === adminEmail) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'admin', isParticipant: false },
            })
            return
          }
          // Upsert, not create-and-swallow: a duplicate-key INSERT aborts the
          // surrounding Postgres transaction, so catching the error in JS is not
          // enough to make a retried OAuth callback safe.
          await prisma.raffleEntry.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
          })
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
