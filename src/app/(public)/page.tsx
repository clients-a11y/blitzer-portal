import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'
import { formatDate } from '@/lib/utils'
import { Gauge, Ruler, TrafficCone, MapPin, Building2, ArrowRight, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Startseite',
  description:
    'Blitzer-Portal Deutschland: Informationen zu Messstellen, Geschwindigkeitskontrollen, Bußgeldern und zuständigen Behörden in allen Bundesländern.',
}

export const dynamic = 'force-dynamic'

async function getHomeData() {
  const [neueMessstellen, bundeslaenderStats, totalStats] = await Promise.all([
    prisma.messstelle.findMany({
      where: { istVeroeffentlicht: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        titel: true,
        verstossArt: true,
        bundesland: true,
        ort: true,
        autobahn: true,
        slug: true,
        createdAt: true,
        beschreibung: true,
      },
    }),
    prisma.messstelle.groupBy({
      by: ['bundesland'],
      where: { istVeroeffentlicht: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    Promise.all([
      prisma.messstelle.count({ where: { istVeroeffentlicht: true } }),
      prisma.behoerde.count(),
      prisma.messstelle.count({ where: { verstossArt: 'GESCHWINDIGKEIT', istVeroeffentlicht: true } }),
      prisma.messstelle.count({ where: { verstossArt: 'ABSTAND', istVeroeffentlicht: true } }),
      prisma.messstelle.count({ where: { verstossArt: 'ROTLICHT', istVeroeffentlicht: true } }),
    ]),
  ])

  return {
    neueMessstellen,
    bundeslaenderStats,
    totalMessstellen: totalStats[0],
    totalBehoerden: totalStats[1],
    geschwindigkeitCount: totalStats[2],
    abstandCount: totalStats[3],
    rotlichtCount: totalStats[4],
  }
}

export default async function HomePage() {
  const data = await getHomeData()

  const verstossColors: Record<string, string> = {
    GESCHWINDIGKEIT: 'badge-geschwindigkeit',
    ABSTAND: 'badge-abstand',
    ROTLICHT: 'badge-rotlicht',
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Blitzer-Portal Deutschland',
    description: 'Informationsportal zu Blitzer-Messstellen in Deutschland',
    url: process.env.NEXTAUTH_URL || 'https://blitzer-portal.de',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXTAUTH_URL || 'https://blitzer-portal.de'}/suche?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-14 md:py-20">
        <div className="container-gov">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-800/40 border border-blue-700/50 rounded-full px-4 py-1.5 text-xs font-medium text-blue-300 mb-5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
              Informationsportal zu Messstellen & Verkehrskontrollen
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight text-white">
              Blitzer-Portal<br />
              <span className="text-amber-400">Deutschland</span>
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
              Ihr umfassendes Informationsportal zu Blitzer-Messstellen in Deutschland.
              Detaillierte Informationen zu Geschwindigkeits-, Abstands- und Rotlichtverstößen,
              Bußgeldbehörden und Ihren Einspruchsmöglichkeiten.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/messstellen"
                className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-5 py-2.5 text-sm font-bold rounded-xl hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
              >
                Alle Messstellen
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/suche"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-2.5 text-sm font-medium rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Messstelle suchen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="border-b border-slate-200 bg-white py-6">
        <div className="container-gov">
          <h2 id="stats-heading" className="sr-only">Statistiken</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              value={data.totalMessstellen}
              label="Messstellen"
              icon={<MapPin className="w-5 h-5" />}
              iconColor="text-blue-600 bg-blue-50"
            />
            <StatCard
              value={data.bundeslaenderStats.length}
              label="Bundesländer"
              icon={<Building2 className="w-5 h-5" />}
              iconColor="text-indigo-600 bg-indigo-50"
            />
            <StatCard
              value={data.geschwindigkeitCount}
              label="Geschwindigkeit"
              icon={<Gauge className="w-5 h-5" />}
              iconColor="text-amber-600 bg-amber-50"
            />
            <StatCard
              value={data.abstandCount}
              label="Abstand"
              icon={<Ruler className="w-5 h-5" />}
              iconColor="text-sky-600 bg-sky-50"
            />
            <StatCard
              value={data.rotlichtCount}
              label="Rotlicht"
              icon={<TrafficCone className="w-5 h-5" />}
              iconColor="text-red-600 bg-red-50"
            />
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container-gov py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Neue Messstellen */}
          <div className="lg:col-span-2 space-y-8">
            <section aria-labelledby="neue-heading">
              <h2 id="neue-heading" className="gov-section-title">
                Neu eingetragene Messstellen
              </h2>
              {data.neueMessstellen.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  Noch keine Messstellen eingetragen.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.neueMessstellen.map((m) => (
                    <article key={m.id} className="gov-card p-4 group">
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${verstossColors[m.verstossArt]}`}
                        >
                          {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                        </span>
                        <time
                          dateTime={new Date(m.createdAt).toISOString()}
                          className="text-xs text-slate-400 flex-shrink-0"
                        >
                          {formatDate(m.createdAt)}
                        </time>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-900 mb-1 leading-snug">
                        <Link
                          href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                          className="hover:text-blue-700 transition-colors"
                        >
                          {m.titel}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {m.bundesland}
                        {m.autobahn && ` · ${m.autobahn}`}
                      </p>
                      {m.beschreibung && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {m.beschreibung}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
              {data.neueMessstellen.length > 0 && (
                <div className="mt-4 text-right">
                  <Link
                    href="/messstellen"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-semibold hover:text-blue-800 transition-colors"
                  >
                    Alle Messstellen anzeigen
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside aria-label="Bundesländer-Navigation" className="space-y-6">
            {/* Bundesländer */}
            <section aria-labelledby="bundeslaender-heading">
              <h2 id="bundeslaender-heading" className="gov-section-title">
                Nach Bundesland
              </h2>
              <nav aria-label="Bundesländer">
                <ul className="space-y-0.5" role="list">
                  {data.bundeslaenderStats.map((bl) => (
                    <li key={bl.bundesland}>
                      <Link
                        href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-6 bg-blue-700 text-white text-xs font-bold flex items-center justify-center rounded-md">
                            {BUNDESLAND_KUERZEL[bl.bundesland] || bl.bundesland.slice(0, 2)}
                          </span>
                          <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium transition-colors">
                            {bl.bundesland}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 px-2 py-0.5 rounded-full transition-colors">
                          {bl._count.id}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {data.bundeslaenderStats.length === 0 && (
                    <li className="text-sm text-slate-400 px-3 py-6 text-center">
                      Noch keine Daten verfügbar.
                    </li>
                  )}
                </ul>
              </nav>
            </section>

            {/* CTA box */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-2xl p-5 shadow-lg shadow-blue-900/20">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-amber-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1 text-sm">Geblitzt worden?</h3>
                  <p className="text-xs text-blue-200 leading-relaxed">
                    Finden Sie die zuständige Bußgeldbehörde und informieren Sie sich
                    über Ihre Einspruchsmöglichkeiten.
                  </p>
                </div>
              </div>
              <Link
                href="/bussgeldbehoerden"
                className="flex items-center justify-center gap-2 bg-amber-400 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-amber-300 transition-colors"
              >
                Bußgeldbehörden
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function StatCard({
  value,
  label,
  icon,
  iconColor,
}: {
  value: number
  label: string
  icon: React.ReactNode
  iconColor: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-extrabold text-slate-900 leading-none">
          {value.toLocaleString('de-DE')}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  )
}
