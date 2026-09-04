'use client'

import { useEffect, useState } from 'react'
import { GitBranch, Zap, Users, Wifi } from 'lucide-react'

interface StatusBarProps {
  participantCount?: number
}

export function StatusBar({ participantCount = 0 }: StatusBarProps) {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('pt-BR', { hour12: false }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="vscode-status-bar">
      {/* Left section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <span className="status-item status-item--strong">
          <Wifi size={12} />
          Neon DB
        </span>
        <span className="status-item status-item--branch">
          <GitBranch size={12} />
          main
        </span>
        <span className="status-item status-item--event">
          <Zap size={12} />
          AI Lecture 2026
        </span>
      </div>

      {/* Right section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          minWidth: 0,
        }}
      >
        <span className="status-item status-item--strong">
          <Users size={12} />
          {participantCount} participantes
        </span>
        <span className="status-item status-item--mono status-item--time">{time}</span>
        <span className="status-item status-item--encoding">UTF-8</span>
        <span className="status-item status-item--language">TypeScript</span>
      </div>
    </div>
  )
}
