'use client'

import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { executeSQL } from '@/actions/sql-console'

interface SchemaColumn {
  column: string
  type: string
}

interface QueryLogEntry {
  id: string
  sql: string
  duration: number
  rowCount?: number | null
  error?: string | null
  createdAt: Date
}

interface Props {
  initialSchema: Record<string, SchemaColumn[]>
  initialHistory: QueryLogEntry[]
}

const DEFAULT_QUERY = `SELECT 
  u.name,
  u.email,
  u.role,
  u."createdAt"
FROM "User" u
ORDER BY u."createdAt" DESC
LIMIT 10;`

export function SqlConsoleView({ initialSchema, initialHistory }: Props) {
  const [sql, setSql] = useState(DEFAULT_QUERY)
  const [result, setResult] = useState<{
    rows: Record<string, unknown>[]
    duration: number
    rowCount: number | null
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [history, setHistory] = useState(initialHistory)
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleExecute = () => {
    if (!sql.trim()) return
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const res = await executeSQL(sql)
        setResult(
          res as {
            rows: Record<string, unknown>[]
            duration: number
            rowCount: number | null
            message: string
          }
        )
        // Update history (optimistic)
        setHistory((prev) => [
          {
            id: Date.now().toString(),
            sql,
            duration: res.duration,
            rowCount: res.rowCount,
            error: null,
            createdAt: new Date(),
          },
          ...prev.slice(0, 9),
        ])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido')
        setHistory((prev) => [
          {
            id: Date.now().toString(),
            sql,
            duration: 0,
            rowCount: null,
            error: e instanceof Error ? e.message : 'Erro',
            createdAt: new Date(),
          },
          ...prev.slice(0, 9),
        ])
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleExecute()
    }
    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = sql.slice(0, start) + '  ' + sql.slice(end)
      setSql(newVal)
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      }, 0)
    }
  }

  const columns = result?.rows.length ? Object.keys(result.rows[0]) : []

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Schema browser sidebar */}
      <div
        className="sql-schema-sidebar"
        style={{
          width: '220px',
          minWidth: '220px',
          borderRight: '1px solid var(--vscode-border)',
          overflowY: 'auto',
          background: 'var(--vscode-sidebar)',
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--vscode-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: '1px solid var(--vscode-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Database size={12} />
          Esquema
        </div>
        {Object.entries(initialSchema).map(([table, cols]) => (
          <div key={table}>
            <button
              onClick={() => setOpenTables((p) => ({ ...p, [table]: !p[table] }))}
              className="sql-table-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                padding: '0 10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--vscode-text)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                textAlign: 'left',
              }}
            >
              {openTables[table] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span style={{ color: 'var(--vscode-accent)' }}>{table}</span>
            </button>
            {openTables[table] && (
              <div>
                {cols.map((c) => (
                  <div
                    key={c.column}
                    style={{
                      padding: '3px 10px 3px 28px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--vscode-text-muted)',
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <span>{c.column}</span>
                    <span style={{ color: 'var(--vscode-text-mute)' }}>:{c.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main console area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px 12px',
            borderBottom: '1px solid var(--vscode-border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: 'var(--vscode-text-mute)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '2px',
            }}
          >
            sql-console.tsx
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--vscode-text)',
              letterSpacing: '-0.02em',
            }}
          >
            <span style={{ color: 'var(--vscode-red)' }}>SQL</span> Console
            <span
              className="sql-subtitle"
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--vscode-text-mute)',
                fontWeight: 400,
                marginLeft: '10px',
              }}
            >
              admin only · Ctrl+Enter para executar
            </span>
          </h1>
        </div>

        {/* Editor + results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* SQL Editor */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <textarea
              ref={textareaRef}
              id="sql-editor"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={10}
              className="sql-editor"
              spellCheck={false}
              style={{ minHeight: '200px' }}
            />
          </div>

          {/* Execute button */}
          <div style={{ marginBottom: '24px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExecute}
              disabled={isPending || !sql.trim()}
              id="btn-execute-sql"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                minHeight: '44px',
                borderRadius: '6px',
                background: isPending
                  ? 'rgba(0,229,255,0.1)'
                  : 'linear-gradient(135deg, #00c8dd 0%, #0099aa 100%)',
                border: '1px solid var(--vscode-accent-dim)',
                color: isPending ? 'var(--vscode-accent)' : '#000',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Play size={14} />
              )}
              {isPending ? 'Executando...' : 'Executar'}
            </motion.button>
          </div>

          {/* Error output */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255,77,109,0.08)',
                  border: '1px solid rgba(255,77,109,0.3)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{
                    color: 'var(--vscode-red)',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--vscode-red)',
                      marginBottom: '2px',
                    }}
                  >
                    Erro
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--vscode-text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {error}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results table */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Status bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px',
                    borderRadius: '6px 6px 0 0',
                    background: 'rgba(44,242,163,0.06)',
                    border: '1px solid rgba(44,242,163,0.2)',
                    borderBottom: 'none',
                    fontSize: '12px',
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: 'var(--vscode-green)' }} />
                  <span style={{ color: 'var(--vscode-green)', fontWeight: 600 }}>
                    {result.message}
                  </span>
                  <span
                    style={{
                      color: 'var(--vscode-text-mute)',
                      marginLeft: 'auto',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {result.duration}ms
                  </span>
                </div>

                {/* Table */}
                {columns.length > 0 && (
                  <div
                    style={{
                      overflowX: 'auto',
                      border: '1px solid rgba(44,242,163,0.2)',
                      borderRadius: '0 0 6px 6px',
                    }}
                  >
                    <table className="vscode-table">
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i}>
                            {columns.map((col) => (
                              <td
                                key={col}
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '12px',
                                }}
                              >
                                {row[col] === null ? (
                                  <span
                                    style={{
                                      color: 'var(--vscode-text-mute)',
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    NULL
                                  </span>
                                ) : typeof row[col] === 'boolean' ? (
                                  <span
                                    style={{
                                      color: row[col] ? 'var(--vscode-green)' : 'var(--vscode-red)',
                                    }}
                                  >
                                    {String(row[col])}
                                  </span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Query history panel */}
        {history.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--vscode-border)',
              padding: '12px 24px',
              background: 'var(--vscode-sidebar)',
              flexShrink: 0,
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--vscode-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={11} />
              Histórico (últimas 10 queries)
            </div>
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSql(entry.sql)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '0 8px',
                  minHeight: '44px',
                  marginBottom: '2px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--vscode-accent-ghost)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {entry.error ? (
                  <AlertTriangle size={11} style={{ color: 'var(--vscode-red)', flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={11} style={{ color: 'var(--vscode-green)', flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--vscode-text-muted)',
                    flex: 1,
                    // Without this the flex item refuses to shrink below the
                    // query's intrinsic width, so the ellipsis never kicks in.
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.sql.replace(/\n/g, ' ').trim()}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--vscode-text-mute)',
                    flexShrink: 0,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {entry.duration}ms
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
