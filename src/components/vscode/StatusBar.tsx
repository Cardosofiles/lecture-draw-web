"use client";

import { useEffect, useState } from "react";
import { GitBranch, Zap, Users, Wifi } from "lucide-react";

interface StatusBarProps {
  participantCount?: number;
}

export function StatusBar({ participantCount = 0 }: StatusBarProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("pt-BR", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="vscode-status-bar">
      {/* Left section */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#000",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <Wifi size={12} />
          Neon DB
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#000",
            fontSize: "11px",
          }}
        >
          <GitBranch size={12} />
          main
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#000",
            fontSize: "11px",
          }}
        >
          <Zap size={12} />
          AI Lecture 2026
        </span>
      </div>

      {/* Right section */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "#000",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <Users size={12} />
          {participantCount} participantes
        </span>
        <span
          style={{
            color: "#000",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
          }}
        >
          {time}
        </span>
        <span style={{ color: "#000", fontSize: "11px" }}>UTF-8</span>
        <span style={{ color: "#000", fontSize: "11px" }}>TypeScript</span>
      </div>
    </div>
  );
}
