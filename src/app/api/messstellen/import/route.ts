import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify, extractBundesland, extractAutobahn, extractOrt } from '@/lib/utils'
import { runResearchAgent } from '@/lib/agent'
import type { VerstossArt } from '@/types'

interface XmlEntry {
  verstossOrt: string
  verstossArt: VerstossArt
}

const VALID_VERSTOSS_ARTEN: VerstossArt[] = ['GESCHWINDIGKEIT', 'ABSTAND', 'ROTLICHT']

function parseXml(xml: string): XmlEntry[] {
  const entries: XmlEntry[] = []
  const blockRegex = /<messstelle>([\s\S]*?)<\/messstelle>/gi
  let match

  while ((match = blockRegex.exec(xml)) !== null) {
    const block = match[1]
    const ortMatch = block.match(/<verstossOrt>([\s\S]*?)<\/verstossOrt>/i)
    const artMatch = block.match(/<verstossArt>([\s\S]*?)<\/verstossArt>/i)

    if (!ortMatch || !artMatch) continue

    const verstossOrt = ortMatch[1].trim()
    const verstossArt = artMatch[1].trim() as VerstossArt

    if (!verstossOrt || !VALID_VERSTOSS_ARTEN.includes(verstossArt)) continue

    entries.push({ verstossOrt, verstossArt })
  }

  return entries
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
  }

  if (!file.name.endsWith('.xml')) {
    return NextResponse.json({ error: 'Nur XML-Dateien erlaubt' }, { status: 400 })
  }

  const xml = await file.text()
  const entries = parseXml(xml)

  if (entries.length === 0) {
    return NextResponse.json(
      { error: 'Keine gültigen Einträge in der XML-Datei gefunden' },
      { status: 400 }
    )
  }

  // Alle Messstellen-Datensätze anlegen
  const createdIds: string[] = []

  for (const entry of entries) {
    const titel = entry.verstossOrt
    const bundesland = extractBundesland(titel) || 'Deutschland'
    const autobahn = extractAutobahn(titel)
    const ort = extractOrt(titel)

    const baseSlug = slugify(titel)
    let slug = baseSlug
    let counter = 1
    while (await prisma.messstelle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }

    const messstelle = await prisma.messstelle.create({
      data: {
        titel,
        verstossArt: entry.verstossArt,
        bundesland,
        autobahn,
        ort,
        slug,
        researchStatus: 'PENDING',
      },
    })

    createdIds.push(messstelle.id)
  }

  // Sequenzielle Recherche im Hintergrund starten
  ;(async () => {
    for (const id of createdIds) {
      await runResearchAgent(id).catch(console.error)
    }
  })()

  return NextResponse.json({ count: createdIds.length, ids: createdIds }, { status: 201 })
}
