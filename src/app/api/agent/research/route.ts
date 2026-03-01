import { NextRequest, NextResponse } from 'next/server'
import { runResearchAgent } from '@/lib/agent'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messstelleId } = await request.json()
  if (!messstelleId) {
    return NextResponse.json({ error: 'messstelleId erforderlich' }, { status: 400 })
  }

  try {
    await runResearchAgent(messstelleId)
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
