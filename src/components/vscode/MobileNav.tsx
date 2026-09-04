"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Users, Gift, Terminal, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/raffle", icon: Ticket, label: "Sorteio" },
  { href: "/participants", icon: Users, label: "Pessoas" },
  { href: "/transfer", icon: Gift, label: "Transferir" },
  { href: "/sql-console", icon: Terminal, label: "SQL", adminOnly: true },
];

export function MobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="vscode-mobile-nav">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="mobile-nav-item"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              padding: "6px 10px",
              borderRadius: "6px",
              color: isActive
                ? "var(--vscode-accent)"
                : "var(--vscode-text-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
              background: isActive ? "var(--vscode-accent-ghost)" : "none",
            }}
          >
            <item.icon size={18} strokeWidth={1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
