import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS } from '@/types'

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
  const bundeslandName = decodeBundesland(bundesland)
  return {
    title: `Blitzer in ${bundeslandName}`,
    description: `Alle Blitzer-Messstellen in ${bundeslandName}. Informationen zu Geschwindigkeits-, Abstands- und Rotlichtverstößen.`,
  }
}

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

  if (messstellen.length === 0) {
    notFound()
  }

  const verstossColors: Record<string, string> = {
    GESCHWINDIGKEIT: 'badge-geschwindigkeit',
    ABSTAND: 'badge-abstand',
    ROTLICHT: 'badge-rotlicht',
  }

  // Group by Autobahn
  const grouped: Record<string, typeof messstellen> = {}
  for (const m of messstellen) {
    const key = m.autobahn || 'Sonstige Straßen'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(m)
  }

  return (
    <div className="container-gov py-8">
      <Breadcrumb
        items={[
          { label: 'Startseite', href: '/' },
          { label: 'Messstellen', href: '/messstellen' },
          { label: bundeslandName },
        ]}
      />

      <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-2">
        Blitzer-Messstellen {bundeslandName}
      </h1>
      <p className="text-gray-600 mb-8">
        {messstellen.length} Messstelle{messstellen.length !== 1 ? 'n' : ''} in {bundeslandName}
      </p>

      <div className="space-y-10">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([autobahn, stellen]) => (
            <section key={autobahn} aria-labelledby={`autobahn-${autobahn}`}>
              <h2
                id={`autobahn-${autobahn}`}
                className="gov-section-title flex items-center gap-2"
              >
                {autobahn !== 'Sonstige Straßen' && (
                  <span className="bg-[#003366] text-white text-sm font-bold px-2 py-0.5 rounded">
                    {autobahn}
                  </span>
                )}
                {autobahn}
                <span className="text-base font-normal text-gray-400">
                  ({stellen.length})
                </span>
              </h2>
              <div className="space-y-3">
                {stellen.map((m) => (
                  <article key={m.id} className="gov-card p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${verstossColors[m.verstossArt]}`}
                          >
                            {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                          </span>
                        </div>
                        <h3 className="font-semibold text-[#003366]">
                          <Link
                            href={`/messstellen/${bundesland}/${m.slug}`}
                            className="hover:underline"
                          >
                            {m.titel}
                          </Link>
                        </h3>
                        {m.beschreibung && (
                          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                            {m.beschreibung}
                          </p>
                        )}
                        {m.behoerde && (
                          <p className="text-xs text-gray-400 mt-1.5">
                            Behörde: {m.behoerde.name}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/messstellen/${bundesland}/${m.slug}`}
                        className="flex-shrink-0 bg-[#003366] text-white text-xs px-3 py-1.5 rounded hover:bg-[#002244] transition-colors whitespace-nowrap self-start"
                      >
                        Mehr Details
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
