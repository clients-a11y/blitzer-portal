import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'
import { MapPin, ArrowRight } from 'lucide-react'

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

export default async function MessstellenPage({ searchParams }: Props) {
  const params = await searchParams
  const { messstellen, bundeslaenderStats, verstossStats } = await getMessstellen(
    params.verstossArt,
    params.bundesland,
  )

  const verstossColors: Record<string, string> = {
    GESCHWINDIGKEIT: 'badge-geschwindigkeit',
    ABSTAND: 'badge-abstand',
    ROTLICHT: 'badge-rotlicht',
  }

  return (
    <div className="container-gov py-8">
      <Breadcrumb items={[{ label: 'Startseite', href: '/' }, { label: 'Messstellen' }]} />

      <div className="flex flex-col sm:flex-row sm:items-start gap-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">
            Blitzer-Messstellen Deutschland
          </h1>
          <p className="text-slate-500 mb-6">
            {messstellen.length} Messstelle{messstellen.length !== 1 ? 'n' : ''} gefunden
            {params.bundesland && ` in ${params.bundesland}`}
            {params.verstossArt &&
              ` · ${VERSTOSS_LABELS[params.verstossArt as keyof typeof VERSTOSS_LABELS]}`}
          </p>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/messstellen"
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                !params.verstossArt
                  ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              Alle
            </Link>
            {(['GESCHWINDIGKEIT', 'ABSTAND', 'ROTLICHT'] as const).map((art) => {
              const count = verstossStats.find((v) => v.verstossArt === art)?._count.id || 0
              return (
                <Link
                  key={art}
                  href={`/messstellen?verstossArt=${art}`}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    params.verstossArt === art
                      ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {VERSTOSS_LABELS[art]} ({count})
                </Link>
              )
            })}
          </div>

          {/* List */}
          {messstellen.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500 text-sm">Keine Messstellen gefunden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messstellen.map((m) => (
                <article
                  key={m.id}
                  className="gov-card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  itemScope
                  itemType="https://schema.org/Place"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${verstossColors[m.verstossArt]}`}
                      >
                        {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                      </span>
                      {m.autobahn && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-mono font-medium">
                          {m.autobahn}
                        </span>
                      )}
                    </div>
                    <h2 className="font-semibold text-slate-900 leading-snug" itemProp="name">
                      <Link
                        href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                        className="hover:text-blue-700 transition-colors"
                        itemProp="url"
                      >
                        {m.titel}
                      </Link>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {m.bundesland} · {m.ort}
                    </p>
                    {m.beschreibung && (
                      <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{m.beschreibung}</p>
                    )}
                  </div>
                  <Link
                    href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-blue-700 font-semibold hover:text-blue-800 transition-colors whitespace-nowrap"
                  >
                    Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full sm:w-56 flex-shrink-0">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Bundesländer</h2>
            <ul className="space-y-0.5" role="list">
              {bundeslaenderStats.map((bl) => (
                <li key={bl.bundesland}>
                  <Link
                    href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl text-xs hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[10px] font-medium">
                        {BUNDESLAND_KUERZEL[bl.bundesland] || '--'}
                      </span>
                      <span className="text-slate-700 group-hover:text-blue-700 font-medium transition-colors">
                        {bl.bundesland}
                      </span>
                    </div>
                    <span className="text-slate-400 font-medium">{bl._count.id}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
