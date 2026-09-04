"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";

export function Terminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const lines = [
    { prompt: "$ ", command: "pnpm dev", output: false },
    { prompt: "  ▲ ", command: "Next.js 16.2.6", output: true },
    { prompt: "  - ", command: "Local:  http://localhost:3000", output: true },
    { prompt: "  - ", command: "AI Lecture Raffle System ready", output: true },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 12px",
          minHeight: "44px",
          background: "none",
          border: "none",
          borderTop: "1px solid var(--vscode-border)",
          color: "var(--vscode-text-muted)",
          fontSize: "12px",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          width: "100%",
        }}
      >
        <TerminalIcon size={12} />
        TERMINAL
      </button>
    );
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--vscode-border)",
        background: "#010408",
        flexShrink: 0,
        height: collapsed ? "28px" : "160px",
        transition: "height 0.2s",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          borderBottom: "1px solid var(--vscode-border)",
          background: "var(--vscode-activity-bar)",
          flexShrink: 0,
          height: "28px",
        }}
      >
        <TerminalIcon size={12} style={{ color: "var(--vscode-text-muted)" }} />
        <span
          style={{
            fontSize: "12px",
            color: "var(--vscode-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            flex: 1,
          }}
        >
          TERMINAL
        </span>
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--vscode-text-muted)",
            padding: "2px",
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--vscode-text-muted)",
            padding: "2px",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Terminal content */}
      {!collapsed && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            lineHeight: "1.6",
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: "4px" }}>
              <span
                style={{
                  color: line.output
                    ? "var(--vscode-text-mute)"
                    : "var(--vscode-green)",
                }}
              >
                {line.prompt}
              </span>
              <span
                style={{
                  color: line.output
                    ? "var(--vscode-text-muted)"
                    : "var(--vscode-text)",
                }}
              >
                {line.command}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ color: "var(--vscode-green)" }}>$ </span>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "14px",
                background: "var(--vscode-accent)",
                animation: "pulse-glow 1s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
