import { NextRequest, NextResponse } from 'next/server'
import { drawRaffle } from '@/actions/raffle'

export async function POST(_req: NextRequest) {
  try {
    const results = await drawRaffle()
    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
