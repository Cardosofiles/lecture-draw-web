import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * URL de origem: exige http/https e remove a barra final.
 *
 * `z.url()` sozinho não serve aqui. Ele valida pelo parser da WHATWG, para o
 * qual `localhost:3000` é uma URL legítima — protocolo `localhost:`, caminho
 * `3000`. Esse valor passaria na validação e só quebraria depois, no
 * `redirect_uri` mandado ao Google. O `protocol` fecha essa porta.
 *
 * A barra final é normalizada em vez de recusada porque `https://app.com/` é
 * uma configuração correta escrita de outro jeito — mas concatenada com
 * `/api/auth/...` viraria `//api/auth/...`, e o provedor recusa o callback.
 */
const originUrl = (error: string) =>
  z.url({ protocol: /^https?$/, error }).transform((value) => value.replace(/\/+$/, ''))

/**
 * O contrato de ambiente da aplicação, validado no import.
 *
 * Antes disto o código lia `process.env.X!` e `process.env.X ?? 'http://localhost:3000'`
 * espalhados pela árvore. Os dois padrões escondem exatamente a falha que
 * derrubou o login em produção: uma variável ausente virava `undefined` (e o
 * Better Auth subia com `clientId: undefined`) ou caía no fallback de
 * localhost (e o `redirect_uri` do OAuth apontava para a máquina do dev).
 * Aqui a ausência é um erro de boot com o nome da variável, não um 500 no meio
 * do fluxo de autenticação.
 *
 * `emptyStringAsUndefined` é o que faz `DATABASE_URL=` (linha vazia, como no
 * `.env.example`) ser tratado como ausente em vez de passar como string vazia.
 */
export const env = createEnv({
  server: {
    /**
     * String de conexão do Postgres — Neon em produção, Docker na porta 5433
     * localmente. O `startsWith` recusa cedo um valor que não é Postgres;
     * `sslmode=verify-full&channel_binding=require` da Neon passa normalmente.
     */
    DATABASE_URL: z
      .string()
      .min(1)
      .refine(
        (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
        'DATABASE_URL precisa ser uma connection string PostgreSQL (postgresql://…)'
      ),

    /**
     * Segredo de assinatura dos cookies de sessão do Better Auth.
     *
     * 32 caracteres é o piso de `openssl rand -base64 32`. Um segredo trocado
     * entre deploys invalida toda sessão emitida antes — o que, no dia do
     * evento, é a plateia inteira sendo deslogada de uma vez.
     */
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, 'BETTER_AUTH_SECRET precisa ter ao menos 32 caracteres (openssl rand -base64 32)'),

    /**
     * A origem pública da aplicação, do ponto de vista do servidor.
     *
     * É daqui que sai o `redirect_uri` enviado ao Google e ao GitHub. Se
     * divergir do que está cadastrado no console de cada provedor, o callback
     * volta com erro e o login não completa — por isso é obrigatória e sem
     * fallback: em produção, um default de localhost quebra silenciosamente.
     */
    BETTER_AUTH_URL: originUrl(
      'BETTER_AUTH_URL precisa ser uma URL http(s) absoluta — ex.: https://seu-app.vercel.app'
    ),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    /** E-mail promovido a admin no seed; admins não concorrem ao sorteio (BR-03). */
    ADMIN_EMAIL: z.email(),

    /** Origem canônica para SEO. Opcional: cai em NEXT_PUBLIC_APP_URL. */
    SITE_URL: originUrl('SITE_URL precisa ser uma URL http(s) absoluta').optional(),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },

  client: {
    /** A mesma origem, exposta ao browser para o cliente do Better Auth. */
    NEXT_PUBLIC_APP_URL: originUrl(
      'NEXT_PUBLIC_APP_URL precisa ser uma URL http(s) absoluta — ex.: https://seu-app.vercel.app'
    ),
  },

  /**
   * O Next.js só substitui `process.env.NEXT_PUBLIC_*` no bundle do cliente
   * quando o acesso é literal — daí cada chave precisar ser escrita à mão aqui,
   * sem spread de `process.env`.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    SITE_URL: process.env.SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  emptyStringAsUndefined: true,

  /**
   * Escape hatch para etapas que não têm (nem precisam de) segredos: o
   * `next build` do job de lint no CI e o `next build` da imagem Docker.
   */
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
})
