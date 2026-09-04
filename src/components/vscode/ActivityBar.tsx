"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ticket,
  Users,
  Gift,
  Terminal,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/raffle", icon: Ticket, label: "Sorteio" },
  { href: "/participants", icon: Users, label: "Participantes" },
  { href: "/transfer", icon: Gift, label: "Transferir" },
  { href: "/sql-console", icon: Terminal, label: "SQL Console", adminOnly: true },
];

const bottomItems = [
  { href: "/config", icon: Settings, label: "Configurações" },
];

export function ActivityBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="vscode-activity-bar">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`activity-icon ${isActive ? "active" : ""}`}
              title={item.label}
            >
              <item.icon size={20} strokeWidth={1.5} />
            </Link>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="activity-icon"
            title={item.label}
          >
            <item.icon size={20} strokeWidth={1.5} />
          </Link>
        ))}
      </div>
    </div>
  );
}
