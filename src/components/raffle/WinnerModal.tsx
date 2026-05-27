"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prizeNumber: number;
  prizeDescription: string;
}

export function WinnerModal({
  isOpen,
  onClose,
  prizeNumber,
  prizeDescription,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3,6,12,0.92)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "24px",
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            style={{
              background: "linear-gradient(135deg, #070e1d 0%, #0a1528 100%)",
              border: "1px solid rgba(0,229,255,0.45)",
              borderRadius: "20px",
              padding: "40px 36px",
              maxWidth: "460px",
              width: "100%",
              textAlign: "center",
              position: "relative",
              boxShadow:
                "0 0 80px rgba(0,229,255,0.18), 0 0 160px rgba(0,229,255,0.08)",
            }}
          >
            {/* Top glow line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "15%",
                right: "15%",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, var(--vscode-accent), transparent)",
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "none",
                border: "none",
                color: "var(--vscode-text-mute)",
                cursor: "pointer",
                padding: "4px",
                lineHeight: 1,
              }}
            >
              <X size={18} />
            </button>

            {/* Trophy */}
            <motion.div
              animate={{ rotate: [-8, 8, -8, 8, 0], scale: [1, 1.12, 1] }}
              transition={{ delay: 0.25, duration: 0.7 }}
              style={{ fontSize: "64px", marginBottom: "16px", lineHeight: 1 }}
            >
              🏆
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "30px",
                fontWeight: 800,
                color: "var(--vscode-accent)",
                letterSpacing: "-0.02em",
                marginBottom: "8px",
              }}
            >
              VOCÊ GANHOU!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              style={{
                fontSize: "15px",
                color: "var(--vscode-text-muted)",
                marginBottom: "24px",
              }}
            >
              Parabéns! Você foi sorteado para receber um prêmio.
            </motion.p>

            {/* Prize card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                background: "rgba(0,229,255,0.06)",
                border: "1px solid rgba(0,229,255,0.2)",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--vscode-text-mute)",
                  fontFamily: "var(--font-mono)",
                  marginBottom: "6px",
                }}
              >
                PC Setup #{prizeNumber}
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--vscode-text)",
                }}
              >
                {prizeDescription}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ display: "flex", gap: "12px" }}
            >
              <Link
                href="/raffle"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--vscode-accent-dim)",
                  color: "var(--vscode-accent)",
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Ver sorteio
              </Link>
              <Link
                href="/transfer"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "8px",
                  background:
                    "linear-gradient(135deg, #ff9e2c 0%, #e07a00 100%)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ArrowRight size={15} />
                Transferir
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
