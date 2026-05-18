"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteAccount() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Autenticação necessária.");

  const userId = session.user.id;

  // Nullify any prizes won (unawarded so they can be redrawn)
  await prisma.rafflePrize.updateMany({
    where: { winnerId: userId },
    data: { winnerId: null, drawnAt: null },
  });

  // Also clear transferred prizes to this user
  await prisma.rafflePrize.updateMany({
    where: { transferredToId: userId },
    data: { transferredToId: null },
  });

  // Delete the user (cascades: Session, Account, RaffleEntry, QueryLog)
  await prisma.user.delete({ where: { id: userId } });

  redirect("/login");
}

export async function getAllParticipants() {
  return prisma.user.findMany({
    where: {
      isParticipant: true,
      role: { not: "admin" }, // admins are excluded from the raffle
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      raffleEntries: { select: { id: true } },
      prizesWon: { select: { id: true, prizeNumber: true, description: true } },
    },
  });
}

export async function getParticipantCount() {
  // Exclude admin users from the participant count
  return prisma.raffleEntry.count({
    where: { user: { role: { not: "admin" } } },
  });
}
