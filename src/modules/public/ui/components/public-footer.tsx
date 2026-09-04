import Link from 'next/link'

const LINKS = [
  { href: '/privacidade', label: 'Privacidade e Termos' },
  { href: '/creditos', label: 'Créditos' },
  { href: '/login', label: 'Entrar' },
] as const

/** Rodapé comum às páginas públicas: navegação lateral e a nota de autoria. */
export function PublicFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--vscode-border)',
        padding: '28px 20px 40px',
        marginTop: '48px',
      }}
    >
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '4px 20px',
          marginBottom: '16px',
        }}
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '44px',
              padding: '0 4px',
              fontSize: '13px',
              color: 'var(--vscode-text-muted)',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <p
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--vscode-text-mute)',
          lineHeight: 1.7,
        }}
      >
        AI Lecture · Spec-Driven Development · Unitri
        <br />
        Construído por{' '}
        <a
          href="https://www.cardosofiles.com.br/pt"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--vscode-accent)', textDecoration: 'none' }}
        >
          João Batista Cardoso Miranda
        </a>
      </p>
    </footer>
  )
}
