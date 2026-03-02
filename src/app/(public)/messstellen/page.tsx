import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'
import { MapPin, ArrowRight, Gauge, Maximize2, CircleX } from 'lucide-react'

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

  const [messstellen, bundeslaenderStats, verstossStats] = await Promise.all([
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
      by: ['bundesland'],
      where: { istVeroeffentlicht: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.messstelle.groupBy({
      by: ['verstossArt'],
      where: { istVeroeffentlicht: true },
      _count: { id: true },
    }),
  ])

  return { messstellen, bundeslaenderStats, verstossStats }
}

const verstossConfig = {
  GESCHWINDIGKEIT: {
    Icon: Gauge,
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    stripe: 'bg-amber-400',
    statBg: 'bg-amber-100',
    statIcon: 'text-amber-600',
  },
  ABSTAND: {
    Icon: Maximize2,
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    stripe: 'bg-sky-400',
    statBg: 'bg-sky-100',
    statIcon: 'text-sky-600',
  },
  ROTLICHT: {
    Icon: CircleX,
    badge: 'bg-red-50 text-red-600 border border-red-200',
    stripe: 'bg-red-400',
    statBg: 'bg-red-100',
    statIcon: 'text-red-600',
  },
} as const

export default async function MessstellenPage({ searchParams }: Props) {
  const params = await searchParams
  const { messstellen, bundeslaenderStats, verstossStats } = await getMessstellen(
    params.verstossArt,
    params.bundesland,
  )

  const totalAll = verstossStats.reduce((sum, v) => sum + v._count.id, 0)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container-gov py-8">
        <Breadcrumb items={[{ label: 'Startseite', href: '/' }, { label: 'Messstellen' }]} />

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-950 mb-1.5">
            Blitzer-Messstellen Deutschland
          </h1>
          <p className="text-slate-600 text-sm">
            {messstellen.length} Messstelle{messstellen.length !== 1 ? 'n' : ''} gefunden
            {params.bundesland && ` in ${params.bundesland}`}
            {params.verstossArt &&
              ` · ${VERSTOSS_LABELS[params.verstossArt as keyof typeof VERSTOSS_LABELS]}`}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(
            Object.entries(verstossConfig) as [
              keyof typeof verstossConfig,
              (typeof verstossConfig)[keyof typeof verstossConfig],
            ][]
          ).map(([art, cfg]) => {
            const count = verstossStats.find((v) => v.verstossArt === art)?._count.id ?? 0
            const Icon = cfg.Icon
            return (
              <Link
                key={art}
                href={`/messstellen?verstossArt=${art}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex items-center gap-2.5 hover:border-sky-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.statBg}`}
                >
                  <Icon className={`w-4 h-4 ${cfg.statIcon}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-slate-900 leading-none">{count}</div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    {VERSTOSS_LABELS[art]}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              <Link
                href="/messstellen"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 cursor-pointer ${
                  !params.verstossArt
                    ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-700'
                }`}
              >
                Alle ({totalAll})
              </Link>
              {(
                Object.entries(verstossConfig) as [
                  keyof typeof verstossConfig,
                  (typeof verstossConfig)[keyof typeof verstossConfig],
                ][]
              ).map(([art, cfg]) => {
                const count = verstossStats.find((v) => v.verstossArt === art)?._count.id ?? 0
                const Icon = cfg.Icon
                return (
                  <Link
                    key={art}
                    href={`/messstellen?verstossArt=${art}`}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 cursor-pointer ${
                      params.verstossArt === art
                        ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-400 hover:text-sky-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {VERSTOSS_LABELS[art]} ({count})
                  </Link>
                )
              })}
            </div>

            {/* List */}
            {messstellen.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 text-sm font-medium">Keine Messstellen gefunden.</p>
                <Link
                  href="/messstellen"
                  className="mt-3 inline-block text-xs text-sky-700 hover:text-sky-800 font-medium"
                >
                  Filter zurücksetzen
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {messstellen.map((m) => {
                  const cfg = verstossConfig[m.verstossArt as keyof typeof verstossConfig]
                  const Icon = cfg.Icon
                  const href = `/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`
                  return (
                    <article
                      key={m.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200 overflow-hidden flex"
                      itemScope
                      itemType="https://schema.org/Place"
                    >
                      {/* Left color stripe */}
                      <div className={`w-1.5 flex-shrink-0 ${cfg.stripe}`} />

                      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}
                            >
                              <Icon className="w-3 h-3" />
                              {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                            </span>
                            {m.autobahn && (
                              <span className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded-full font-mono font-bold tracking-wide">
                                {m.autobahn}
                              </span>
                            )}
                          </div>
                          <h2
                            className="font-semibold text-slate-900 leading-snug"
                            itemProp="name"
                          >
                            <Link
                              href={href}
                              className="hover:text-sky-700 transition-colors duration-200"
                              itemProp="url"
                            >
                              {m.titel}
                            </Link>
                          </h2>
                          <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {m.bundesland}
                            {m.ort && ` · ${m.ort}`}
                          </p>
                          {m.beschreibung && (
                            <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">
                              {m.beschreibung}
                            </p>
                          )}
                        </div>
                        <Link
                          href={href}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-sky-700 font-semibold hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3.5 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap cursor-pointer"
                        >
                          Details
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full sm:w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-700" />
                Bundesländer
              </h2>
              <ul className="space-y-0.5" role="list">
                {bundeslaenderStats.map((bl) => (
                  <li key={bl.bundesland}>
                    <Link
                      href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                      className="flex items-center justify-between py-2 px-2.5 rounded-xl text-xs hover:bg-sky-50 transition-colors duration-200 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px] font-bold w-5 text-center">
                          {BUNDESLAND_KUERZEL[bl.bundesland] || '--'}
                        </span>
                        <span className="text-slate-700 group-hover:text-sky-700 font-medium transition-colors duration-200">
                          {bl.bundesland}
                        </span>
                      </div>
                      <span className="bg-slate-100 group-hover:bg-sky-100 text-slate-600 group-hover:text-sky-700 font-semibold px-1.5 py-0.5 rounded-md text-[10px] transition-colors duration-200">
                        {bl._count.id}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
