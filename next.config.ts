import type { NextConfig } from 'next'

// Importar o schema aqui faz o `next build` falhar cedo, com o nome da
// variável, em vez de subir um deploy que só quebra no primeiro login.
import { env } from './src/shared/env'

const appHost = new URL(env.NEXT_PUBLIC_APP_URL).host

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      /**
       * Antes esta lista era só `['localhost:3000']`. Em produção o Next ainda
       * aceitava as Server Actions por casarem origem e host, mas qualquer
       * deploy atrás de proxy (onde os dois divergem) passaria a recusá-las —
       * e o sintoma seria "Invalid Server Actions request" na exclusão de
       * conta, não uma mensagem sobre configuração.
       */
      allowedOrigins: Array.from(new Set([appHost, 'localhost:3000'])),
    },
  },
}

export default nextConfig
