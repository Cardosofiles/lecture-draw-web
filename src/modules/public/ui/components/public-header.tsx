import Image from 'next/image'
import Link from 'next/link'

interface PublicHeaderProps {
  /**
   * O caminho mostrado como breadcrumb, no estilo do explorador do VS Code —
   * ex.: `['legal', 'privacidade.md']`.
   */
  breadcrumb: string[]
}

/**
 * Barra superior das páginas públicas.
 *
 * As páginas públicas não têm ActivityBar nem Sidebar: quem chega aqui pode
 * nem estar logado, e um shell de editor completo sugeriria uma navegação que
 * não existe. Sobra o essencial — a marca, onde você está, e o caminho de volta.
 */
export function PublicHeader({ breadcrumb }: PublicHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '10px 20px',
        background: 'rgba(6, 11, 22, 0.86)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--vscode-border)',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: '44px',
          textDecoration: 'none',
        }}
      >
        <Image src="/icon.svg" alt="" width={24} height={24} aria-hidden />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--vscode-text-mute)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {breadcrumb.map((crumb, i) => (
            <span key={crumb}>
              {i > 0 && <span style={{ opacity: 0.5 }}> / </span>}
              <span
                style={
                  i === breadcrumb.length - 1
                    ? { color: 'var(--vscode-accent)', fontWeight: 600 }
                    : undefined
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </span>
      </Link>

      <Link
        href="/login"
        className="btn-accent"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: '44px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          fontSize: '13px',
        }}
      >
        Entrar
      </Link>
    </header>
  )
}
