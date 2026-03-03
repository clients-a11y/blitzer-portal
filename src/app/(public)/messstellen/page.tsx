import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS } from '@/types'
import { MapPin, ArrowRight, Gauge, Maximize2, CircleX, SlidersHorizontal } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Alle Messstellen',
  description:
    'Übersicht aller Blitzer-Messstellen in Deutschland, sortiert nach Bundesland und Verstoßart.',
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ verstossArt?: string; bundesland?: string }>
}

async function getMessstellen(verstossArt?: string, bundesland?: string) {
  const where: Record<string, unknown> = { istVeroeffentlicht: true }
  if (verstossArt) where.verstossArt = verstossArt
  if (bundesland) where.bundesland = { contains: bundesland, mode: 'insensitive' }

  const [messstellen, verstossStats] = await Promise.all([
    prisma.messstelle.findMany({
      where,
      orderBy: [{ bundesland: 'asc' }, { titel: 'asc' }],
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
    }),
    prisma.messstelle.groupBy({
      by: ['verstossArt'],
      where: { istVeroeffentlicht: true },
      _count: { id: true },
    }),
  ])

  return { messstellen, verstossStats }
}

const verstossConfig = {
  GESCHWINDIGKEIT: {
    Icon: Gauge,
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    iconColor: 'text-amber-600',
  },
  ABSTAND: {
    Icon: Maximize2,
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    iconColor: 'text-sky-600',
  },
  ROTLICHT: {
    Icon: CircleX,
    badge: 'bg-red-50 text-red-600 border border-red-200',
    iconColor: 'text-red-600',
  },
} as const

export default async function MessstellenPage({ searchParams }: Props) {
  const params = await searchParams
  const { messstellen, verstossStats } = await getMessstellen(params.verstossArt, params.bundesland)
  const totalAll = verstossStats.reduce((s, v) => s + v._count.id, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-gov py-6">
          <Breadcrumb items={[{ label: 'Startseite', href: '/' }, { label: 'Messstellen' }]} />
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Messstellen-Verzeichnis
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {messstellen.length} Messstelle{messstellen.length !== 1 ? 'n' : ''} gefunden
                {params.verstossArt &&
                  ` · ${VERSTOSS_LABELS[params.verstossArt as keyof typeof VERSTOSS_LABELS]}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter aktiv</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-gov py-8">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/messstellen"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
              !params.verstossArt
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            Alle ({totalAll})
          </Link>
          {(Object.entries(verstossConfig) as [keyof typeof verstossConfig, typeof verstossConfig[keyof typeof verstossConfig]][]).map(
            ([art, cfg]) => {
              const count = verstossStats.find((v) => v.verstossArt === art)?._count.id ?? 0
              const Icon = cfg.Icon
              const isActive = params.verstossArt === art
              return (
                <Link
                  key={art}
                  href={`/messstellen?verstossArt=${art}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {VERSTOSS_LABELS[art]} ({count})
                </Link>
              )
            },
          )}
        </div>

        {/* Card grid */}
        {messstellen.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">Keine Messstellen gefunden.</p>
            <Link
              href="/messstellen"
              className="mt-3 inline-block text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
            >
              Filter zurücksetzen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {messstellen.map((m) => {
              const cfg = verstossConfig[m.verstossArt as keyof typeof verstossConfig]
              const Icon = cfg.Icon
              const href = `/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`
              return (
                <article
                  key={m.id}
                  className="group bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex flex-col"
                  itemScope
                  itemType="https://schema.org/Place"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}
                    >
                      <Icon className="w-3 h-3" />
                      {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </span>
                    {m.autobahn && (
                      <span className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded-lg font-mono font-bold tracking-wide">
                        {m.autobahn}
                      </span>
                    )}
                  </div>

                  <h2
                    className="font-bold text-slate-900 leading-snug text-base mb-1.5 flex-1"
                    itemProp="name"
                  >
                    <Link
                      href={href}
                      className="hover:text-indigo-700 transition-colors duration-200 cursor-pointer"
                      itemProp="url"
                    >
                      {m.titel}
                    </Link>
                  </h2>

                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {m.bundesland}{m.ort && ` · ${m.ort}`}
                  </p>

                  {m.beschreibung && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {m.beschreibung}
                    </p>
                  )}

                  <Link
                    href={href}
                    className="mt-auto inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 group-hover:gap-2 cursor-pointer"
                  >
                    Details ansehen <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
