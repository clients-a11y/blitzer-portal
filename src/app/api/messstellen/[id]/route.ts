import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const messstelle = await prisma.messstelle.findUnique({
    where: { id },
    include: { behoerde: true },
  })

  if (!messstelle) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(messstelle)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const messstelle = await prisma.messstelle.update({
    where: { id },
    data: body,
    include: { behoerde: true },
  })

  return NextResponse.json(messstelle)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await prisma.messstelle.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
