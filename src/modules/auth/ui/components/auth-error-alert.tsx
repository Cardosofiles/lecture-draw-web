'use client'

import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'

interface AuthErrorAlertProps {
  message: string
  onDismiss: () => void
}

/** O aviso vermelho de falha de autenticação, dispensável pelo participante. */
export function AuthErrorAlert({ message, onDismiss }: AuthErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: '20px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: 'rgba(255, 57, 57, 0.12)',
        border: '1px solid rgba(255, 57, 57, 0.35)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      <AlertCircle size={18} style={{ color: '#ff5555', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, fontSize: '13px', color: '#ff9999', lineHeight: 1.4 }}>{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ff9999',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Fechar"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
