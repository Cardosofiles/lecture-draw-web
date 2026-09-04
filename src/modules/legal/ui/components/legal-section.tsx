interface LegalSectionProps {
  /** Âncora usada pelo índice no topo da página. */
  id: string
  /** Numeração exibida no marcador lateral, no estilo de um arquivo aberto. */
  index: string
  title: string
  children: React.ReactNode
}

/**
 * Uma seção do documento legal, com âncora própria.
 *
 * `scrollMarginTop` existe porque o cabeçalho é `sticky`: sem ela, pular por um
 * link do índice pousaria o título embaixo da barra.
 */
export function LegalSection({ id, index, title, children }: LegalSectionProps) {
  return (
    <section id={id} style={{ scrollMarginTop: '80px', marginBottom: '48px' }}>
      <h2
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '12px',
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--vscode-text)',
          letterSpacing: '-0.01em',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--vscode-border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--vscode-accent)',
            flexShrink: 0,
          }}
        >
          {index}
        </span>
        {title}
      </h2>
      <div style={{ color: 'var(--vscode-text-muted)', fontSize: '15px', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  )
}

/** Parágrafo padrão do documento — espaçamento consistente sem CSS global. */
export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: '14px' }}>{children}</p>
}

/** Lista de marcadores com o "prompt" cyberpunk no lugar da bolinha. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span
            aria-hidden
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--vscode-accent)',
              flexShrink: 0,
              lineHeight: 1.75,
            }}
          >
            ›
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

interface CalloutProps {
  tone: 'accent' | 'green' | 'magenta' | 'orange'
  title: string
  children: React.ReactNode
}

const TONE_COLORS: Record<CalloutProps['tone'], { color: string; glow: string }> = {
  accent: { color: 'var(--vscode-accent)', glow: 'rgba(0, 229, 255, 0.07)' },
  green: { color: 'var(--vscode-green)', glow: 'rgba(44, 242, 163, 0.07)' },
  magenta: { color: 'var(--vscode-magenta)', glow: 'rgba(255, 57, 210, 0.07)' },
  orange: { color: 'var(--vscode-orange)', glow: 'rgba(255, 158, 44, 0.07)' },
}

/** Bloco de destaque para o que o leitor não pode deixar passar. */
export function LegalCallout({ tone, title, children }: CalloutProps) {
  const { color, glow } = TONE_COLORS[tone]

  return (
    <div
      style={{
        borderLeft: `2px solid ${color}`,
        background: glow,
        borderRadius: '0 8px 8px 0',
        padding: '16px 18px',
        marginBottom: '16px',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          marginBottom: '8px',
        }}
      >
        {title}
      </p>
      <div style={{ fontSize: '14px', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}
