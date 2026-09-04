'use client'

import { motion } from 'framer-motion'
import { GitFork, Globe, Loader2 } from 'lucide-react'

export type SocialProvider = 'google' | 'github'

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: 'Continue com Google',
  github: 'Continue com GitHub',
}

interface AuthSocialButtonProps {
  provider: SocialProvider
  /** Qual provedor está em voo — `null` quando nenhum. */
  loading: SocialProvider | null
  onClick: (provider: SocialProvider) => void
}

/**
 * Um botão de login social.
 *
 * `loading` é o provedor em voo (e não um booleano) porque os dois botões
 * precisam se desabilitar juntos enquanto só um mostra o spinner: dois popups
 * de OAuth simultâneos deixam dois `state` pendentes e o segundo callback
 * falha com `state_mismatch`.
 */
export function AuthSocialButton({ provider, loading, onClick }: AuthSocialButtonProps) {
  const isLoading = loading === provider
  const Icon = provider === 'google' ? Globe : GitFork

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(provider)}
      disabled={loading !== null}
      id={`btn-login-${provider}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '12px 20px',
        borderRadius: '8px',
        background: isLoading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'var(--vscode-text)',
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: loading !== null ? 'not-allowed' : 'pointer',
        opacity: loading !== null && !isLoading ? 0.5 : 1,
        transition: 'background 0.15s',
      }}
    >
      {isLoading ? (
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Icon size={18} />
      )}
      {PROVIDER_LABEL[provider]}
    </motion.button>
  )
}
