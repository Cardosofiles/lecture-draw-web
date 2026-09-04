'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

/**
 * O contador "N pessoas já participando" da tela de login.
 *
 * `/api/participants/count` é público de propósito: ele roda antes de existir
 * sessão. O `refetchInterval` de 30s é folgado porque a plateia inteira sai
 * pelo mesmo IP do NAT — vide a nota de rate limit em `src/lib/auth.ts`.
 */
export function useParticipantCount() {
  return useQuery({
    queryKey: ['participant-count'],
    queryFn: async () => {
      const res = await axios.get<{ count: number }>('/api/participants/count')
      return res.data.count
    },
    refetchInterval: 30_000,
  })
}
