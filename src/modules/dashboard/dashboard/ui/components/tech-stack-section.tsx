'use client'

import { motion } from 'framer-motion'
import { Terminal, Code2, Box, Cpu, Wrench } from 'lucide-react'

const techGroups = [
  {
    title: 'Sistemas Operacionais',
    icon: Cpu,
    color: 'var(--vscode-blue)',
    items: [
      { name: 'Windows 11', icon: '🪟' },
      { name: 'Ubuntu Linux', icon: '🐧' },
      { name: 'WSL (Windows Subsystem for Linux)', icon: '🖥️' },
    ],
  },
  {
    title: 'Ferramentas Core & Versionamento',
    icon: Terminal,
    color: 'var(--vscode-magenta)',
    items: [
      { name: 'Git', icon: '📦' },
      { name: 'GitHub (SSH configurado)', icon: '🔑' },
      { name: 'Powerlevel10k (Terminal Customizado)', icon: '⚡' },
    ],
  },
  {
    title: 'Linguagens & Runtimes',
    icon: Code2,
    color: 'var(--vscode-accent)',
    items: [
      { name: 'Java (gerenciado pelo SDKMAN)', icon: '☕' },
      { name: 'Python (Pyenv + Pipen)', icon: '🐍' },
      { name: 'Node.js (LTS)', icon: '🟢' },
      { name: 'Bun', icon: '🥟' },
    ],
  },
  {
    title: 'Build & Containers',
    icon: Box,
    color: 'var(--vscode-orange)',
    items: [
      { name: 'Maven', icon: '⚙️' },
      { name: 'Gradle', icon: '🐘' },
      { name: 'Docker + Docker Engine', icon: '🐳' },
    ],
  },
  {
    title: 'IDEs & Utilitários',
    icon: Wrench,
    color: 'var(--vscode-green)',
    items: [
      { name: 'VS Code (Configs Lapidadas de 3 anos)', icon: '💻' },
      { name: 'Api Dog', icon: '🐶' },
      { name: 'BeeKeeper Studio', icon: '🐝' },
    ],
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export function TechStackSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        background: 'linear-gradient(135deg, #070e1d 0%, #0a1528 100%)',
        border: '1px solid var(--vscode-border)',
        borderRadius: '16px',
        padding: '32px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '30%',
          right: '30%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--vscode-magenta), transparent)',
        }}
      />

      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--vscode-text)',
            letterSpacing: '-0.01em',
            marginBottom: '8px',
          }}
        >
          Setup do <span style={{ color: 'var(--vscode-magenta)' }}>Prêmio</span>
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--vscode-text-muted)' }}>
          O ganhador receberá um configuração formatada (Windows 11 ou Ubuntu) com todo o
          ecossistema abaixo configurado:
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {techGroups.map((group, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${group.color}18`,
                  border: `1px solid ${group.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <group.icon size={16} style={{ color: group.color }} />
              </div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--vscode-text)',
                }}
              >
                {group.title}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.items.map((item, j) => (
                <div
                  key={j}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    transition: 'background 0.2s, transform 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--vscode-text-muted)',
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
