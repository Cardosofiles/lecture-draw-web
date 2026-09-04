import type { MetadataRoute } from 'next'

import { PUBLIC_PATHS, SITE } from '@/shared/utils/seo/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, SITE.url).toString(),
    lastModified,
    changeFrequency: path === '/' ? ('daily' as const) : ('weekly' as const),
    priority: path === '/' ? 1.0 : 0.8,
  }))
}
