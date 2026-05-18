"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Search,
  Check,
  X,
  Gift,
  AlertTriangle,
} from "lucide-react";
import { transferPrize } from "@/actions/raffle";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface RafflePrize {
  id: string;
  prizeNumber: number;
  description: string;
  winnerId?: string | null;
  transferredToId?: string | null;
  winner?: User | null;
  transferredTo?: User | null;
}

interface Props {
  userPrize: RafflePrize | null;
  participants: User[];
  currentUser: { id: string; name: string; email: string };
}

export function TransferView({ userPrize, participants, currentUser }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleTransfer = () => {
    if (!userPrize || !selected) return;
    setError(null);
    startTransition(async () => {
      try {
        await transferPrize(userPrize.id, selected.id);
        setSuccess(true);
        setShowConfirm(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao transferir prêmio");
        setShowConfirm(false);
      }
    });
  };

  // Already transferred
  if (userPrize?.transferredToId) {
    return (
      <div style={{ padding: "32px", maxWidth: "600px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
            border: "1px solid rgba(255,158,44,0.3)",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <Gift
            size={48}
            style={{ color: "var(--vscode-orange)", margin: "0 auto 16px" }}
          />
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              color: "var(--vscode-text)",
              marginBottom: "8px",
            }}
          >
            Prêmio já transferido
          </h2>
          <p style={{ fontSize: "14px", color: "var(--vscode-text-muted)" }}>
            Você transferiu o{" "}
            <strong style={{ color: "var(--vscode-orange)" }}>
              PC Setup #{userPrize.prizeNumber}
            </strong>{" "}
            para{" "}
            <strong style={{ color: "var(--vscode-text)" }}>
              {userPrize.transferredTo?.name}
            </strong>
            .
          </p>
        </div>
      </div>
    );
  }

  // No prize won
  if (!userPrize) {
    return (
      <div style={{ padding: "32px", maxWidth: "600px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "var(--vscode-text-mute)",
            fontFamily: "var(--font-mono)",
            marginBottom: "4px",
          }}
        >
          transferir
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--vscode-text)",
            marginBottom: "16px",
          }}
        >
          <span style={{ color: "var(--vscode-orange)" }}>Transferir</span>{" "}
          Prêmio
        </h1>
        <div
          style={{
            background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
            border: "1px solid var(--vscode-border)",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <Gift
            size={48}
            style={{ color: "var(--vscode-text-mute)", margin: "0 auto 16px" }}
          />
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              color: "var(--vscode-text-muted)",
              marginBottom: "8px",
            }}
          >
            Você não ganhou um prêmio ainda
          </h2>
          <p style={{ fontSize: "14px", color: "var(--vscode-text-mute)" }}>
            Esta página está disponível somente para ganhadores do sorteio.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ padding: "32px", maxWidth: "600px" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
            border: "1px solid rgba(44,242,163,0.3)",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(44,242,163,0.12)",
              border: "2px solid rgba(44,242,163,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Check size={32} style={{ color: "var(--vscode-green)" }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              color: "var(--vscode-text)",
              marginBottom: "8px",
            }}
          >
            Prêmio transferido!
          </h2>
          <p style={{ fontSize: "14px", color: "var(--vscode-text-muted)" }}>
            Seu{" "}
            <strong style={{ color: "var(--vscode-green)" }}>
              PC Setup #{userPrize.prizeNumber}
            </strong>{" "}
            foi transferido para <strong>{selected?.name}</strong>.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "640px" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "var(--vscode-text-mute)",
            fontFamily: "var(--font-mono)",
            marginBottom: "4px",
          }}
        >
          transferir
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
          <span style={{ color: "var(--vscode-orange)" }}>Transferir</span>{" "}
          Prêmio
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--vscode-text-muted)",
            marginBottom: "24px",
          }}
        >
          Transfira seu prêmio para outro participante do evento
        </p>

        {/* Current prize card */}
        <div
          style={{
            background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
            border: "1px solid rgba(255,158,44,0.3)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: "32px" }}>🏆</div>
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--vscode-text-mute)",
                marginBottom: "2px",
              }}
            >
              Seu prêmio
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--vscode-orange)",
                fontFamily: "var(--font-mono)",
              }}
            >
              PC Setup #{userPrize.prizeNumber}
            </div>
            <div
              style={{ fontSize: "13px", color: "var(--vscode-text-muted)" }}
            >
              {userPrize.description}
            </div>
          </div>
        </div>

        {/* Recipient search */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              fontSize: "12px",
              color: "var(--vscode-text-muted)",
              fontWeight: 600,
              display: "block",
              marginBottom: "8px",
            }}
          >
            Selecionar destinatário
          </label>
          <div style={{ position: "relative" }}>
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
              id="transfer-recipient-search"
              type="text"
              placeholder="Buscar participante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="vscode-input"
              style={{ paddingLeft: "30px" }}
            />
          </div>
        </div>

        {/* Participant list */}
        <div
          style={{
            background: "#030509",
            border: "1px solid var(--vscode-border)",
            borderRadius: "8px",
            maxHeight: "240px",
            overflowY: "auto",
            marginBottom: "20px",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--vscode-text-mute)",
                fontSize: "13px",
              }}
            >
              Nenhum participante encontrado
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 14px",
                  background:
                    selected?.id === p.id
                      ? "var(--vscode-accent-ghost)"
                      : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(0,200,255,0.06)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid var(--vscode-border)",
                    flexShrink: 0,
                    background: "var(--vscode-activity-bar)",
                  }}
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
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
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--vscode-text)",
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--vscode-text-mute)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {p.email}
                  </div>
                </div>
                {selected?.id === p.id && (
                  <Check
                    size={16}
                    style={{ color: "var(--vscode-accent)", flexShrink: 0 }}
                  />
                )}
              </button>
            ))
          )}
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(255,77,109,0.1)",
              border: "1px solid rgba(255,77,109,0.3)",
              color: "var(--vscode-red)",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Transfer button */}
        <motion.button
          whileHover={selected ? { scale: 1.02 } : {}}
          whileTap={selected ? { scale: 0.98 } : {}}
          onClick={() => setShowConfirm(true)}
          disabled={!selected || isPending}
          id="btn-transfer-prize"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "12px 20px",
            borderRadius: "8px",
            background: selected
              ? "linear-gradient(135deg, #ff9e2c 0%, #e07a00 100%)"
              : "rgba(255,158,44,0.1)",
            border: selected ? "none" : "1px solid rgba(255,158,44,0.2)",
            color: selected ? "#000" : "var(--vscode-text-mute)",
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 700,
            cursor: selected ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          <ArrowRight size={18} />
          {selected
            ? `Transferir para ${selected.name}`
            : "Selecione um destinatário"}
        </motion.button>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(3,6,12,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "24px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
                border: "1px solid var(--vscode-border)",
                borderRadius: "16px",
                padding: "32px",
                maxWidth: "440px",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "30%",
                  right: "30%",
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, var(--vscode-orange), transparent)",
                }}
              />

              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "none",
                  border: "none",
                  color: "var(--vscode-text-mute)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={16} />
              </button>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--vscode-text)",
                    marginBottom: "8px",
                  }}
                >
                  Confirmar transferência?
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--vscode-text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  Você está transferindo o{" "}
                  <strong style={{ color: "var(--vscode-orange)" }}>
                    PC Setup #{userPrize.prizeNumber}
                  </strong>{" "}
                  para{" "}
                  <strong style={{ color: "var(--vscode-text)" }}>
                    {selected.name}
                  </strong>
                  .
                  <br />
                  <span
                    style={{ color: "var(--vscode-red)", fontSize: "12px" }}
                  >
                    Esta ação não pode ser desfeita.
                  </span>
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-accent"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isPending}
                  id="btn-confirm-transfer"
                  style={{
                    flex: 1,
                    padding: "8px 20px",
                    borderRadius: "6px",
                    background:
                      "linear-gradient(135deg, #ff9e2c 0%, #e07a00 100%)",
                    border: "none",
                    color: "#000",
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: isPending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {isPending ? "Transferindo..." : "Confirmar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
