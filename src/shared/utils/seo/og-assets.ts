import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Recursos visuais, SVGs e fontes vetorizadas utilizados pelo `ImageResponse`
 * (`apple-icon.tsx`, `opengraph-image.tsx`, etc.).
 *
 * Satori (motor do `ImageResponse`) exige fontes em TTF ou OTF lidas em buffer;
 * não oferece suporte a WOFF2. As fontes residem em `src/shared/assets/fonts/` e
 * são carregadas em runtime no servidor durante a geração dos assets de imagem.
 */

const FONTS_DIR = join(process.cwd(), 'src/shared/assets/fonts')

const loadBrandFonts = async () => {
  const [regular, bold] = await Promise.all([
    readFile(join(FONTS_DIR, 'Inter-Regular.ttf')),
    readFile(join(FONTS_DIR, 'Inter-Bold.ttf')),
  ])

  return [
    { name: 'Inter', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: bold, weight: 700 as const, style: 'normal' as const },
  ]
}

/**
 * Glifo que representa a interface de desenvolvimento / terminal HUD:
 * Prompt de comando `>` acompanhado pelo cursor `_`.
 */
const TERMINAL_GLYPH = `
  <path d="M7 9L14 16L7 23" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="17" y1="23" x2="25" y2="23" stroke="#FF39D2" stroke-width="2.5" stroke-linecap="round"/>
`

const toDataUri = (svg: string): string =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

/**
 * Marca do AI Lecture em formato SVG para a barra do OpenGraph.
 * Combina o visual de container HUD escuro com acentos em Cyan (#00e5ff) e Magenta (#ff39d2).
 */
const brandSymbolDataUri = (accent = '#00E5FF'): string =>
  toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
    <rect x="2" y="2" width="28" height="28" rx="7" fill="#03060C" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.6"/>
    <rect x="5" y="5" width="22" height="22" rx="4" fill="${accent}" fill-opacity="0.08"/>
    ${TERMINAL_GLYPH}
    <circle cx="27" cy="5" r="2.5" fill="#2CF2A3"/>
  </svg>`)

/**
 * Variante do ícone do aplicativo para Apple Touch Icon e WebManifest.
 * Fundo sólido com alto contraste para visibilidade em alta e baixa densidade de pixels.
 */
const appIconDataUri = (radius = 0): string =>
  toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="cyber-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#0a1426"/>
        <stop offset="100%" stop-color="#03060c"/>
      </linearGradient>
      <linearGradient id="neon-border" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#00e5ff"/>
        <stop offset="100%" stop-color="#ff39d2"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="${radius}" fill="url(#cyber-bg)"/>
    <rect x="1" y="1" width="30" height="30" rx="${Math.max(0, radius - 1)}" stroke="url(#neon-border)" stroke-width="1.8"/>
    ${TERMINAL_GLYPH}
    <circle cx="26" cy="6" r="2.2" fill="#2cf2a3"/>
  </svg>`)

/**
 * Backdrop HUD em SVG para a imagem de Open Graph.
 * Inclui grid cibernético com iluminação em Cyan (#00e5ff) e Magenta (#ff39d2).
 */
const hudBackdropDataUri = (lineY = 420): string =>
  toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" fill="none">
    <defs>
      <radialGradient id="cyan-glow" cx="20%" cy="15%" r="50%">
        <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.25"/>
        <stop offset="60%" stop-color="#00e5ff" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="magenta-glow" cx="85%" cy="85%" r="55%">
        <stop offset="0%" stop-color="#ff39d2" stop-opacity="0.22"/>
        <stop offset="65%" stop-color="#ff39d2" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#ff39d2" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hud-line" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#00e5ff" stop-opacity="0"/>
        <stop offset="25%" stop-color="#00e5ff" stop-opacity="0.8"/>
        <stop offset="75%" stop-color="#ff39d2" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#ff39d2" stop-opacity="0"/>
      </linearGradient>
      <pattern id="cyber-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="630" fill="#03060c"/>
    <rect width="1200" height="630" fill="url(#cyber-grid)"/>
    <rect width="1200" height="630" fill="url(#cyan-glow)"/>
    <rect width="1200" height="630" fill="url(#magenta-glow)"/>
    <line x1="0" y1="${lineY}" x2="1200" y2="${lineY}" stroke="url(#hud-line)" stroke-width="2"/>
  </svg>`)

export { appIconDataUri, brandSymbolDataUri, hudBackdropDataUri, loadBrandFonts }
