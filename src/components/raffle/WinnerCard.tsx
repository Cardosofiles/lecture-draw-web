'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Trophy } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  image?: string | null
}

interface RafflePrize {
  id: string
  prizeNumber: number
  description: string
  winnerId?: string | null
  transferredToId?: string | null
  drawnAt?: Date | null
  winner?: User | null
  transferredTo?: User | null
}

interface Props {
  prize: RafflePrize
  currentUserId: string
}

const prizeColors = [
  {
    glow: 'rgba(0,229,255,0.35)',
    border: 'rgba(0,229,255,0.4)',
    accent: 'var(--vscode-accent)',
  },
  {
    glow: 'rgba(255,57,210,0.35)',
    border: 'rgba(255,57,210,0.4)',
    accent: 'var(--vscode-magenta)',
  },
  {
    glow: 'rgba(90,169,255,0.35)',
    border: 'rgba(90,169,255,0.4)',
    accent: 'var(--vscode-blue)',
  },
  {
    glow: 'rgba(44,242,163,0.35)',
    border: 'rgba(44,242,163,0.4)',
    accent: 'var(--vscode-green)',
  },
  {
    glow: 'rgba(255,158,44,0.35)',
    border: 'rgba(255,158,44,0.4)',
    accent: 'var(--vscode-orange)',
  },
]

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const masked = local.slice(0, 2) + '****'
  return `${masked}@${domain}`
}

function getOsIcon(description: string): string {
  if (description.includes('Windows')) return '🪟'
  if (description.includes('Ubuntu')) return '🐧'
  return '⭐'
}

export function WinnerCard({ prize, currentUserId }: Props) {
  const colors = prizeColors[(prize.prizeNumber - 1) % prizeColors.length]
  const effectiveWinner = prize.transferredTo ?? prize.winner
  const isCurrentUserWinner = prize.winnerId === currentUserId
  const isWinnerAndKept = isCurrentUserWinner && !prize.transferredToId

  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: 'linear-gradient(135deg, #070e1d 0%, #0a1528 100%)',
        border: isWinnerAndKept ? '1px solid rgba(44,242,163,0.7)' : `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isWinnerAndKept
          ? '0 0 32px rgba(44,242,163,0.35), 0 0 64px rgba(44,242,163,0.1)'
          : `0 0 24px ${colors.glow}`,
        cursor: 'default',
      }}
    >
      {/* "VOCÊ GANHOU!" banner */}
      {isWinnerAndKept && (
        <motion.div
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            marginBottom: '14px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(44,242,163,0.1)',
            border: '1px solid rgba(44,242,163,0.35)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--vscode-green)',
            textAlign: 'center',
            letterSpacing: '0.06em',
          }}
        >
          ⭐ VOCÊ GANHOU!
        </motion.div>
      )}

      {/* Top glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
        }}
      />

      {/* Prize number badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: `${colors.accent}18`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Trophy size={12} style={{ color: colors.accent }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: colors.accent,
              fontFamily: 'var(--font-mono)',
            }}
          >
            #{prize.prizeNumber}
          </span>
        </div>
        <span style={{ fontSize: '22px' }}>{getOsIcon(prize.description)}</span>
      </div>

      {/* Prize description */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--vscode-text-muted)',
          marginBottom: '16px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {prize.description}
      </p>

      {/* Winner info */}
      {effectiveWinner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${colors.border}`,
              flexShrink: 0,
              background: 'var(--vscode-activity-bar)',
            }}
          >
            {effectiveWinner.image ? (
              <Image
                src={effectiveWinner.image}
                alt={effectiveWinner.name}
                width={44}
                height={44}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.accent,
                }}
              >
                {effectiveWinner.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--vscode-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {effectiveWinner.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--vscode-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {maskEmail(effectiveWinner.email)}
            </div>
          </div>
        </div>
      )}

      {/* Transfer badge */}
      {prize.transferredToId && (
        <div
          style={{
            marginTop: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: 'rgba(255,158,44,0.12)',
            border: '1px solid rgba(255,158,44,0.3)',
            fontSize: '12px',
            color: 'var(--vscode-orange)',
            fontWeight: 600,
          }}
        >
          ↗ Prêmio transferido
        </div>
      )}

      {/* Transfer button for current winner */}
      {isCurrentUserWinner && !prize.transferredToId && (
        <Link
          href="/transfer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '16px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid var(--vscode-accent-dim)',
            color: 'var(--vscode-accent)',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
        >
          <ArrowRight size={14} />
          Transferir Prêmio
        </Link>
      )}
    </motion.div>
  )
}
