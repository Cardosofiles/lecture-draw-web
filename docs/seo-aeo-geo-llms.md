# SEO, AEO/GEO e llms.txt — Guia da Aplicação `lecture-draw-web`

Este documento explica, de forma didática e técnica, **o que foi implementado** para tornar o sistema da palestra **AI Lecture (Spec-Driven Development — SDD)** descobrível por buscadores tradicionais (SEO), por motores de resposta direta (AEO), por motores generativos de IA (GEO) e por modelos de linguagem através do padrão `llms.txt`.

---

## 1. Os Quatro Pilares de Otimização

| Conceito     | Significado                    | Quem Consome                        | Objetivo Principal                                              |
| :----------- | :----------------------------- | :---------------------------------- | :-------------------------------------------------------------- |
| **SEO**      | Search Engine Optimization     | Google, Bing                        | Indexação, autoridade e ranqueamento em resultados de busca.    |
| **AEO**      | Answer Engine Optimization     | Google Featured Snippets, Siri      | Ser a **resposta direta e assertiva** para dúvidas de usuários. |
| **GEO**      | Generative Engine Optimization | ChatGPT, Perplexity, Claude, Gemini | Ser **compreendido e citado** em respostas geradas por IA.      |
| **llms.txt** | Machine-Readable Web Standard  | Crawlers de LLM (GPTBot, ClaudeBot) | Entregar um mapa semântico curado sem ruído de layout/HTML.     |

Enquanto o SEO clássico prioriza palavras-chave e URLs canônicas, **AEO e GEO priorizam dados estruturados (JSON-LD), semântica e respostas objetivas**.

---

## 2. O que foi Implementado na Aplicação

### 2.1 `src/app/sitemap.ts` → `/sitemap.xml`

