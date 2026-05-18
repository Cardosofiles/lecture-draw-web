import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/actions/users";

export async function DELETE(_req: NextRequest) {
  try {
    await deleteAccount();
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
