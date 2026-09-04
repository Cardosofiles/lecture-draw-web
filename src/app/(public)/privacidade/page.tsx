import type { Metadata } from 'next'

import { PrivacyView } from '@/modules/legal'
import { PublicHeader } from '@/modules/public'

const title = 'Política de Privacidade e Termos de Uso'
const description =
  'O inventário completo dos dados que o sistema de sorteio guarda sobre você — campo por campo, direto do schema do banco —, quem os vê, e como apagar tudo em um clique.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/privacidade' },
  openGraph: {
    type: 'article',
    url: '/privacidade',
    title,
    description,
  },
  twitter: { title, description },
}

export default function PrivacidadePage() {
  return (
    <>
      <PublicHeader breadcrumb={['legal', 'privacidade.md']} />
      <PrivacyView />
    </>
  )
}
