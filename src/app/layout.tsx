import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { inter, jetbrainsMono, spaceGrotesk } from '@/shared/utils/fonts'
import { SITE } from '@/shared/utils/seo/site'

export const metadata: Metadata = {
  // Base canônica absoluta para resolução de URLs relativas (og:image, canonical, etc.)
  metadataBase: new URL(SITE.url),

  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.shortName,
  category: 'technology',
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.author.name, url: SITE.author.url }],
  creator: SITE.author.name,
  publisher: SITE.name,

  alternates: {
    canonical: '/',
  },

  // Open Graph — imagens são gerenciadas automaticamente por opengraph-image.tsx
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: '/',
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },

  // Twitter Cards — gerenciado automaticamente por twitter-image.tsx
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: SITE.themeColor,
}

// Structured Data (JSON-LD) para otimização de Rich Results no Google
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'Event',
      '@id': `${SITE.url}/#event`,
      name: 'Palestra: Spec-Driven Development (SDD) com IA & Sorteio de PCs | Unitri',
      description: SITE.description,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'Unitri - Centro Universitário do Triângulo',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Uberlândia',
          addressRegion: 'MG',
          addressCountry: 'BR',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: SITE.author.name,
        url: SITE.author.url,
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
