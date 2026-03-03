import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VERSTOSS_LABELS, BUNDESLAND_KUERZEL } from '@/types'
import { Gauge, Maximize2, CircleX, MapPin, Building2, ArrowRight, Zap, Shield, Search } from 'lucide-react'

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
      take: 6,
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
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    cardBorder: 'border-amber-200 hover:border-amber-300',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    href: '/messstellen?verstossArt=GESCHWINDIGKEIT',
  },
  ABSTAND: {
    Icon: Maximize2,
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    cardBorder: 'border-sky-200 hover:border-sky-300',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    href: '/messstellen?verstossArt=ABSTAND',
  },
  ROTLICHT: {
    Icon: CircleX,
    badge: 'bg-red-50 text-red-600 border border-red-200',
    cardBorder: 'border-red-200 hover:border-red-300',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    href: '/messstellen?verstossArt=ROTLICHT',
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

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl translate-y-1/2" />
        </div>

        <div className="relative container-gov pt-16 pb-14 md:pt-20 md:pb-18">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {data.totalMessstellen} Messstellen in {data.bundeslaenderStats.length} Bundesländern
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-[1.1]">
            Alle Blitzer-<br />
            <span className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
              Messstellen Deutschlands
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
            Ihr umfassendes Informationsportal zu Geschwindigkeits-, Abstands- und Rotlichtverstößen,
            Bußgeldbehörden und Einspruchsmöglichkeiten.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              href="/messstellen"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 text-sm font-semibold rounded-xl transition-colors duration-200 shadow-lg shadow-indigo-900/40 cursor-pointer"
            >
              Alle Messstellen
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/suche"
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 text-sm font-medium rounded-xl transition-colors duration-200 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Suchen
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: data.totalMessstellen, label: 'Messstellen', color: 'text-indigo-400' },
              { value: data.bundeslaenderStats.length, label: 'Bundesländer', color: 'text-indigo-400' },
              { value: data.totalBehoerden, label: 'Behörden', color: 'text-indigo-400' },
              { value: data.geschwindigkeitCount + data.abstandCount + data.rotlichtCount, label: 'Verstöße erfasst', color: 'text-indigo-400' },
            ].map(({ value, label, color }) => (
              <div
                key={label}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div className={`text-2xl font-black leading-none ${color}`}>
                  {value.toLocaleString('de-DE')}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIOLATION TYPE CARDS ────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100" aria-labelledby="kategorien-heading">
        <div className="container-gov py-12">
          <div className="mb-8">
            <h2 id="kategorien-heading" className="text-xl font-black text-slate-900 tracking-tight">
              Kategorien
            </h2>
            <p className="text-slate-500 text-sm mt-1">Messstellen nach Verstoßart</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Link
                    key={art}
                    href={cfg.href}
                    className={`group bg-white border ${cfg.cardBorder} rounded-2xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer`}
                  >
                    <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1 leading-none">
                      {count.toLocaleString('de-DE')}
                    </div>
                    <div className="font-semibold text-slate-800 text-sm mb-1">
                      {VERSTOSS_LABELS[art]}
                    </div>
                    <div className="text-xs text-slate-500 mb-4">
                      {art === 'GESCHWINDIGKEIT' && 'Radar, Blitzer, Section Control'}
                      {art === 'ABSTAND' && 'Seitenradar, Videobrücken'}
                      {art === 'ROTLICHT' && 'Ampelüberwachung, Kameras'}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold group-hover:gap-2 transition-all duration-200">
                      Anzeigen <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                )
              },
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-b border-slate-100" aria-labelledby="how-heading">
        <div className="container-gov py-12">
          <div className="mb-8">
            <h2 id="how-heading" className="text-xl font-black text-slate-900 tracking-tight">
              So funktioniert es
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Messstelle suchen',
                desc: 'Suchen Sie nach Autobahn, Ort oder Bundesland.',
              },
              {
                step: '02',
                icon: MapPin,
                title: 'Details einsehen',
                desc: 'Geräteinformationen, Standortbeschreibung und Bußgeldkatalog auf einen Blick.',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Informiert entscheiden',
                desc: 'Erfahren Sie mehr über Einspruchsmöglichkeiten und zuständige Behörden.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black">
                  {step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT MESSSTELLEN ──────────────────────────────────────── */}
      {data.neueMessstellen.length > 0 && (
        <section className="bg-white border-b border-slate-100" aria-labelledby="recent-heading">
          <div className="container-gov py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 id="recent-heading" className="text-xl font-black text-slate-900 tracking-tight">
                  Zuletzt eingetragen
                </h2>
                <p className="text-slate-500 text-sm mt-1">Neueste Messstellen im Verzeichnis</p>
              </div>
              <Link
                href="/messstellen"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
              >
                Alle anzeigen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.neueMessstellen.map((m) => {
                const cfg = verstossConfig[m.verstossArt as keyof typeof verstossConfig]
                const Icon = cfg.Icon
                const href = `/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`
                return (
                  <article
                    key={m.id}
                    className="group bg-white border border-slate-200 hover:border-indigo-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 flex flex-col"
                    itemScope
                    itemType="https://schema.org/Place"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}>
                        <Icon className="w-3 h-3" />
                        {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                      </span>
                      {m.autobahn && (
                        <span className="text-xs bg-slate-800 text-white px-2 py-1 rounded-lg font-mono font-bold">
                          {m.autobahn}
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-bold text-slate-900 text-sm leading-snug mb-1 flex-1"
                      itemProp="name"
                    >
                      <Link
                        href={href}
                        className="hover:text-indigo-700 transition-colors duration-200 cursor-pointer"
                        itemProp="url"
                      >
                        {m.titel}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {m.bundesland}{m.ort && ` · ${m.ort}`}
                    </p>
                    {m.beschreibung && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {m.beschreibung}
                      </p>
                    )}
                    <Link
                      href={href}
                      className="mt-auto inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer group-hover:gap-1.5"
                    >
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </article>
                )
              })}
            </div>

            <div className="mt-6 sm:hidden">
              <Link
                href="/messstellen"
                className="flex items-center justify-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
              >
                Alle Messstellen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BUNDESLAND GRID ─────────────────────────────────────────── */}
      {data.bundeslaenderStats.length > 0 && (
        <section className="bg-slate-50" aria-labelledby="bundeslaender-heading">
          <div className="container-gov py-12">
            <div className="mb-8">
              <h2 id="bundeslaender-heading" className="text-xl font-black text-slate-900 tracking-tight">
                Nach Bundesland
              </h2>
              <p className="text-slate-500 text-sm mt-1">Messstellen nach Region</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {data.bundeslaenderStats.map((bl) => (
                <Link
                  key={bl.bundesland}
                  href={`/messstellen/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                  className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm rounded-xl px-3 py-3 flex items-center gap-2.5 transition-all duration-200 cursor-pointer"
                >
                  <span className="w-8 h-6 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-md flex-shrink-0 group-hover:bg-indigo-700 transition-colors duration-200">
                    {BUNDESLAND_KUERZEL[bl.bundesland] || bl.bundesland.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700 transition-colors duration-200">
                      {bl.bundesland}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">{bl._count.id} Stellen</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA strip */}
            <div className="mt-8 bg-indigo-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Geblitzt worden?</div>
                  <div className="text-indigo-200 text-xs">
                    Finden Sie die zuständige Bußgeldbehörde und Ihre Einspruchsmöglichkeiten.
                  </div>
                </div>
              </div>
              <Link
                href="/bussgeldbehoerden"
                className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white text-indigo-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors duration-200 cursor-pointer"
              >
                Bußgeldbehörden
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {data.totalMessstellen === 0 && (
        <section className="container-gov py-24 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Noch keine Daten</h2>
          <p className="text-slate-500 text-sm">Noch keine Messstellen eingetragen.</p>
        </section>
      )}
    </>
  )
}
