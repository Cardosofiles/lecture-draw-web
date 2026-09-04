import {
  ORIGIN_LABELS,
  type CollectedTable,
  type FieldOrigin,
} from '@/modules/legal/data/data-collection'

const ORIGIN_COLORS: Record<FieldOrigin, string> = {
  oauth: 'var(--vscode-magenta)',
  gerado: 'var(--vscode-blue)',
  uso: 'var(--vscode-orange)',
}

/**
 * Uma tabela do banco apresentada como um card.
 *
 * A escolha de mostrar o nome real do model (`User`, `Session`…) é deliberada:
 * quem lê pode abrir o console SQL — ou o `schema.prisma` no repositório — e
 * conferir que a lista bate com a realidade.
 */
export function DataTableCard({ table }: { table: CollectedTable }) {
  return (
    <article
      style={{
        border: '1px solid var(--vscode-border)',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(7, 13, 31, 0.7) 0%, rgba(6, 11, 25, 0.7) 100%)',
        padding: '20px',
        marginBottom: '16px',
      }}
    >
      <header style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--vscode-text)',
            }}
          >
            {table.label}
          </h3>
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--vscode-accent)',
              background: 'var(--vscode-accent-ghost)',
              border: '1px solid var(--vscode-accent-dim)',
              borderRadius: '999px',
              padding: '2px 10px',
            }}
          >
            {table.table}
          </code>
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--vscode-text-muted)' }}>
          {table.purpose}
        </p>
      </header>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
        {table.fields.map((field) => (
          <li
            key={field.name}
            style={{
              paddingTop: '10px',
              borderTop: '1px solid rgba(0, 200, 255, 0.08)',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <code
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12.5px',
                  color: field.sensitive ? 'var(--vscode-orange)' : 'var(--vscode-text)',
                  fontWeight: 600,
                }}
              >
                {field.name}
              </code>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: ORIGIN_COLORS[field.origin],
                  border: `1px solid ${ORIGIN_COLORS[field.origin]}`,
                  opacity: 0.85,
                  borderRadius: '4px',
                  padding: '1px 6px',
                }}
              >
                {ORIGIN_LABELS[field.origin]}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--vscode-text-muted)' }}>
              {field.description}
            </p>
          </li>
        ))}
      </ul>

      <p
        style={{
          fontSize: '12.5px',
          lineHeight: 1.6,
          color: 'var(--vscode-green)',
          background: 'rgba(44, 242, 163, 0.06)',
          borderRadius: '6px',
          padding: '8px 12px',
        }}
      >
        <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Retenção: </strong>
        {table.retention}
      </p>
    </article>
  )
}
