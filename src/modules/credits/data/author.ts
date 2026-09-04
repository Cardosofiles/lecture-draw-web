/** O autor do projeto e seus canais públicos. Fonte única para a página de créditos. */
export const AUTHOR = {
  name: 'João Batista Cardoso Miranda',
  handle: 'Cardosofiles',
  role: 'Desenvolvedor Full-Stack',
  initials: 'JB',
  links: [
    {
      id: 'portfolio',
      label: 'Portfólio',
      href: 'https://www.cardosofiles.com.br/pt',
      display: 'cardosofiles.com.br',
      description: 'Projetos, artigos e o caminho profissional completo.',
      accent: 'var(--vscode-accent)',
    },
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/Cardosofiles',
      display: 'github.com/Cardosofiles',
      description: 'O código deste sorteio e de tudo mais que ele constrói em público.',
      accent: 'var(--vscode-green)',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/Cardosofiles/',
      display: 'linkedin.com/in/Cardosofiles',
      description: 'Trajetória, experiências e o caminho aberto para conversar.',
      accent: 'var(--vscode-magenta)',
    },
  ],
} as const

/** A stack que sustenta esta aplicação — exibida como reconhecimento do trabalho. */
export const STACK = [
  { name: 'Next.js 16', note: 'App Router, Server Actions e Proxy' },
  { name: 'React 19', note: 'Server Components por padrão' },
  { name: 'TypeScript 5', note: 'Tipagem estrita de ponta a ponta' },
  { name: 'PostgreSQL + Prisma 7', note: 'Sorteio atômico em transação' },
  { name: 'Better Auth', note: 'OAuth Google e GitHub' },
  { name: 'Tailwind CSS v4', note: 'Identidade HUD cyberpunk' },
  { name: 'Framer Motion', note: 'A revelação dos ganhadores' },
  { name: 'Vitest', note: 'Testes unitários e de integração' },
] as const
