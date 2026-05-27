"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WinnerModal } from "@/components/raffle/WinnerModal";

interface PrizeResult {
  id: string;
  prizeNumber: number;
  description: string;
  winnerId: string | null;
  transferredToId: string | null;
}

interface Props {
  currentUserId: string;
}

const WINNER_MODAL_KEY = "raffle_winner_seen";
const DRAW_REFRESHED_KEY = "raffle_draw_refreshed";

export function RaffleNotifier({ currentUserId }: Props) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [winnerPrize, setWinnerPrize] = useState<PrizeResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/raffle/results");
        if (!res.ok) return;
        const prizes: PrizeResult[] = await res.json();

        const drawn = prizes.some((p) => p.winnerId);
        if (!drawn) return;

        // Draw happened — stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Show winner modal once per device (localStorage persists across sessions)
        if (!localStorage.getItem(WINNER_MODAL_KEY)) {
          const myPrize = prizes.find((p) => p.winnerId === currentUserId);
          if (myPrize) {
            localStorage.setItem(WINNER_MODAL_KEY, "1");
            setWinnerPrize(myPrize);
            setModalOpen(true);
          }
        }

        // Refresh once per browser session so the draw results appear for everyone
        if (!sessionStorage.getItem(DRAW_REFRESHED_KEY)) {
          sessionStorage.setItem(DRAW_REFRESHED_KEY, "1");
          router.refresh();
        }
      } catch {
        // silent — network errors shouldn't break the UI
      }
    };

    check(); // immediate check on mount
    intervalRef.current = setInterval(check, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentUserId, router]);

  return (
    <WinnerModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      prizeNumber={winnerPrize?.prizeNumber ?? 0}
      prizeDescription={winnerPrize?.description ?? ""}
    />
  );
}
