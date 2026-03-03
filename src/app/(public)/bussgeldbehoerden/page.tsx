import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { BUNDESLAND_KUERZEL } from '@/types'
import { Building2, Phone, Globe, MapPin, ArrowRight, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bußgeldbehörden',
  description:
    'Alle zuständigen Bußgeldbehörden für Verkehrsverstöße in Deutschland, geordnet nach Bundesland.',
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

  const grouped: Record<string, typeof behoerden> = {}
  for (const b of behoerden) {
    if (!grouped[b.bundesland]) grouped[b.bundesland] = []
    grouped[b.bundesland].push(b)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-gov py-6">
          <Breadcrumb items={[{ label: 'Startseite', href: '/' }, { label: 'Bußgeldbehörden' }]} />
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Bußgeldbehörden Deutschland
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {behoerden.length} zuständige Behörde{behoerden.length !== 1 ? 'n' : ''} in Deutschland
          </p>
        </div>
      </div>

      <div className="container-gov py-8">
        {/* Bundesland filter pills */}
        {bundeslaenderStats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {bundeslaenderStats.map((bl) => (
              <Link
                key={bl.bundesland}
                href={`/bussgeldbehoerden/${encodeURIComponent(bl.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
              >
                <span className="text-[10px] font-black text-slate-400 font-mono">
                  {BUNDESLAND_KUERZEL[bl.bundesland] || bl.bundesland.slice(0, 2)}
                </span>
                {bl.bundesland}
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {bl._count.id}
                </span>
              </Link>
            ))}
          </div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">Noch keine Behörden eingetragen.</p>
            <p className="text-xs text-slate-400 mt-1">
              Behörden werden beim Anlegen von Messstellen im Admin-Bereich erfasst.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([land, behoerdenList]) => (
                <section key={land} aria-labelledby={`behoerde-${land.replace(/\s/g, '-')}`}>
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-7 bg-indigo-600 text-white text-xs font-black flex items-center justify-center rounded-lg">
                        {BUNDESLAND_KUERZEL[land] || land.slice(0, 2)}
                      </span>
                      <h2
                        id={`behoerde-${land.replace(/\s/g, '-')}`}
                        className="text-base font-black text-slate-900 tracking-tight"
                      >
                        {land}
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        ({behoerdenList.length})
                      </span>
                    </div>
                    <Link
                      href={`/bussgeldbehoerden/${encodeURIComponent(land.toLowerCase().replace(/\s/g, '-'))}`}
                      className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                    >
                      Alle <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {behoerdenList.map((b) => (
                      <article
                        key={b.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        <h3 className="font-bold text-slate-900 text-sm mb-2">{b.name}</h3>
                        {b.adresse && (
                          <address className="text-xs text-slate-500 not-italic mb-3 flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>
                              {b.adresse}
                              {b.plz && (
                                <><br />{b.plz} {b.stadt}</>
                              )}
                            </span>
                          </address>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {b.telefon && (
                            <a
                              href={`tel:${b.telefon}`}
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                            >
                              <Phone className="w-3 h-3" />
                              {b.telefon}
                            </a>
                          )}
                          {b.email && (
                            <a
                              href={`mailto:${b.email}`}
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                            >
                              <Mail className="w-3 h-3" />
                              {b.email}
                            </a>
                          )}
                          {b.website && (
                            <a
                              href={b.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                            >
                              <Globe className="w-3 h-3" />
                              Website
                            </a>
                          )}
                        </div>
                        {b._count.messstellen > 0 && (
                          <p className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
                            {b._count.messstellen} Messstelle{b._count.messstellen !== 1 ? 'n' : ''} zugeordnet
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
    </div>
  )
}
