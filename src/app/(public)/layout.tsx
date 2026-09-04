import { PublicFooter } from '@/modules/public'

/**
 * Shell das páginas abertas — as que existem para quem ainda não entrou.
 *
 * Ao contrário de `(dashboard)`, aqui não há verificação de sessão: privacidade
 * e créditos precisam ser legíveis por quem está decidindo se faz login, e a
 * política precisa estar acessível sem autenticação para os provedores OAuth.
 *
 * O cabeçalho não mora aqui porque cada página traz o próprio breadcrumb.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid-bg"
      style={{
        minHeight: '100dvh',
        // `backgroundColor`, e não o atalho `background`: o atalho apagaria o
        // background-image que a classe .grid-bg aplica.
        backgroundColor: 'var(--vscode-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Brilhos ambientes — puramente decorativos */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)',
          top: '-260px',
          left: '-220px',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: '460px',
          height: '460px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,57,210,0.05) 0%, transparent 70%)',
          top: '40%',
          right: '-220px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>{children}</div>
      <PublicFooter />
    </div>
  )
}
