'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shuffle, Trophy, Loader2, Zap } from 'lucide-react'
import { drawRaffle } from '@/actions/raffle'
import { WinnerCard } from '../components/winner-card'
import { useRouter } from 'next/navigation'

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

interface RaffleEvent {
  id: string
  title: string
  eventDate: Date
  drawnAt?: Date | null
}

interface Props {
  prizes: RafflePrize[]
  event: RaffleEvent | null
  currentUserId: string
  isAdmin: boolean
}

const avatarOrbit = [
  { emoji: '👩‍💻', delay: 0 },
  { emoji: '👨‍🔬', delay: 0.3 },
  { emoji: '🧑‍💼', delay: 0.6 },
  { emoji: '👩‍🎓', delay: 0.9 },
  { emoji: '🧑‍🚀', delay: 1.2 },
  { emoji: '👨‍🎨', delay: 1.5 },
]

export function RaffleView({ prizes, event, currentUserId, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [localPrizes, setLocalPrizes] = useState(prizes)
  const localHasDrawnRef = useRef(prizes.some((p) => p.winnerId))

  // Sync when RaffleNotifier triggers router.refresh() and server delivers drawn prizes
  useEffect(() => {
    const serverHasDrawn = prizes.some((p) => p.winnerId)
    if (serverHasDrawn && !localHasDrawnRef.current) {
      localHasDrawnRef.current = true
      setLocalPrizes(prizes)
    }
  }, [prizes])

  const hasBeenDrawn = localPrizes.some((p) => p.winnerId)

  const handleDraw = () => {
    setError(null)
    startTransition(async () => {
      try {
        const results = await drawRaffle()
        setLocalPrizes(results as RafflePrize[])
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao realizar sorteio')
      }
    })
  }

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <div
          style={{
            fontSize: '12px',
            color: 'var(--vscode-text-mute)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '4px',
          }}
        >
          sorteio.tsx
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--vscode-text)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          <span style={{ color: 'var(--vscode-magenta)' }}>Sorteio</span> de 5 Setup DEV
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--vscode-text-muted)' }}>
          {hasBeenDrawn
            ? 'Ganhadores do sorteio'
            : '5 configuração de Ambiente de Desenvolvimento completos para Desenvolvedores'}
        </p>
      </motion.div>

      {/* Pre-draw: spinning lottery animation */}
      {!hasBeenDrawn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '48px 0' }}
        >
          {/* Spinning ring */}
          <div className="lottery-ring" style={{ margin: '0 auto 40px' }}>
            <div className="lottery-ring-border" />
            <div
              style={{
                position: 'absolute',
                inset: '12px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(0,229,255,0.06) 0%, var(--vscode-bg) 70%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={64} style={{ color: 'var(--vscode-accent)', opacity: 0.8 }} />
            </div>

            {/* Orbiting emojis */}
            {avatarOrbit.map((av, i) => {
              const angle = (i / avatarOrbit.length) * 360
              return (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '36px',
                    height: '36px',
                    top: '50%',
                    left: '50%',
                    marginTop: '-18px',
                    marginLeft: '-18px',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: av.delay,
                  }}
                >
                  <div
                    style={{
                      transform: `translateX(120px) rotate(-${angle}deg)`,
                      fontSize: '22px',
                      lineHeight: '36px',
                      textAlign: 'center',
                    }}
                  >
                    {av.emoji}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <p
            style={{
              fontSize: '16px',
              color: 'var(--vscode-text-muted)',
              marginBottom: '8px',
            }}
          >
            O sorteio ainda não foi realizado
          </p>
          <p style={{ fontSize: '13px', color: 'var(--vscode-text-mute)' }}>
            Aguarde o administrador iniciar o sorteio ao vivo
          </p>

          {/* Admin draw button */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ marginTop: '32px' }}
            >
              {error && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,77,109,0.1)',
                    border: '1px solid rgba(255,77,109,0.3)',
                    color: 'var(--vscode-red)',
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleDraw}
                disabled={isPending}
                id="btn-draw-raffle"
                className="animate-pulse-glow"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff39d2 0%, #cc00a8 100%)',
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Sorteando...
                  </>
                ) : (
                  <>
                    <Shuffle size={20} />
                    Realizar Sorteio
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Post-draw: winner cards */}
      {hasBeenDrawn && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Banner */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'rgba(44,242,163,0.08)',
              border: '1px solid rgba(44,242,163,0.25)',
              marginBottom: '28px',
            }}
          >
            <Zap size={18} style={{ color: 'var(--vscode-green)' }} />
            <span
              style={{
                fontSize: '14px',
                color: 'var(--vscode-green)',
                fontWeight: 600,
              }}
            >
              Sorteio realizado! Confira os 5 ganhadores abaixo.
            </span>
          </motion.div>

          {/* Winner grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <AnimatePresence>
              {localPrizes.map((prize, index) => (
                <motion.div
                  key={prize.id}
                  initial={{ opacity: 0, y: 32, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.12,
                    duration: 0.5,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                >
                  <WinnerCard prize={prize} currentUserId={currentUserId} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  )
}
