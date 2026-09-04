'use client'

import { useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Trophy, Clock, Cpu } from 'lucide-react'
import { TechStackSection } from '../components/tech-stack-section'

interface User {
  id: string
  name: string
  email: string
  image?: string | null
  role?: string
}

interface RaffleEvent {
  id: string
  title: string
  description?: string | null
  eventDate: Date
  location?: string | null
  isActive: boolean
  drawnAt?: Date | null
}

interface Props {
  user: User
  event: RaffleEvent | null
  participantCount: number
  hasBeenDrawn: boolean
}

// A palestra acontece em Uberlândia-MG, então a data/hora exibida é sempre
// a de Brasília — independente do fuso do servidor ou do navegador.
const BRAZIL_TZ = 'America/Sao_Paulo'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isFinished: boolean
}

function getTimeLeft(target: number, now: number): Countdown {
  const diff = Math.max(0, target - now)
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    isFinished: diff === 0,
  }
}

// Um único relógio para a página inteira: um intervalo, quantos contadores
// existirem. O valor fica em cache porque `getSnapshot` precisa ser estável
// entre leituras do mesmo render.
let clockNow = Date.now()
const clockListeners = new Set<() => void>()
let clockTimer: ReturnType<typeof setInterval> | null = null

function subscribeToClock(onTick: () => void) {
  clockNow = Date.now()
  clockListeners.add(onTick)
  clockTimer ??= setInterval(() => {
    clockNow = Date.now()
    for (const listener of clockListeners) listener()
  }, 1000)

  return () => {
    clockListeners.delete(onTick)
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
  }
}

/**
 * Conta o tempo até `targetDate` — a data do evento vinda do banco.
 *
 * No servidor devolve `null` de propósito: o relógio do servidor e o do
 * navegador nunca batem no mesmo segundo, então a contagem só aparece depois
 * da hidratação e o HTML renderizado nos dois lados continua idêntico.
 */
function useCountdown(targetDate: Date | string | null): Countdown | null {
  const now = useSyncExternalStore(
    subscribeToClock,
    () => clockNow,
    () => null
  )

  const target = targetDate ? new Date(targetDate).getTime() : Number.NaN
  if (now === null || Number.isNaN(target)) return null

  return getTimeLeft(target, now)
}

function CountdownUnit({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="countdown-unit">
      <div
        className="countdown-value"
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: 'var(--vscode-accent)',
          lineHeight: 1,
          textShadow: '0 0 20px rgba(0,229,255,0.5)',
        }}
      >
        {value === null ? '--' : String(value).padStart(2, '0')}
      </div>
      <div
        className="countdown-label"
        style={{
          color: 'var(--vscode-text-mute)',
          marginTop: '4px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function CountdownSeparator() {
  return (
    <span
      className="countdown-sep"
      style={{
        color: 'var(--vscode-accent-dim)',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1,
      }}
    >
      :
    </span>
  )
}

export function DashboardHome({ user, event, participantCount, hasBeenDrawn }: Props) {
  const countdown = useCountdown(event?.eventDate ?? null)

  const stats = [
    {
      label: 'Participantes',
      value: participantCount.toString(),
      icon: Users,
      color: 'var(--vscode-accent)',
    },
    {
      label: 'Prêmios',
      value: '5',
      icon: Trophy,
      color: 'var(--vscode-magenta)',
    },
    {
      label: 'Sorteado',
      value: hasBeenDrawn ? 'Sim' : 'Não',
      icon: Cpu,
      color: hasBeenDrawn ? 'var(--vscode-green)' : 'var(--vscode-orange)',
    },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
          Bem-vindo de volta
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--vscode-text)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          Olá, <span style={{ color: 'var(--vscode-accent)' }}>{user.name.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--vscode-text-muted)' }}>
          Você está inscrito no sorteio. Boa sorte!
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: 'grid',
          // Three fixed columns pushed the third card off a 320px screen.
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #070e1d 0%, #0a1528 100%)',
              border: '1px solid var(--vscode-border)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: `${stat.color}18`,
                border: `1px solid ${stat.color}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: stat.color,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--vscode-text-muted)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Event Card */}
      {event && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, #070e1d 0%, #0a1528 50%, #070e1d 100%)',
            border: '1px solid var(--vscode-border)',
            borderRadius: '16px',
            padding: '28px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
        >
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(0,229,255,0.04) 0%, transparent 50%, rgba(255,57,210,0.03) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--vscode-accent), transparent)',
            }}
          />

          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'var(--vscode-accent-ghost)',
                border: '1px solid var(--vscode-accent-dim)',
                marginBottom: '16px',
              }}
            >
              <Cpu size={12} style={{ color: 'var(--vscode-accent)' }} />
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--vscode-accent)',
                  fontWeight: 600,
                }}
              >
                Palestra sobre Inteligência Artificial
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--vscode-text)',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}
            >
              {event.title}
            </h2>

            {event.description && (
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--vscode-text-muted)',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                  maxWidth: '600px',
                }}
              >
                {event.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {event.location && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: 'var(--vscode-text-muted)',
                  }}
                >
                  <MapPin size={14} style={{ color: 'var(--vscode-magenta)' }} />
                  {event.location}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--vscode-text-muted)',
                }}
              >
                <Calendar size={14} style={{ color: 'var(--vscode-blue)' }} />
                {new Date(event.eventDate).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: BRAZIL_TZ,
                })}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--vscode-text-muted)',
                }}
              >
                <Clock size={14} style={{ color: 'var(--vscode-accent)' }} />
                {new Date(event.eventDate).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: BRAZIL_TZ,
                })}
                {' (horário de Brasília)'}
              </div>
            </div>

            {/* Countdown */}
            {!hasBeenDrawn && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: 'var(--vscode-text-mute)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <Clock size={12} />
                  Contagem regressiva para o sorteio
                </div>

                {countdown?.isFinished ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'var(--vscode-accent-ghost)',
                      border: '1px solid var(--vscode-accent-dim)',
                    }}
                  >
                    <Trophy size={16} style={{ color: 'var(--vscode-accent)' }} />
                    <span
                      style={{
                        fontSize: '14px',
                        color: 'var(--vscode-accent)',
                        fontWeight: 600,
                      }}
                    >
                      Chegou a hora! O sorteio acontece ao vivo na palestra.
                    </span>
                  </div>
                ) : (
                  <div className="countdown-row">
                    <CountdownUnit value={countdown?.days ?? null} label="dias" />
                    <CountdownSeparator />
                    <CountdownUnit value={countdown?.hours ?? null} label="horas" />
                    <CountdownSeparator />
                    <CountdownUnit value={countdown?.minutes ?? null} label="min" />
                    <CountdownSeparator />
                    <CountdownUnit value={countdown?.seconds ?? null} label="seg" />
                  </div>
                )}
              </div>
            )}

            {hasBeenDrawn && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(44,242,163,0.1)',
                  border: '1px solid rgba(44,242,163,0.3)',
                }}
              >
                <Trophy size={16} style={{ color: 'var(--vscode-green)' }} />
                <span
                  style={{
                    fontSize: '14px',
                    color: 'var(--vscode-green)',
                    fontWeight: 600,
                  }}
                >
                  Sorteio realizado! Confira os ganhadores na aba Sorteio.
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tech Stack Showcase */}
      <TechStackSection />
    </div>
  )
}
