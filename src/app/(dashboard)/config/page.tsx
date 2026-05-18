"use client";

import { useState, useTransition } from "react";
import { useSession } from "@/lib/auth-client";
import { deleteAccount } from "@/actions/users";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, User, AlertTriangle, X } from "lucide-react";

export default function ConfigPage() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();

  const user = session?.user;
  const isConfirmed = confirmText === "EXCLUIR";

  function handleDelete() {
    startTransition(async () => {
      await deleteAccount();
    });
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) setConfirmText("");
  }

  return (
    <div style={{ padding: "32px", maxWidth: "640px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--vscode-text)",
            fontFamily: "var(--font-display)",
            margin: 0,
            marginBottom: "4px",
          }}
        >
          Configurações
        </h1>
        <p
          style={{
            color: "var(--vscode-text-muted)",
            fontSize: "13px",
            margin: 0,
          }}
        >
          config.ts
        </p>
      </div>

      {/* User Info */}
      <section
        style={{
          background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
          border: "1px solid var(--vscode-border)",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <User size={14} color="var(--vscode-accent)" />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--vscode-text-muted)",
            }}
          >
            Perfil
          </span>
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {user.image && (
              <img
                src={user.image}
                alt={user.name}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "2px solid var(--vscode-border)",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: "var(--vscode-text)",
                  fontSize: "15px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "var(--vscode-text-muted)",
                  fontSize: "13px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </p>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <span
                className={
                  user.role === "admin"
                    ? "badge badge-magenta"
                    : "badge badge-accent"
                }
              >
                {user.role === "admin" ? "Admin" : "Participante"}
              </span>
            </div>
          </div>
        ) : (
          <p
            style={{
              color: "var(--vscode-text-muted)",
              fontSize: "13px",
              margin: 0,
            }}
          >
            Carregando...
          </p>
        )}
      </section>

      {/* Danger Zone */}
      <section
        style={{
          background: "rgba(255, 77, 109, 0.04)",
          border: "1px solid rgba(255, 77, 109, 0.25)",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <AlertTriangle size={14} color="var(--vscode-red)" />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--vscode-red)",
            }}
          >
            Zona de perigo
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 600,
                color: "var(--vscode-text)",
                fontSize: "14px",
              }}
            >
              Excluir conta
            </p>
            <p
              style={{
                margin: "4px 0 0",
                color: "var(--vscode-text-muted)",
                fontSize: "13px",
              }}
            >
              Remove permanentemente sua conta e todos os dados associados.
            </p>
          </div>
          <button
            className="btn-danger"
            onClick={() => setOpen(true)}
            style={{
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Trash2 size={14} />
            Excluir conta
          </button>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(3, 6, 12, 0.85)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />
          <Dialog.Content
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#070e1d",
              border: "1px solid rgba(255, 77, 109, 0.35)",
              borderRadius: "12px",
              padding: "28px",
              width: "min(440px, calc(100vw - 32px))",
              zIndex: 101,
              boxShadow: "0 0 40px rgba(255, 77, 109, 0.15)",
            }}
          >
            {/* Dialog Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "rgba(255, 77, 109, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 77, 109, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={16} color="var(--vscode-red)" />
                </div>
                <Dialog.Title
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--vscode-text)",
                  }}
                >
                  Excluir conta
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--vscode-text-muted)",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            {/* Description */}
            <Dialog.Description
              style={{
                fontSize: "13px",
                color: "var(--vscode-text-muted)",
                marginBottom: "20px",
                lineHeight: 1.6,
              }}
            >
              Esta ação é{" "}
              <strong style={{ color: "var(--vscode-red)" }}>
                permanente e irreversível
              </strong>
              . Sua conta, sessões, participação no sorteio e todos os dados
              serão removidos completamente do banco de dados.
            </Dialog.Description>

            {/* Confirmation input */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "var(--vscode-text-muted)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Digite{" "}
                <strong
                  style={{
                    color: "var(--vscode-red)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.05em",
                  }}
                >
                  EXCLUIR
                </strong>{" "}
                para confirmar
              </label>
              <input
                className="vscode-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                autoComplete="off"
                spellCheck={false}
                style={{
                  borderColor: isConfirmed
                    ? "rgba(255, 77, 109, 0.5)"
                    : undefined,
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <Dialog.Close asChild>
                <button className="btn-accent" disabled={isPending}>
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={!isConfirmed || isPending}
                style={{
                  opacity: !isConfirmed || isPending ? 0.4 : 1,
                  cursor: !isConfirmed || isPending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isPending ? (
                  "Excluindo..."
                ) : (
                  <>
                    <Trash2 size={14} />
                    Excluir permanentemente
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
