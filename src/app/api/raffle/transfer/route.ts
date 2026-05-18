import { NextRequest, NextResponse } from "next/server";
import { transferPrize } from "@/actions/raffle";

export async function POST(req: NextRequest) {
  try {
    const { prizeId, recipientId } = await req.json();
    if (!prizeId || !recipientId) {
      return NextResponse.json(
        { error: "prizeId and recipientId are required" },
        { status: 400 },
      );
    }
    const result = await transferPrize(prizeId, recipientId);
    return NextResponse.json({ success: true, prize: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
