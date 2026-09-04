import type { MetadataRoute } from 'next'

import { SITE } from '@/shared/utils/seo/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.title,
    short_name: SITE.shortName,
    description: SITE.description,
    lang: 'pt-BR',
    start_url: '/',
    display: 'standalone',
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'maskable',
      },
    ],
  }
}
