'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

import { signIn } from '@/modules/auth/data/auth-client'
import { useParticipantCount } from '@/modules/auth/hooks/use-participant-count'
import { AuthErrorAlert } from '@/modules/auth/ui/components/auth-error-alert'
import {
  AuthSocialButton,
  type SocialProvider,
} from '@/modules/auth/ui/components/auth-social-button'
import { getFriendlyErrorMessage } from '@/modules/auth/ui/components/auth-messages'

interface LoginViewProps {
  /**
   * O `?error=` já lido pela página (Server Component). Ler no servidor evita
   * o `useSearchParams` — que obrigaria esta árvore inteira a ficar sob um
   * `<Suspense>` só para não quebrar a renderização estática.
   */
  socialError?: string
}

/**
 * A tela de login — o único ponto de entrada do sistema, já que não há
 * cadastro por senha (BR-01).
 */
export function LoginView({ socialError }: LoginViewProps) {
  const [loading, setLoading] = useState<SocialProvider | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [dismissedError, setDismissedError] = useState(false)
  const { data: count } = useParticipantCount()

  const currentError =
    !dismissedError && (clientError || getFriendlyErrorMessage(socialError ?? null))

  const handleSignIn = async (provider: SocialProvider) => {
    setLoading(provider)
    setClientError(null)
    setDismissedError(false)
    try {
      const res = await signIn.social({
        provider,
        callbackURL: '/dashboard',
      })
      if (res?.error) {
        setClientError(
          res.error.message ||
            `Falha ao iniciar autenticação com ${provider === 'google' ? 'Google' : 'GitHub'}.`
        )
        setLoading(null)
      }
    } catch (err) {
      setClientError(
        err instanceof Error ? err.message : 'Falha na comunicação com o servidor de autenticação.'
      )
      setLoading(null)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--vscode-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="grid-bg"
    >
      {/* Ambient glows */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)',
          top: '-200px',
          left: '-200px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,57,210,0.06) 0%, transparent 70%)',
          bottom: '-100px',
          right: '-100px',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '24px',
          background: 'linear-gradient(135deg, #070d1f 0%, #060b19 100%)',
          border: '1px solid var(--vscode-border)',
          borderRadius: '16px',
          padding: '40px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Card inner glow top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--vscode-accent), transparent)',
          }}
        />

        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            className="animate-pulse-glow"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background:
                'linear-gradient(135deg, var(--vscode-accent-ghost), rgba(255,57,210,0.1))',
              border: '1px solid var(--vscode-accent-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image src="/icon.svg" alt="Icon" width={36} height={36} />
          </div>
        </motion.div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--vscode-text)',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}
          >
            AI Lecture —{' '}
            <span className="text-glow" style={{ color: 'var(--vscode-accent)' }}>
              Sorteio de Configuração
            </span>
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--vscode-text-muted)',
              lineHeight: 1.5,
            }}
          >
            Faça login para participar do sorteio
          </p>

          {count !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'var(--vscode-accent-ghost)',
                border: '1px solid var(--vscode-accent-dim)',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--vscode-green)',
                  animation: 'pulse-glow 2s infinite',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--vscode-accent)',
                  fontWeight: 600,
                }}
              >
                {count} {count === 1 ? 'pessoa já participando' : 'pessoas já participando'}
              </span>
            </motion.div>
          )}
        </div>

        {/* Error Notification */}
        {currentError && (
          <AuthErrorAlert message={currentError} onDismiss={() => setDismissedError(true)} />
        )}

        {/* Auth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AuthSocialButton provider="google" loading={loading} onClick={handleSignIn} />
          <AuthSocialButton provider="github" loading={loading} onClick={handleSignIn} />
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--vscode-text-mute)',
            lineHeight: 1.5,
          }}
        >
          Ao entrar, você é automaticamente inscrito no sorteio.
          <br />
          Evento: Unitri · 2026
        </p>
      </motion.div>
    </div>
  )
}
