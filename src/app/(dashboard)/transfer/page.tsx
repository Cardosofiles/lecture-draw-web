import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransferView } from "@/components/raffle/TransferView";

export const metadata = { title: "Transferir Prêmio — AI Lecture Raffle" };

export default async function TransferPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Find if current user has won a prize
  const userPrize = await prisma.rafflePrize.findFirst({
    where: { winnerId: session.user.id },
    include: { winner: true, transferredTo: true },
  });

  // Get all participants except the current user for recipient selection
  const participants = await prisma.user.findMany({
    where: {
      isParticipant: true,
      role: { not: "admin" },
      id: { not: session.user.id },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, image: true },
  });

  return (
    <TransferView
      userPrize={userPrize}
      participants={participants}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }}
    />
  );
}
