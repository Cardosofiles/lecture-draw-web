"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Trophy, Calendar } from "lucide-react";

interface ParticipantPrize {
  id: string;
  prizeNumber: number;
  description: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  createdAt: Date;
  raffleEntries: { id: string }[];
  prizesWon: ParticipantPrize[];
}

interface Props {
  participants: Participant[];
  currentUserId: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 3)}****@${domain}`;
}

export function ParticipantsView({ participants, currentUserId }: Props) {
  const [search, setSearch] = useState("");

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px" }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "var(--vscode-text-mute)",
            fontFamily: "var(--font-mono)",
            marginBottom: "4px",
          }}
        >
          participantes
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--vscode-text)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "var(--vscode-green)" }}>Participantes</span>
        </h1>
        <p style={{ fontSize: "14px", color: "var(--vscode-text-muted)" }}>
          {participants.length} inscritos no sorteio
        </p>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          position: "relative",
          marginBottom: "20px",
          maxWidth: "400px",
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--vscode-text-mute)",
            pointerEvents: "none",
          }}
        />
        <input
          id="search-participants"
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="vscode-input"
          style={{ paddingLeft: "30px" }}
        />
      </motion.div>

      {/* Count header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: "var(--vscode-activity-bar)",
          borderRadius: "6px 6px 0 0",
          borderBottom: "1px solid var(--vscode-border)",
          fontSize: "11px",
          color: "var(--vscode-text-muted)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        <Users size={12} />
        <span>{filtered.length} participantes</span>
      </div>

      {/* Desktop Table */}
      <div
        style={{
          background: "linear-gradient(180deg, #070e1d 0%, #060b16 100%)",
          border: "1px solid var(--vscode-border)",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto auto",
            padding: "8px 16px",
            borderBottom: "1px solid var(--vscode-border)",
            background: "var(--vscode-activity-bar)",
          }}
          className="md-only"
        >
          {["Participante", "Email", "Inscrito em", "Status"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: "11px",
                color: "var(--vscode-text-muted)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--vscode-text-mute)",
              fontSize: "14px",
            }}
          >
            Nenhum participante encontrado
          </div>
        ) : (
          filtered.map((participant, index) => {
            const hasPrize = participant.prizesWon.length > 0;
            const isMe = participant.id === currentUserId;

            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto auto",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(0,200,255,0.06)",
                  gap: "16px",
                  background: isMe ? "rgba(0,229,255,0.03)" : "transparent",
                  transition: "background 0.12s",
                }}
              >
                {/* Name & avatar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `1px solid ${hasPrize ? "rgba(255,57,210,0.4)" : "var(--vscode-border)"}`,
                      flexShrink: 0,
                      background: "var(--vscode-activity-bar)",
                    }}
                  >
                    {participant.image ? (
                      <Image
                        src={participant.image}
                        alt={participant.name}
                        width={32}
                        height={32}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--vscode-accent)",
                        }}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--vscode-text)",
                        fontWeight: isMe ? 600 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {participant.name}
                      {isMe && (
                        <span
                          style={{
                            marginLeft: "6px",
                            fontSize: "11px",
                            color: "var(--vscode-accent)",
                          }}
                        >
                          (você)
                        </span>
                      )}
                    </div>
                    {hasPrize && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--vscode-magenta)",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Trophy size={9} />
                        PC #{participant.prizesWon[0].prizeNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--vscode-text-muted)",
                    fontFamily: "var(--font-mono)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {maskEmail(participant.email)}
                </div>

                {/* Join date */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: "var(--vscode-text-mute)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Calendar size={10} />
                  {new Date(participant.createdAt).toLocaleDateString("pt-BR")}
                </div>

                {/* Status badge */}
                <div>
                  {hasPrize ? (
                    <span className="badge badge-magenta">🏆 Premiado</span>
                  ) : (
                    <span className="badge badge-green">● Participando</span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
