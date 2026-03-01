import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'

export const metadata: Metadata = {
  title: 'Alle Messstellen',
  description:
    'Übersicht aller Blitzer-Messstellen in Deutschland, sortiert nach Bundesland und Verstoßart.',
}

export const revalidate = 300

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

      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-2">
            Blitzer-Messstellen Deutschland
          </h1>
          <p className="text-gray-600 mb-6">
            {messstellen.length} Messstelle{messstellen.length !== 1 ? 'n' : ''} gefunden
            {params.bundesland && ` in ${params.bundesland}`}
            {params.verstossArt &&
              ` (${VERSTOSS_LABELS[params.verstossArt as keyof typeof VERSTOSS_LABELS]})`}
          </p>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/messstellen"
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                !params.verstossArt
                  ? 'bg-[#003366] text-white border-[#003366]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#003366]'
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
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    params.verstossArt === art
                      ? 'bg-[#003366] text-white border-[#003366]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#003366]'
                  }`}
                >
                  {VERSTOSS_LABELS[art]} ({count})
                </Link>
              )
            })}
          </div>

          {/* Messstellen list */}
          {messstellen.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-300 rounded">
              <p className="text-gray-500">Keine Messstellen gefunden.</p>
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
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${verstossColors[m.verstossArt]}`}
                      >
                        {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                      </span>
                      {m.autobahn && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {m.autobahn}
                        </span>
                      )}
                    </div>
                    <h2 className="font-semibold text-[#003366] leading-snug" itemProp="name">
                      <Link
                        href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                        className="hover:underline"
                        itemProp="url"
                      >
                        {m.titel}
                      </Link>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.bundesland} · {m.ort}
                    </p>
                    {m.beschreibung && (
                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{m.beschreibung}</p>
                    )}
                  </div>
                  <Link
                    href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                    className="flex-shrink-0 text-xs text-[#003366] font-medium hover:underline whitespace-nowrap"
                  >
                    Details →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Bundesländer */}
        <aside className="w-full sm:w-56 flex-shrink-0">
          <div className="bg-[#f5f7fa] rounded border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-[#003366] mb-3 uppercase tracking-wide">
              Bundesländer
            </h2>
            <ul className="space-y-0.5" role="list">
              {bundeslaenderStats.map((bl) => (
                <li key={bl.bundesland}>
                  <Link
                    href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 font-mono text-[10px]">
                        {BUNDESLAND_KUERZEL[bl.bundesland] || '--'}
                      </span>
                      <span className="text-gray-700 group-hover:text-[#003366]">
                        {bl.bundesland}
                      </span>
                    </div>
                    <span className="text-gray-400">{bl._count.id}</span>
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
