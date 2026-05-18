"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Ticket,
  Users,
  Gift,
  Terminal,
  LayoutDashboard,
  FileCode2,
} from "lucide-react";
import { useState } from "react";

const explorerItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "inicio.tsx",
    ext: "tsx",
  },
  { href: "/raffle", icon: Ticket, label: "sorteio.tsx", ext: "tsx" },
  {
    href: "/participants",
    icon: Users,
    label: "participantes.tsx",
    ext: "tsx",
  },
  { href: "/transfer", icon: Gift, label: "transferir.tsx", ext: "tsx" },
  {
    href: "/sql-console",
    icon: Terminal,
    label: "sql-console.tsx",
    ext: "tsx",
    adminOnly: true,
  },
];

const extColors: Record<string, string> = {
  tsx: "#5aa9ff",
  ts: "#5aa9ff",
  sql: "#ff9e2c",
  md: "#2cf2a3",
};

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [explorerOpen, setExplorerOpen] = useState(true);

  const visibleItems = explorerItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <div className="vscode-sidebar">
      <div className="sidebar-header">
        <span>EXPLORER</span>
      </div>

      {/* Explorer tree */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <button
          onClick={() => setExplorerOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            width: "100%",
            padding: "4px 8px",
            background: "none",
            border: "none",
            color: "var(--vscode-text-muted)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: explorerOpen ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.15s",
            }}
          />
          LECTURE-DRAW-WEB
        </button>

        {explorerOpen && (
          <div>
            <div
              style={{
                padding: "2px 8px",
                fontSize: "11px",
                color: "var(--vscode-text-mute)",
              }}
            >
              📁 src/app
            </div>
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              const color = extColors[item.ext] ?? "var(--vscode-text-muted)";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  style={{ paddingLeft: "24px" }}
                >
                  <FileCode2 size={14} style={{ color, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px" }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* User section at bottom */}
      <div
        style={{
          borderTop: "1px solid var(--vscode-border)",
          padding: "8px",
          fontSize: "11px",
          color: "var(--vscode-text-mute)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--vscode-green)",
              boxShadow: "0 0 6px var(--vscode-green)",
            }}
          />
          <span>Neon DB conectado</span>
        </div>
      </div>
    </div>
  );
}
