import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { BUNDESLAND_KUERZEL } from '@/types'

export const metadata: Metadata = {
  title: 'Bußgeldbehörden',
  description: 'Alle zuständigen Bußgeldbehörden für Verkehrsverstöße in Deutschland, geordnet nach Bundesland.',
}

export const dynamic = 'force-dynamic'

export default async function BehoerdenPage() {
  const [behoerden, bundeslaenderStats] = await Promise.all([
    prisma.behoerde.findMany({
      orderBy: [{ bundesland: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { messstellen: true } } },
    }),
    prisma.behoerde.groupBy({
      by: ['bundesland'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ])

  // Group by Bundesland
  const grouped: Record<string, typeof behoerden> = {}
  for (const b of behoerden) {
    if (!grouped[b.bundesland]) grouped[b.bundesland] = []
    grouped[b.bundesland].push(b)
  }

  return (
    <div className="container-gov py-8">
      <Breadcrumb items={[{ label: 'Startseite', href: '/' }, { label: 'Bußgeldbehörden' }]} />

      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-2">
            Bußgeldbehörden Deutschland
          </h1>
          <p className="text-gray-600 mb-8">
            {behoerden.length} zuständige Behörde{behoerden.length !== 1 ? 'n' : ''} in Deutschland
          </p>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-300 rounded">
              <p className="text-gray-500 mb-2">Noch keine Behörden eingetragen.</p>
              <p className="text-xs text-gray-400">
                Behörden werden automatisch beim Anlegen von Messstellen im Admin-Bereich erfasst.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([land, behoerdenList]) => (
                  <section key={land} aria-labelledby={`behoerde-${land.replace(/\s/g, '-')}`}>
                    <h2
                      id={`behoerde-${land.replace(/\s/g, '-')}`}
                      className="gov-section-title flex items-center gap-2"
                    >
                      <span className="bg-[#003366] text-white text-xs font-bold px-2 py-0.5 rounded">
                        {BUNDESLAND_KUERZEL[land] || land.slice(0, 2)}
                      </span>
                      {land}
                      <span className="text-base font-normal text-gray-400">
                        ({behoerdenList.length})
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {behoerdenList.map((b) => (
                        <article key={b.id} className="gov-card p-4">
                          <h3 className="font-semibold text-[#003366] mb-1.5">{b.name}</h3>
                          {b.adresse && (
                            <address className="text-xs text-gray-600 not-italic mb-2">
                              {b.adresse}
                              {b.plz && (
                                <>
                                  <br />
                                  {b.plz} {b.stadt}
                                </>
                              )}
                            </address>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs mt-2">
                            {b.telefon && (
                              <a href={`tel:${b.telefon}`} className="text-[#003366] hover:underline">
                                📞 {b.telefon}
                              </a>
                            )}
                            {b.website && (
                              <a
                                href={b.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#003366] hover:underline"
                              >
                                🌐 Website
                              </a>
                            )}
                          </div>
                          {b._count.messstellen > 0 && (
                            <p className="text-xs text-gray-400 mt-2">
                              {b._count.messstellen} Messstelle{b._count.messstellen !== 1 ? 'n' : ''} zugeordnet
                            </p>
                          )}
                          {b.beschreibung && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                              {b.beschreibung}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full sm:w-56 flex-shrink-0">
          <div className="bg-[#f5f7fa] rounded border border-gray-200 p-4">
            <h2 className="text-sm font-bold text-[#003366] mb-3 uppercase tracking-wide">
              Nach Bundesland
            </h2>
            <ul className="space-y-0.5">
              {bundeslaenderStats.map((bl) => (
                <li key={bl.bundesland}>
                  <Link
                    href={`/bussgeldbehoerden/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                    className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-white transition-colors"
                  >
                    <span className="text-gray-700">{bl.bundesland}</span>
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
