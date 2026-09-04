'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WinnerModal } from '@/components/raffle/WinnerModal'
import {
  drawRefreshedKey,
  hasBeenDrawn,
  nextPollDelay,
  pendingWinnerPrize,
  winnerSeenKey,
  type PrizeSnapshot,
} from '@/lib/raffle-notifications'

interface Props {
  currentUserId: string
}

/** localStorage is unavailable in some privacy modes — never break the page. */
function safeStorage(store: () => Storage) {
  return {
    has(key: string) {
      try {
        return store().getItem(key) !== null
      } catch {
        return false
      }
    },
    mark(key: string) {
      try {
        store().setItem(key, '1')
      } catch {
        /* ignore */
      }
    },
  }
}

export function RaffleNotifier({ currentUserId }: Props) {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [winnerPrize, setWinnerPrize] = useState<PrizeSnapshot | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempt = 0
    const local = safeStorage(() => localStorage)
    const session = safeStorage(() => sessionStorage)

    const check = async () => {
      try {
        const res = await fetch('/api/raffle/results')
        if (!res.ok) return false
        const prizes: PrizeSnapshot[] = await res.json()
        if (!hasBeenDrawn(prizes)) return false

        // Winner modal is scoped to this user and this draw, so two people on
        // one browser each see theirs, and a re-draw notifies again.
        const mine = pendingWinnerPrize(prizes, currentUserId, local.has)
        if (mine) {
          local.mark(winnerSeenKey(currentUserId, mine))
          setWinnerPrize(mine)
          setModalOpen(true)
        }

        // Refresh once per draw so the results appear for everyone
        const refreshKey = drawRefreshedKey(prizes)
        if (!session.has(refreshKey)) {
          session.mark(refreshKey)
          router.refresh()
        }
        return true
      } catch {
        // silent — network errors shouldn't break the UI
        return false
      }
    }

    const loop = async () => {
      const drawn = await check()
      if (cancelled || drawn) return // draw landed: stop polling
      timeoutRef.current = setTimeout(loop, nextPollDelay(attempt++))
    }

    void loop()

    return () => {
      cancelled = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [currentUserId, router])

  return (
    <WinnerModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      prizeNumber={winnerPrize?.prizeNumber ?? 0}
      prizeDescription={winnerPrize?.description ?? ''}
    />
  )
}
