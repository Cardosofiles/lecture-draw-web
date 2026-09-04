'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Falha de regra de negócio — algo que o usuário pode ler e agir a respeito
 * ("faltam participantes", "o prêmio já foi transferido"), e não um defeito.
 *
 * A distinção existe porque em produção o Next.js **mascara** toda exceção que
 * atravessa a fronteira de uma Server Action: a mensagem original é descartada
 * e o cliente recebe um `Error` genérico, que o build minificado do React
 * renderiza como "Minified React error #441". Era exatamente isso que aparecia
 * no lugar de "Participantes elegíveis insuficientes…" em /raffle.
 *
 * Só o que é `RaffleError` volta ao browser com o texto intacto (via
 * `toActionResult`). Qualquer outra exceção — um erro do Prisma, por exemplo,
 * que pode carregar a connection string — continua mascarada de propósito.
 *
 * A classe fica sem `export`: em um arquivo `'use server'` todo export precisa
 * ser uma função assíncrona.
 */
class RaffleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RaffleError'
  }
}

/** Resultado de uma Server Action chamada direto por um Client Component. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Converte a promessa de uma ação em `ActionResult`, para que a falha viaje
 * como *dado* serializável em vez de exceção — o único formato que sobrevive
 * ao mascaramento de produção.
 */
async function toActionResult<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (error) {
    if (error instanceof RaffleError) {
      return { ok: false, error: error.message }
    }
    // Defeito de verdade: fica no log do servidor, nunca na tela.
    console.error('[raffle] erro inesperado em Server Action:', error)
    return { ok: false, error: 'Erro inesperado. Tente novamente em instantes.' }
  }
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    throw new RaffleError('Acesso negado: somente administradores podem realizar o sorteio.')
  }
  return session
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new RaffleError('Autenticação necessária.')
  }
  return session
}

/** Fisher-Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function drawRaffle() {
  await requireAdmin()

  // The whole draw is one transaction: either all 5 prizes get a winner and the
  // event is marked as drawn, or nothing changes at all.
  return prisma.$transaction(async (tx) => {
    const activeEvent = await tx.raffleEvent.findFirst({
      where: { isActive: true },
    })
    if (!activeEvent) {
      throw new RaffleError('Nenhum evento ativo configurado. Execute o seed do banco de dados.')
    }
    if (activeEvent.drawnAt) {
      throw new RaffleError('O sorteio deste evento já foi realizado e não pode ser repetido.')
    }

    // Get all eligible participants — admins are excluded from the draw
    const entries = await tx.raffleEntry.findMany({
      where: { user: { role: { not: 'admin' } } },
      include: { user: true },
    })

    if (entries.length < 5) {
      throw new RaffleError(
        `Participantes elegíveis insuficientes. Precisamos de pelo menos 5, mas há apenas ${entries.length} (administradores são excluídos do sorteio).`
      )
    }

    // Get existing prizes
    const prizes = await tx.rafflePrize.findMany({
      orderBy: { prizeNumber: 'asc' },
    })

    if (prizes.length < 5) {
      throw new RaffleError('Prêmios não configurados. Execute o seed do banco de dados.')
    }

    const now = new Date()

    // Claim the draw before touching any prize. The `drawnAt: null` filter makes
    // this the atomic gate: a second concurrent draw matches 0 rows and aborts.
    const claimed = await tx.raffleEvent.updateMany({
      where: { id: activeEvent.id, drawnAt: null },
      data: { drawnAt: now },
    })
    if (claimed.count === 0) {
      throw new RaffleError('O sorteio deste evento já foi realizado e não pode ser repetido.')
    }

    // Shuffle and pick 5 unique winners
    const winners = shuffle(entries).slice(0, 5)

    // Assign winners to prizes — sequential so the transaction stays ordered
    const results = []
    for (const [index, prize] of prizes.slice(0, 5).entries()) {
      results.push(
        await tx.rafflePrize.update({
          where: { id: prize.id },
          data: {
            winnerId: winners[index].userId,
            drawnAt: now,
            transferredToId: null,
          },
          include: {
            winner: true,
            transferredTo: true,
          },
        })
      )
    }

    return results
  })
}

export async function transferPrize(prizeId: string, recipientId: string) {
  const session = await requireSession()

  const prize = await prisma.rafflePrize.findUnique({
    where: { id: prizeId },
    include: { winner: true, transferredTo: true },
  })

  if (!prize) throw new RaffleError('Prêmio não encontrado.')
  if (prize.winnerId !== session.user.id) {
    throw new RaffleError('Você não é o ganhador deste prêmio.')
  }
  if (prize.transferredToId) {
    throw new RaffleError('Este prêmio já foi transferido e não pode ser transferido novamente.')
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
  })
  if (!recipient) throw new RaffleError('Destinatário não encontrado.')
  if (!recipient.isParticipant || recipient.role === 'admin') {
    throw new RaffleError('O destinatário não é um participante do evento.')
  }
  if (recipient.id === session.user.id) {
    throw new RaffleError('Você não pode transferir o prêmio para si mesmo.')
  }

  const [updated] = await prisma.$transaction([
    prisma.rafflePrize.update({
      where: { id: prizeId },
      data: { transferredToId: recipientId },
      include: { winner: true, transferredTo: true },
    }),
    prisma.transferLog.create({
      data: {
        prizeId,
        fromUserId: session.user.id,
        toUserId: recipientId,
      },
    }),
  ])

  return updated
}

/**
 * Ponto de entrada do botão "Sortear" na UI.
 *
 * `drawRaffle()` continua lançando — é o contrato usado pelas rotas de API
 * (que serializam a mensagem por conta própria, no servidor) e pelos testes.
 * Client Components chamam esta versão, que devolve o motivo da recusa.
 */
export async function drawRaffleAction() {
  return toActionResult(drawRaffle)
}

/** Ponto de entrada da tela de transferência. Ver {@link drawRaffleAction}. */
export async function transferPrizeAction(prizeId: string, recipientId: string) {
  return toActionResult(() => transferPrize(prizeId, recipientId))
}

export async function getRaffleResults() {
  const prizes = await prisma.rafflePrize.findMany({
    orderBy: { prizeNumber: 'asc' },
    include: {
      winner: true,
      transferredTo: true,
    },
  })
  return prizes
}

export async function getRaffleEvent() {
  return prisma.raffleEvent.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}
