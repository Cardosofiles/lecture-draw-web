import type { MetadataRoute } from 'next'

import { PRIVATE_PATHS, SITE } from '@/shared/utils/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...PRIVATE_PATHS],
    },
    sitemap: new URL('/sitemap.xml', SITE.url).toString(),
    host: SITE.url,
  }
}
