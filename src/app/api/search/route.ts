import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const messstellen = await prisma.messstelle.findMany({
    where: {
      istVeroeffentlicht: true,
      OR: [
        { titel: { contains: q, mode: 'insensitive' } },
        { beschreibung: { contains: q, mode: 'insensitive' } },
        { ort: { contains: q, mode: 'insensitive' } },
        { bundesland: { contains: q, mode: 'insensitive' } },
        { autobahn: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      titel: true,
      verstossArt: true,
      bundesland: true,
      ort: true,
      autobahn: true,
      slug: true,
      beschreibung: true,
    },
    take: 20,
  })

  return NextResponse.json({ results: messstellen })
}
