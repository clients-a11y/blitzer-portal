import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS } from '@/types'
import { MapPin, ArrowRight, Gauge, Maximize2, CircleX } from 'lucide-react'

interface Props {
  params: Promise<{ bundesland: string }>
}

function decodeBundesland(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace('Baden Württemberg', 'Baden-Württemberg')
    .replace('Nordrhein Westfalen', 'Nordrhein-Westfalen')
    .replace('Rheinland Pfalz', 'Rheinland-Pfalz')
    .replace('Sachsen Anhalt', 'Sachsen-Anhalt')
    .replace('Mecklenburg Vorpommern', 'Mecklenburg-Vorpommern')
    .replace('Schleswig Holstein', 'Schleswig-Holstein')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bundesland } = await params
  const name = decodeBundesland(bundesland)
  return {
    title: `Blitzer in ${name}`,
    description: `Alle Blitzer-Messstellen in ${name}. Informationen zu Geschwindigkeits-, Abstands- und Rotlichtverstößen.`,
  }
}

const verstossConfig = {
  GESCHWINDIGKEIT: {
    Icon: Gauge,
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  ABSTAND: {
    Icon: Maximize2,
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
  ROTLICHT: {
    Icon: CircleX,
    badge: 'bg-red-50 text-red-600 border border-red-200',
  },
} as const

export default async function BundeslandPage({ params }: Props) {
  const { bundesland } = await params
  const bundeslandName = decodeBundesland(bundesland)

  const messstellen = await prisma.messstelle.findMany({
    where: {
      bundesland: { contains: bundeslandName, mode: 'insensitive' },
      istVeroeffentlicht: true,
    },
    orderBy: [{ autobahn: 'asc' }, { titel: 'asc' }],
    include: { behoerde: { select: { name: true, slug: true } } },
  })

  if (messstellen.length === 0) notFound()

  // Stats by type
  const typeCounts: Record<string, number> = {}
  for (const m of messstellen) {
    typeCounts[m.verstossArt] = (typeCounts[m.verstossArt] ?? 0) + 1
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero strip */}
      <div className="bg-slate-950">
        <div className="container-gov pt-8 pb-8">
          <Breadcrumb
            items={[
              { label: 'Startseite', href: '/' },
              { label: 'Messstellen', href: '/messstellen' },
              { label: bundeslandName },
            ]}
            dark
          />
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
            Blitzer-Messstellen
            <span className="text-indigo-400 ml-2">{bundeslandName}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {messstellen.length} Messstelle{messstellen.length !== 1 ? 'n' : ''} gefunden
          </p>

          {/* Type stats */}
          <div className="flex flex-wrap gap-3 mt-5">
            {(Object.entries(verstossConfig) as [keyof typeof verstossConfig, typeof verstossConfig[keyof typeof verstossConfig]][]).map(
              ([art, cfg]) => {
                const count = typeCounts[art] ?? 0
                if (count === 0) return null
                const Icon = cfg.Icon
                return (
                  <span
                    key={art}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-white/10 text-white border border-white/10"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {VERSTOSS_LABELS[art]}: {count}
                  </span>
                )
              },
            )}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="container-gov py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {messstellen.map((m) => {
            const cfg = verstossConfig[m.verstossArt as keyof typeof verstossConfig]
            const Icon = cfg.Icon
            const href = `/messstellen/${bundesland}/${m.slug}`
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

                {m.ort && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {m.ort}
                  </p>
                )}

                {m.beschreibung && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {m.beschreibung}
                  </p>
                )}

                {m.behoerde && (
                  <p className="text-xs text-slate-400 mb-3">
                    Behörde: {m.behoerde.name}
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
      </div>
    </div>
  )
}
