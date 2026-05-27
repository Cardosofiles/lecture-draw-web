import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prizes = await prisma.rafflePrize.findMany({
    orderBy: { prizeNumber: "asc" },
    select: {
      id: true,
      prizeNumber: true,
      description: true,
      winnerId: true,
      transferredToId: true,
      drawnAt: true,
    },
  });

  return NextResponse.json(prizes);
}
