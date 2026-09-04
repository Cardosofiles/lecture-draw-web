"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error(
      "Acesso negado: somente administradores podem realizar o sorteio.",
    );
  }
  return session;
}

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Autenticação necessária.");
  }
  return session;
}

/** Fisher-Yates shuffle */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function drawRaffle() {
  await requireAdmin();

  // The whole draw is one transaction: either all 5 prizes get a winner and the
  // event is marked as drawn, or nothing changes at all.
  return prisma.$transaction(async (tx) => {
    const activeEvent = await tx.raffleEvent.findFirst({
      where: { isActive: true },
    });
    if (!activeEvent) {
      throw new Error(
        "Nenhum evento ativo configurado. Execute o seed do banco de dados.",
      );
    }
    if (activeEvent.drawnAt) {
      throw new Error(
        "O sorteio deste evento já foi realizado e não pode ser repetido.",
      );
    }

    // Get all eligible participants — admins are excluded from the draw
    const entries = await tx.raffleEntry.findMany({
      where: { user: { role: { not: "admin" } } },
      include: { user: true },
    });

    if (entries.length < 5) {
      throw new Error(
        `Participantes elegíveis insuficientes. Precisamos de pelo menos 5, mas há apenas ${entries.length} (administradores são excluídos do sorteio).`,
      );
    }

    // Get existing prizes
    const prizes = await tx.rafflePrize.findMany({
      orderBy: { prizeNumber: "asc" },
    });

    if (prizes.length < 5) {
      throw new Error(
        "Prêmios não configurados. Execute o seed do banco de dados.",
      );
    }

    const now = new Date();

    // Claim the draw before touching any prize. The `drawnAt: null` filter makes
    // this the atomic gate: a second concurrent draw matches 0 rows and aborts.
    const claimed = await tx.raffleEvent.updateMany({
      where: { id: activeEvent.id, drawnAt: null },
      data: { drawnAt: now },
    });
    if (claimed.count === 0) {
      throw new Error(
        "O sorteio deste evento já foi realizado e não pode ser repetido.",
      );
    }

    // Shuffle and pick 5 unique winners
    const winners = shuffle(entries).slice(0, 5);

    // Assign winners to prizes — sequential so the transaction stays ordered
    const results = [];
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
        }),
      );
    }

    return results;
  });
}

export async function transferPrize(prizeId: string, recipientId: string) {
  const session = await requireSession();

  const prize = await prisma.rafflePrize.findUnique({
    where: { id: prizeId },
    include: { winner: true, transferredTo: true },
  });

  if (!prize) throw new Error("Prêmio não encontrado.");
  if (prize.winnerId !== session.user.id) {
    throw new Error("Você não é o ganhador deste prêmio.");
  }
  if (prize.transferredToId) {
    throw new Error(
      "Este prêmio já foi transferido e não pode ser transferido novamente.",
    );
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
  });
  if (!recipient) throw new Error("Destinatário não encontrado.");
  if (!recipient.isParticipant || recipient.role === "admin") {
    throw new Error("O destinatário não é um participante do evento.");
  }
  if (recipient.id === session.user.id) {
    throw new Error("Você não pode transferir o prêmio para si mesmo.");
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
  ]);

  return updated;
}

export async function getRaffleResults() {
  const prizes = await prisma.rafflePrize.findMany({
    orderBy: { prizeNumber: "asc" },
    include: {
      winner: true,
      transferredTo: true,
    },
  });
  return prizes;
}

export async function getRaffleEvent() {
  return prisma.raffleEvent.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}
