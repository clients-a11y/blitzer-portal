import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Startseite',
  description:
    'Blitzer-Portal Deutschland: Informationen zu Messstellen, Geschwindigkeitskontrollen, Bußgeldern und zuständigen Behörden in allen Bundesländern.',
}

export const dynamic = 'force-dynamic'

async function getHomeData() {
  const [
    neueMessstellen,
    bundeslaenderStats,
    totalStats,
  ] = await Promise.all([
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

      {/* Hero / Intro Banner */}
      <section className="bg-[#003366] text-white py-10 md:py-14">
        <div className="container-gov">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              Blitzer-Portal Deutschland
            </h1>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
              Ihr umfassendes Informationsportal zu Blitzer-Messstellen in Deutschland.
              Detaillierte Informationen zu Geschwindigkeits-, Abstands- und Rotlichtverstößen,
              Bußgeldbehörden und Ihren Einspruchsmöglichkeiten.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/messstellen"
                className="bg-[#f0b429] text-[#1a1a2e] px-5 py-2.5 text-sm font-semibold rounded hover:bg-[#d4a017] transition-colors"
              >
                Alle Messstellen
              </Link>
              <Link
                href="/suche"
                className="bg-white/10 border border-white/30 text-white px-5 py-2.5 text-sm font-medium rounded hover:bg-white/20 transition-colors"
              >
                Messstelle suchen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Box */}
      <section aria-labelledby="stats-heading" className="bg-[#f5f7fa] border-b border-gray-200 py-8">
        <div className="container-gov">
          <h2 id="stats-heading" className="sr-only">Statistiken</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              value={data.totalMessstellen}
              label="Messstellen"
              color="text-[#003366]"
            />
            <StatCard
              value={data.bundeslaenderStats.length}
              label="Bundesländer"
              color="text-[#004080]"
            />
            <StatCard
              value={data.geschwindigkeitCount}
              label="Geschwindigkeit"
              color="text-amber-700"
            />
            <StatCard
              value={data.abstandCount}
              label="Abstand"
              color="text-blue-700"
            />
            <StatCard
              value={data.rotlichtCount}
              label="Rotlicht"
              color="text-red-700"
            />
          </div>
        </div>
      </section>

      <div className="container-gov py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Neue Messstellen */}
            <section aria-labelledby="neue-heading">
              <h2 id="neue-heading" className="gov-section-title">
                Neu eingetragene Messstellen
              </h2>
              {data.neueMessstellen.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center border border-dashed border-gray-300 rounded">
                  Noch keine Messstellen eingetragen.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.neueMessstellen.map((m) => (
                    <article key={m.id} className="gov-card p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${verstossColors[m.verstossArt]}`}
                        >
                          {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                        </span>
                        <time
                          dateTime={new Date(m.createdAt).toISOString()}
                          className="text-xs text-gray-400 flex-shrink-0"
                        >
                          {formatDate(m.createdAt)}
                        </time>
                      </div>
                      <h3 className="font-semibold text-sm text-[#003366] mb-1 leading-snug">
                        <Link
                          href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                          className="hover:underline"
                        >
                          {m.titel}
                        </Link>
                      </h3>
                      <p className="text-xs text-gray-500">
                        {m.bundesland}
                        {m.autobahn && ` · ${m.autobahn}`}
                      </p>
                      {m.beschreibung && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
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
                    className="text-sm text-[#003366] font-medium hover:underline"
                  >
                    Alle Messstellen anzeigen →
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Bundesländer */}
          <aside aria-label="Bundesländer-Navigation">
            <section aria-labelledby="bundeslaender-heading">
              <h2 id="bundeslaender-heading" className="gov-section-title">
                Nach Bundesland
              </h2>
              <nav aria-label="Bundesländer">
                <ul className="space-y-1" role="list">
                  {data.bundeslaenderStats.map((bl) => (
                    <li key={bl.bundesland}>
                      <Link
                        href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded border border-transparent hover:border-[#003366] hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-5 bg-[#003366] text-white text-xs font-bold flex items-center justify-center rounded-sm">
                            {BUNDESLAND_KUERZEL[bl.bundesland] || bl.bundesland.slice(0, 2)}
                          </span>
                          <span className="text-sm text-gray-700 group-hover:text-[#003366] font-medium">
                            {bl.bundesland}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                          {bl._count.id}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {data.bundeslaenderStats.length === 0 && (
                    <li className="text-sm text-gray-400 px-3 py-4 text-center">
                      Noch keine Daten verfügbar.
                    </li>
                  )}
                </ul>
              </nav>
            </section>

            {/* Quick info box */}
            <div className="mt-8 bg-[#003366] text-white rounded p-5">
              <h3 className="font-semibold mb-2 text-sm">Geblitzt worden?</h3>
              <p className="text-xs text-blue-200 leading-relaxed mb-3">
                Finden Sie die zuständige Bußgeldbehörde und informieren Sie sich über
                Ihre Einspruchsmöglichkeiten.
              </p>
              <Link
                href="/bussgeldbehoerden"
                className="block text-center bg-[#f0b429] text-[#1a1a2e] text-xs font-semibold px-4 py-2 rounded hover:bg-[#d4a017] transition-colors"
              >
                Bußgeldbehörden
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-4 text-center">
      <div className={`text-2xl md:text-3xl font-bold ${color}`}>{value.toLocaleString('de-DE')}</div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
    </div>
  )
}
