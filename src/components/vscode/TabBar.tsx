"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "inicio.tsx" },
  { href: "/raffle", label: "sorteio.tsx" },
  { href: "/participants", label: "participantes.tsx" },
  { href: "/transfer", label: "transferir.tsx" },
  { href: "/sql-console", label: "sql-console.tsx" },
];

const tabColors: Record<string, string> = {
  "inicio.tsx": "#5aa9ff",
  "sorteio.tsx": "#ff39d2",
  "participantes.tsx": "#2cf2a3",
  "transferir.tsx": "#ff9e2c",
  "sql-console.tsx": "#ff4d6d",
};

export function TabBar() {
  const pathname = usePathname();

  return (
    <div className="vscode-tab-bar">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        const color = tabColors[tab.label] ?? "var(--vscode-text-muted)";
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`vscode-tab ${isActive ? "active" : ""}`}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: isActive ? color : "var(--vscode-border)",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            />
            <span
              style={{ color: isActive ? color : undefined, fontSize: "13px" }}
            >
              {tab.label}
            </span>
            {isActive && (
              <X
                size={14}
                style={{
                  marginLeft: "auto",
                  color: "var(--vscode-text-mute)",
                  flexShrink: 0,
                }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
