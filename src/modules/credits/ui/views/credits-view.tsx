'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Heart, Terminal } from 'lucide-react'

import { AUTHOR, STACK } from '@/modules/credits/data/author'

/**
 * A página de dedicatória.
 *
 * Toda a plataforma é sobre o evento; esta página é sobre quem a construiu.
 * A animação é discreta de propósito — o assunto aqui é o texto, não o efeito.
 */
export function CreditsView() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 20px 0' }}>
      {/* ─── Cabeçalho ─────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ textAlign: 'center', marginBottom: '56px' }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="animate-pulse-glow"
          style={{
            width: '96px',
            height: '96px',
            margin: '0 auto 24px',
            borderRadius: '24px',
            background:
              'linear-gradient(135deg, var(--vscode-accent-ghost), rgba(255,57,210,0.12))',
            border: '1px solid var(--vscode-accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: '34px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--vscode-accent)',
          }}
        >
          {AUTHOR.initials}
        </motion.div>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--vscode-magenta)',
            marginBottom: '14px',
          }}
        >
          Dedicatória
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(30px, 7vw, 44px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--vscode-text)',
            marginBottom: '12px',
          }}
        >
          {AUTHOR.name}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            color: 'var(--vscode-accent)',
          }}
        >
          @{AUTHOR.handle} · {AUTHOR.role}
        </p>
      </motion.header>

      {/* ─── A dedicatória ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative',
          border: '1px solid var(--vscode-border)',
          borderRadius: '16px',
          padding: '36px 32px',
          marginBottom: '48px',
          background: 'linear-gradient(135deg, #070d1f 0%, #060b19 100%)',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--vscode-accent), transparent)',
          }}
        />

        <Heart
          size={22}
          aria-hidden
          style={{ color: 'var(--vscode-magenta)', marginBottom: '20px' }}
        />

        <div
          style={{
            fontSize: '16.5px',
            lineHeight: 1.85,
            color: 'var(--vscode-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <p>
            Esta plataforma existe porque uma pessoa decidiu que a palestra merecia mais do que
            slides. Cada tela aqui — o sorteio atômico que não pode dar dois ganhadores para o mesmo
            prêmio, o rate limit dimensionado para a sala inteira saindo por um IP só, a
            transferência que registra quem passou o quê para quem — foi pensada, escrita, quebrada
            e reescrita por <strong style={{ color: 'var(--vscode-text)' }}>{AUTHOR.name}</strong>.
          </p>
          <p>
            Não é um template comprado nem um projeto de curso. É engenharia feita com cuidado por
            quem não achou que &ldquo;funciona na minha máquina&rdquo; fosse resposta suficiente
            quando 400 pessoas fossem entrar ao mesmo tempo.
          </p>
          <p>
            Que esta página fique como registro: o trabalho invisível — o que ninguém vê porque
            simplesmente <em>funcionou</em> na hora certa, diante de todo mundo — também tem autor.
            Este é o dele.
          </p>
        </div>

        <p
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--vscode-border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--vscode-text-mute)',
          }}
        >
          <span style={{ color: 'var(--vscode-green)' }}>$</span> git log --author=&ldquo;
          {AUTHOR.handle}&rdquo; --oneline | wc -l
        </p>
      </motion.section>

      {/* ─── Links ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{ marginBottom: '56px' }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--vscode-text)',
            marginBottom: '18px',
          }}
        >
          Onde encontrar
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {AUTHOR.links.map((link, i) => (
            <motion.a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.35 }}
              whileHover={{ x: 4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minHeight: '44px',
                padding: '18px 20px',
                border: '1px solid var(--vscode-border)',
                borderRadius: '12px',
                background: 'rgba(6, 11, 22, 0.6)',
                textDecoration: 'none',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: '3px',
                  alignSelf: 'stretch',
                  borderRadius: '2px',
                  background: link.accent,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--vscode-text)',
                    marginBottom: '3px',
                  }}
                >
                  {link.label}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: 'var(--vscode-text-muted)',
                    lineHeight: 1.55,
                    marginBottom: '5px',
                  }}
                >
                  {link.description}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: link.accent,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.display}
                </span>
              </span>
              <ArrowUpRight
                size={18}
                aria-hidden
                style={{ color: 'var(--vscode-text-mute)', flexShrink: 0 }}
              />
            </motion.a>
          ))}
        </div>
      </motion.section>

      {/* ─── Stack ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--vscode-text)',
            marginBottom: '8px',
          }}
        >
          <Terminal size={18} aria-hidden style={{ color: 'var(--vscode-accent)' }} />O que roda por
          trás
        </h2>
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'var(--vscode-text-muted)',
            marginBottom: '20px',
          }}
        >
          Nenhuma dessas escolhas foi acidental — cada uma resolve um problema concreto deste
          evento.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
          }}
        >
          {STACK.map((item) => (
            <div
              key={item.name}
              style={{
                border: '1px solid var(--vscode-border)',
                borderRadius: '10px',
                padding: '14px 16px',
                background: 'rgba(6, 11, 22, 0.45)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--vscode-accent)',
                  marginBottom: '4px',
                }}
              >
                {item.name}
              </p>
              <p style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--vscode-text-mute)' }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