Gera dinamicamente o mapa XML do site a partir da constante canônica `PUBLIC_PATHS` em [`src/shared/utils/seo/site.ts`](file:///home/cardosofiles/www/typescript/front-end/development/next/lecture-draw-web/src/shared/utils/seo/site.ts).

- Define `lastModified`, `changeFrequency` e `priority` diferenciada (`1.0` para `/` e `0.8` para `/login`).
- Evita indexar rotas autenticadas (`/dashboard`, `/raffle`, `/sql-console`) que exigiriam sessão.

### 2.2 `src/app/robots.ts` → `/robots.txt`

Controla o acesso de crawlers aos endpoints da aplicação.

- Permite rastreamento irrestrito das páginas públicas (`/` e `/login`).
- Bloqueia explicitamente todas as `PRIVATE_PATHS` (`/api/`, `/dashboard`, `/raffle`, `/participants`, `/transfer`, `/sql-console`, `/config`).
- Declara a URL canônica do sitemap (`/sitemap.xml`) e o host de produção.

### 2.3 `src/app/manifest.ts` → `/manifest.webmanifest`

Web App Manifest nativo do Next.js para suporte a PWA (Progressive Web App).

- Define `name`, `short_name`, `theme_color` (`#03060c`), `background_color` (`#03060c`) e `display: standalone`.
- Aponta para os ícones `/icon.svg` e `/apple-icon` (com propósito `maskable`).

### 2.4 `src/app/apple-icon.tsx` e `src/app/icon.svg`

Ícones de aplicação otimizados para navegadores e dispositivos móveis.

- **`icon.svg`**: Ícone vetorial nítido em qualquer escala, com paleta HUD Cyberpunk (gradiente escuro, borda neon cyan/magenta, glifo de prompt e status verde).
- **`apple-icon.tsx`**: Renderiza via `ImageResponse` (180x180 PNG) com preenchimento total até a borda (`radius: 0`), permitindo que o iOS aplique a sua própria máscara sem gerar bordas indesejadas.

### 2.5 `src/app/opengraph-image.tsx` e `src/app/twitter-image.tsx`

Gerador dinâmico de cards sociais (1200×630 PNG) renderizado no servidor com o motor Satori do `next/og`.

- **Identidade da Palestra**: Foco absoluto no tema **Spec-Driven Development (SDD) com Inteligência Artificial** na Unitri.
- **Linha Divisória e Alinhamento**: Divisor HUD horizontal gradiente (`#00e5ff` a `#ff39d2`) calibrado em `Y = 418px`.
- **Posicionamento do Badge**: O badge com moldura magenta (`SORTEIO AO VIVO: 5 Configurações de Computadores Completos...`) fica explicitamente posicionado **abaixo da linha divisória horizontal**, sem qualquer sobreposição.
- **Fontes Locais TTF**: Carrega `Inter-Regular.ttf` e `Inter-Bold.ttf` de [`src/shared/assets/fonts/`](file:///home/cardosofiles/www/typescript/front-end/development/next/lecture-draw-web/src/shared/assets/fonts) em runtime no servidor (já que o Satori não suporta WOFF2).
- **Twitter Card**: [`src/app/twitter-image.tsx`](file:///home/cardosofiles/www/typescript/front-end/development/next/lecture-draw-web/src/app/twitter-image.tsx) reexporta as definições do Open Graph, garantindo paridade visual sem duplicação de código.

### 2.6 `metadata`, `viewport` e JSON-LD em `src/app/layout.tsx`

- **`metadataBase`**: Define a URL base canônica absoluta para resolução de todos os caminhos relativos de imagens e metadados.
- **`viewport`**: Configuração isolada conforme especificação do Next.js 16 (`themeColor: #03060c`, `colorScheme: 'dark'`).
- **Dados Estruturados Schema.org**: Injeta no `<head>` um script JSON-LD com grafo contendo `WebSite` e `Event` (`AI Lecture — Palestra & Sorteio de Computadores Unitri`), habilitando Rich Snippets e entendimento semântico por buscadores e IAs.

### 2.7 Otimizações de Core Web Vitals (LCP, CLS, INP)

- **Eliminação de `@import` externo**: Removido o `@import url('https://fonts.googleapis.com...')` do `globals.css`, eliminando o bloqueio de renderização do CSS crítico.
- **`next/font/google`**: Implementado em [`src/shared/utils/fonts.ts`](file:///home/cardosofiles/www/typescript/front-end/development/next/lecture-draw-web/src/shared/utils/fonts.ts) com as variáveis `--font-body` (Inter), `--font-display` (Space Grotesk) e `--font-mono` (JetBrains Mono).
- **Zero Layout Shift (CLS)**: O Next.js pré-carrega os subsets necessários e injeta fontes inline, prevenindo FOUT (Flash of Unstyled Text).

### 2.8 `public/llms.txt` e `public/llms-full.txt`

Seguindo o padrão aberto internacional de [llmstxt.org](https://llmstxt.org):

- **`public/llms.txt`**: Documento em Markdown sucinto com o resumo da palestra, links públicos, arquitetura técnica e regras gerais do sorteio.
- **`public/llms-full.txt`**: Versão completa com FAQ técnica detalhada para motores generativos (ChatGPT, Claude, Perplexity, Gemini), detalhando algoritmo Fisher-Yates, quórum, regras de NAT/concorrência e modelo de dados.

---

## 3. Como Estender e Manter

1. **Alteração de URLs ou Textos Globais**:
   - Modifique apenas [`src/shared/utils/seo/site.ts`](file:///home/cardosofiles/www/typescript/front-end/development/next/lecture-draw-web/src/shared/utils/seo/site.ts). O valor se propaga automaticamente para `layout.tsx`, `robots.ts`, `sitemap.ts`, `manifest.ts` e cards sociais.
2. **Novas Rotas Públicas**:
   - Inclua a rota em `PUBLIC_PATHS` em `site.ts`. O sitemap a incluirá instantaneamente.
3. **Novas Perguntas de FAQ para IAs**:
   - Atualize `public/llms-full.txt` e o grafo Schema.org em `src/app/layout.tsx`.

---

## 4. Como Validar

Execute os scripts de validação:

```bash
pnpm typecheck        # Validação estática de tipos TypeScript
pnpm test:unit        # Executa suite com testes dedicados em tests/unit/seo.test.ts
pnpm lint:check       # Validação de regras do ESLint
pnpm format:check     # Validação de estilo de código Prettier
pnpm build            # Valida compilação estática do Next.js de sitemap, robots, manifest e og:image
```

Para validação em navegadores e ferramentas externas:

- **Playwright / Chromium**: Acessar `http://localhost:3001/opengraph-image` ou `/apple-icon`.
- **Google Rich Results Test**: Validar os tipos `WebSite` e `Event` do JSON-LD.
- **Schema.org Validator**: Validar conformidade dos metadados estruturados.
- **Arquivos LLM**: Abrir `/llms.txt` e `/llms-full.txt` para checar entrega de texto puro em UTF-8.
