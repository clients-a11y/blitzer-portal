import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const [
    totalMessstellen,
    veroeffentlicht,
    bundeslaender,
    geschwindigkeit,
    abstand,
    rotlicht,
    behoerden,
  ] = await Promise.all([
    prisma.messstelle.count(),
    prisma.messstelle.count({ where: { istVeroeffentlicht: true } }),
    prisma.messstelle.groupBy({
      by: ['bundesland'],
      where: { istVeroeffentlicht: true },
      _count: true,
      orderBy: { _count: { bundesland: 'desc' } },
    }),
    prisma.messstelle.count({ where: { verstossArt: 'GESCHWINDIGKEIT', istVeroeffentlicht: true } }),
    prisma.messstelle.count({ where: { verstossArt: 'ABSTAND', istVeroeffentlicht: true } }),
    prisma.messstelle.count({ where: { verstossArt: 'ROTLICHT', istVeroeffentlicht: true } }),
    prisma.behoerde.count(),
  ])

  return NextResponse.json({
    totalMessstellen,
    veroeffentlicht,
    bundeslaender,
    geschwindigkeit,
    abstand,
    rotlicht,
    behoerden,
  })
}
