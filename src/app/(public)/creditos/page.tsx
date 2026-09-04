import type { Metadata } from 'next'

import { AUTHOR, CreditsView } from '@/modules/credits'
import { PublicHeader } from '@/modules/public'

const title = 'Créditos'
const description = `Dedicatória a ${AUTHOR.name} (@${AUTHOR.handle}), autor e desenvolvedor da plataforma de sorteio da palestra de Spec-Driven Development na Unitri.`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/creditos' },
  openGraph: {
    type: 'profile',
    url: '/creditos',
    title,
    description,
  },
  twitter: { title, description },
}

export default function CreditosPage() {
  return (
    <>
      <PublicHeader breadcrumb={['sobre', 'creditos.md']} />
      <CreditsView />
    </>
  )
}
