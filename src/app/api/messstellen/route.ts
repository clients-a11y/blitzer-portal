import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify, extractBundesland, extractAutobahn, extractOrt } from '@/lib/utils'
import { runResearchAgent } from '@/lib/agent'
import type { VerstossArt } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bundesland = searchParams.get('bundesland')
  const autobahn = searchParams.get('autobahn')
  const verstossArt = searchParams.get('verstossArt')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search')
  const adminView = searchParams.get('admin') === 'true'

  const session = adminView ? await getServerSession(authOptions) : null
  if (adminView && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const where: Record<string, unknown> = adminView ? {} : { istVeroeffentlicht: true }

  if (bundesland) where.bundesland = bundesland
  if (autobahn) where.autobahn = autobahn
  if (verstossArt) where.verstossArt = verstossArt
  if (search) {
    where.OR = [
      { titel: { contains: search, mode: 'insensitive' } },
      { beschreibung: { contains: search, mode: 'insensitive' } },
      { ort: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [messstellen, total] = await Promise.all([
    prisma.messstelle.findMany({
      where,
      include: { behoerde: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.messstelle.count({ where }),
  ])

  return NextResponse.json({ messstellen, total, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { titel, verstossArt } = body

  if (!titel || !verstossArt) {
    return NextResponse.json({ error: 'Titel und Verstoßart sind erforderlich' }, { status: 400 })
  }

  const validVerstossArten: VerstossArt[] = ['GESCHWINDIGKEIT', 'ABSTAND', 'ROTLICHT']
  if (!validVerstossArten.includes(verstossArt)) {
    return NextResponse.json({ error: 'Ungültige Verstoßart' }, { status: 400 })
  }

  // Auto-extract info from title
  const bundesland = extractBundesland(titel) || 'Deutschland'
  const autobahn = extractAutobahn(titel)
  const ort = extractOrt(titel)

  // Generate unique slug
  const baseSlug = slugify(titel)
  let slug = baseSlug
  let counter = 1

  while (await prisma.messstelle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const messstelle = await prisma.messstelle.create({
    data: {
      titel,
      verstossArt,
      bundesland,
      autobahn,
      ort,
      slug,
      researchStatus: 'PENDING',
    },
  })

  // Trigger research agent asynchronously (direkt, ohne HTTP-Loopback)
  runResearchAgent(messstelle.id).catch(console.error)

  return NextResponse.json(messstelle, { status: 201 })
}
