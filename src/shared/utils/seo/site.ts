/**
 * Fonte única da identidade textual e parâmetros de SEO do projeto.
 * `layout.tsx`, `robots.ts`, `sitemap.ts`, `manifest.ts` e geradores de imagem Open Graph
 * leem daqui para garantir coerência semântica e evitar divergências de metadados.
 */
import { env } from '@/shared/env'

const SITE = {
  name: 'AI Lecture — Spec-Driven Development (SDD)',
  shortName: 'AI Lecture SDD',
  /** Título principal exibido na aba, snippets dos mecanismos de busca e cards sociais. */
  title: 'Palestra: Spec-Driven Development (SDD) com IA & Sorteio de PCs | Unitri',
  description:
    'Palestra oficial sobre Spec-Driven Development (SDD) com Inteligência Artificial na Unitri e sorteio de 5 configurações completas de computadores para desenvolvedores.',
  locale: 'pt_BR',
  /**
   * Host canônico sem barra final. Base absoluta para canonical URL, og:url, og:image,
   * sitemap.xml e robots.txt.
   */
  url: (env.SITE_URL ?? env.NEXT_PUBLIC_APP_URL).replace(/\/+$/, ''),
  author: {
    name: 'Unitri Tech Community',
    url: 'https://www.unitri.edu.br',
  },
  keywords: [
    'spec-driven development',
    'sdd',
    'palestra spec-driven development',
    'inteligência artificial unitri',
    'engenharia de software com ia',
    'sorteio pc dev unitri',
    'sorteio de computadores',
    'desenvolvimento orientado por especificações',
    'setup programador',
    'windows 11 dev',
    'ubuntu linux dev',
    'unitri uberlandia',
    'sorteio ao vivo',
  ],
  themeColor: '#03060c',
  accentColor: '#00e5ff',
  magentaColor: '#ff39d2',
  greenColor: '#2cf2a3',
} as const

/**
 * Rotas privadas / protegidas e de backend. O `robots.ts` impede o rastreamento dessas
 * rotas para proteger áreas autenticadas e evitar páginas 401/redirecionamentos nos buscadores.
 */
const PRIVATE_PATHS = [
  '/api/',
  '/dashboard',
  '/raffle',
  '/participants',
  '/transfer',
  '/sql-console',
  '/config',
] as const

/**
 * Rotas públicas indexáveis — alimentam o `sitemap.ts`.
 */
const PUBLIC_PATHS = ['/', '/login', '/privacidade', '/creditos'] as const

export { PRIVATE_PATHS, PUBLIC_PATHS, SITE }
