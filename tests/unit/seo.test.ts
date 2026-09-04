import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import manifest from '@/app/manifest'
import * as opengraphImage from '@/app/opengraph-image'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import * as twitterImage from '@/app/twitter-image'
import { PRIVATE_PATHS, PUBLIC_PATHS, SITE } from '@/shared/utils/seo/site'

describe('SEO & Metadata Architecture', () => {
  describe('Site Configuration (site.ts)', () => {
    it('should define canonical site properties correctly', () => {
      expect(SITE.name).toContain('AI Lecture')
      expect(SITE.title).toContain('Spec-Driven Development')
      expect(SITE.url).not.toMatch(/\/+$/) // no trailing slash
      expect(SITE.keywords.length).toBeGreaterThan(5)
      expect(SITE.author.name).toBeDefined()
      expect(SITE.locale).toBe('pt_BR')
      expect(SITE.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should expose public and private paths for crawlers', () => {
      expect(PUBLIC_PATHS).toContain('/')
      expect(PUBLIC_PATHS).toContain('/login')
      expect(PRIVATE_PATHS).toContain('/api/')
      expect(PRIVATE_PATHS).toContain('/dashboard')
      expect(PRIVATE_PATHS).toContain('/sql-console')
    })
  })

  describe('Robots (robots.ts)', () => {
    it('should disallow private paths and expose the sitemap', () => {
      const robotsConfig = robots()
      expect(robotsConfig.rules).toBeDefined()
      expect(robotsConfig.sitemap).toBe(`${SITE.url}/sitemap.xml`)
      expect(robotsConfig.host).toBe(SITE.url)

      const disallowList = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules.flatMap((r) => r.disallow ?? [])
        : (robotsConfig.rules.disallow ?? [])

      for (const path of PRIVATE_PATHS) {
        expect(disallowList).toContain(path)
      }
    })
  })

  describe('Sitemap (sitemap.ts)', () => {
    it('should generate valid entries for all public paths', () => {
      const entries = sitemap()
      expect(entries).toHaveLength(PUBLIC_PATHS.length)

      for (const path of PUBLIC_PATHS) {
        const expectedUrl = new URL(path, SITE.url).toString()
        const match = entries.find((e) => e.url === expectedUrl)
        expect(match).toBeDefined()
        expect(match?.lastModified).toBeInstanceOf(Date)
        expect(match?.priority).toBeGreaterThan(0)
      }
    })
  })

  describe('Web Manifest (manifest.ts)', () => {
    it('should return compliant manifest properties', () => {
      const pwaManifest = manifest()
      expect(pwaManifest.name).toBe(SITE.title)
      expect(pwaManifest.short_name).toBe(SITE.shortName)
      expect(pwaManifest.background_color).toBe(SITE.themeColor)
      expect(pwaManifest.theme_color).toBe(SITE.themeColor)
      expect(pwaManifest.icons).toBeDefined()
      expect(pwaManifest.icons?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Social Sharing Cards (OpenGraph / Twitter)', () => {
    it('should export correct OpenGraph dimensions and metadata', () => {
      expect(opengraphImage.size).toEqual({ width: 1200, height: 630 })
      expect(opengraphImage.contentType).toBe('image/png')
      expect(opengraphImage.alt).toBe(SITE.title)
    })

    it('should re-export identical properties for Twitter cards', () => {
      expect(twitterImage.size).toEqual(opengraphImage.size)
      expect(twitterImage.contentType).toBe(opengraphImage.contentType)
      expect(twitterImage.alt).toBe(opengraphImage.alt)
    })
  })

  describe('Brand Assets & Fonts', () => {
    it('should have required TTF font files on disk for ImageResponse rendering', () => {
      const fontsDir = join(process.cwd(), 'src/shared/assets/fonts')
      expect(existsSync(join(fontsDir, 'Inter-Regular.ttf'))).toBe(true)
      expect(existsSync(join(fontsDir, 'Inter-Bold.ttf'))).toBe(true)
    })
  })
})
