import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'
import { Gauge, Maximize2, CircleX, MapPin, Building2, ArrowRight, Search } from 'lucide-react'

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
      take: 8,
      select: {
        id: true,
        titel: true,
        verstossArt: true,
        bundesland: true,
        ort: true,
        autobahn: true,
        slug: true,
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

const verstossConfig = {
  GESCHWINDIGKEIT: {
    Icon: Gauge,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    href: '/messstellen?verstossArt=GESCHWINDIGKEIT',
    sub: 'Radar, Blitzer, Section Control',
  },
  ABSTAND: {
    Icon: Maximize2,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    href: '/messstellen?verstossArt=ABSTAND',
    sub: 'Seitenradar, Videobrücken',
  },
  ROTLICHT: {
    Icon: CircleX,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    badge: 'bg-red-50 text-red-600 border border-red-200',
    href: '/messstellen?verstossArt=ROTLICHT',
    sub: 'Ampelüberwachung, Kameras',
  },
} as const

export default async function HomePage() {
  const data = await getHomeData()

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

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-gov py-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Blitzer-Messstellen Verzeichnis
          </h1>
          <p className="text-slate-500 text-sm mt-1 mb-5">
            Messstellen, Bußgeldbehörden und Einspruchsmöglichkeiten in Deutschland
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600 mb-6">
            <span>
              <strong className="text-slate-900 font-bold">{data.totalMessstellen.toLocaleString('de-DE')}</strong>
              {' '}Messstellen
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900 font-bold">{data.bundeslaenderStats.length}</strong>
              {' '}Bundesländer
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900 font-bold">{data.totalBehoerden.toLocaleString('de-DE')}</strong>
              {' '}Behörden
            </span>
          </div>

          {/* Search bar — links to /suche */}
          <Link
            href="/suche"
            aria-label="Zur Suche"
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-white rounded-xl px-4 py-3 max-w-lg transition-all duration-200 group cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-indigo-500 transition-colors duration-200" />
            <span className="text-slate-400 text-sm flex-1 group-hover:text-slate-500 transition-colors duration-200 select-none">
              Autobahn, Ort, Bundesland oder Messstelle&nbsp;…
            </span>
            <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">
              Suchen
            </span>
          </Link>
        </div>
      </div>

      {/* ── DIRECTORY BODY ──────────────────────────────────────────── */}
      <div className="bg-slate-50 min-h-screen">
        <div className="container-gov py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── LEFT COLUMN: browse panels ─────────────────────────── */}
            <div className="space-y-5">

              {/* Category panel */}
              <nav aria-labelledby="kategorien-heading">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 id="kategorien-heading" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Nach Verstoßart
                    </h2>
                    <Link
                      href="/messstellen"
                      className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                    >
                      Alle →
                    </Link>
                  </div>
                  <ul role="list" className="divide-y divide-slate-100">
                    {(Object.entries(verstossConfig) as [keyof typeof verstossConfig, typeof verstossConfig[keyof typeof verstossConfig]][]).map(
                      ([art, cfg]) => {
                        const count =
                          art === 'GESCHWINDIGKEIT'
                            ? data.geschwindigkeitCount
                            : art === 'ABSTAND'
                              ? data.abstandCount
                              : data.rotlichtCount
                        const Icon = cfg.Icon
                        return (
                          <li key={art}>
                            <Link
                              href={cfg.href}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                            >
                              <span className={`w-8 h-8 ${cfg.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors duration-150">
                                  {VERSTOSS_LABELS[art]}
                                </div>
                                <div className="text-xs text-slate-400">{cfg.sub}</div>
                              </div>
                              <span className="text-sm font-bold text-slate-700 tabular-nums flex-shrink-0">
                                {count.toLocaleString('de-DE')}
                              </span>
                            </Link>
                          </li>
                        )
                      },
                    )}
                  </ul>
                </div>
              </nav>

              {/* Bundesland panel */}
              {data.bundeslaenderStats.length > 0 && (
                <nav aria-labelledby="bundeslaender-heading">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h2 id="bundeslaender-heading" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Nach Bundesland
                      </h2>
                    </div>
                    <ul role="list" className="divide-y divide-slate-100">
                      {data.bundeslaenderStats.map((bl) => (
                        <li key={bl.bundesland}>
                          <Link
                            href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                          >
                            <span className="w-8 h-5 bg-slate-800 text-white text-[9px] font-black flex items-center justify-center rounded flex-shrink-0 group-hover:bg-indigo-600 transition-colors duration-150">
                              {BUNDESLAND_KUERZEL[bl.bundesland] || bl.bundesland.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="flex-1 text-sm text-slate-700 group-hover:text-indigo-700 transition-colors duration-150 truncate">
                              {bl.bundesland}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 tabular-nums flex-shrink-0">
                              {bl._count.id}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-3 border-t border-slate-100">
                      <Link
                        href="/bussgeldbehoerden"
                        className="flex items-center gap-2 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        Bußgeldbehörden anzeigen
                        <ArrowRight className="w-3 h-3 ml-auto" />
                      </Link>
                    </div>
                  </div>
                </nav>
              )}
            </div>

            {/* ── RIGHT COLUMN: recent entries ───────────────────────── */}
            <div className="lg:col-span-2">
              {data.neueMessstellen.length > 0 ? (
                <section aria-labelledby="recent-heading">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h2 id="recent-heading" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Zuletzt eingetragen
                      </h2>
                      <Link
                        href="/messstellen"
                        className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                      >
                        Alle anzeigen →
                      </Link>
                    </div>

                    <ul role="list" className="divide-y divide-slate-100">
                      {data.neueMessstellen.map((m) => {
                        const cfg = verstossConfig[m.verstossArt as keyof typeof verstossConfig]
                        const Icon = cfg.Icon
                        const href = `/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`
                        return (
                          <li key={m.id}>
                            <Link
                              href={href}
                              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors duration-150 group cursor-pointer"
                              itemScope
                              itemType="https://schema.org/Place"
                            >
                              {/* Type icon */}
                              <span className={`w-8 h-8 ${cfg.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                              </span>

                              {/* Title + location */}
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors duration-150 truncate"
                                  itemProp="name"
                                >
                                  {m.titel}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    {m.bundesland}{m.ort && ` · ${m.ort}`}
                                  </span>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {m.autobahn && (
                                  <span className="text-[11px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                                    {m.autobahn}
                                  </span>
                                )}
                                <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                                  <Icon className="w-2.5 h-2.5" />
                                  {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                                </span>
                              </div>

                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors duration-150 flex-shrink-0" />
                            </Link>
                          </li>
                        )
                      })}
                    </ul>

                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                      <Link
                        href="/messstellen"
                        className="flex items-center justify-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                      >
                        Alle {data.totalMessstellen} Messstellen anzeigen
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </section>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Noch keine Messstellen eingetragen.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
