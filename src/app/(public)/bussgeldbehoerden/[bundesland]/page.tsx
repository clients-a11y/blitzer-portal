import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS } from '@/types'
import { Phone, Mail, Globe, MapPin, ArrowRight, Building2, ExternalLink } from 'lucide-react'

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
    title: `Bußgeldbehörden ${name}`,
    description: `Alle zuständigen Bußgeldbehörden für Verkehrsverstöße in ${name}.`,
  }
}

const verstossTypeBadge: Record<string, string> = {
  GESCHWINDIGKEIT: 'bg-amber-50 text-amber-700 border border-amber-200',
  ABSTAND: 'bg-sky-50 text-sky-700 border border-sky-200',
  ROTLICHT: 'bg-red-50 text-red-600 border border-red-200',
}

export default async function BehoerdenBundeslandPage({ params }: Props) {
  const { bundesland } = await params
  const bundeslandName = decodeBundesland(bundesland)

  const behoerden = await prisma.behoerde.findMany({
    where: { bundesland: { contains: bundeslandName, mode: 'insensitive' } },
    orderBy: { name: 'asc' },
    include: {
      messstellen: {
        where: { istVeroeffentlicht: true },
        select: { id: true, titel: true, slug: true, verstossArt: true },
        take: 5,
      },
      _count: { select: { messstellen: true } },
    },
  })

  if (behoerden.length === 0) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero strip */}
      <div className="bg-slate-950">
        <div className="container-gov pt-6 pb-8">
          <Breadcrumb
            items={[
              { label: 'Startseite', href: '/' },
              { label: 'Bußgeldbehörden', href: '/bussgeldbehoerden' },
              { label: bundeslandName },
            ]}
            dark
          />
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
            Bußgeldbehörden
            <span className="text-indigo-400 ml-2">{bundeslandName}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {behoerden.length} Behörde{behoerden.length !== 1 ? 'n' : ''} in {bundeslandName}
          </p>
        </div>
      </div>

      <div className="container-gov py-8 space-y-5">
        {behoerden.map((b) => (
          <article
            key={b.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all duration-200"
          >
            {/* Card header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
              <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{b.name}</h2>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Contact info */}
              <div className="space-y-2.5">
                {b.adresse && (
                  <address className="text-sm text-slate-600 not-italic flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {b.adresse}
                      {b.plz && (
                        <><br />{b.plz} {b.stadt}</>
                      )}
                    </span>
                  </address>
                )}
                {b.telefon && (
                  <a
                    href={`tel:${b.telefon}`}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {b.telefon}
                  </a>
                )}
                {b.email && (
                  <a
                    href={`mailto:${b.email}`}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 break-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {b.email}
                  </a>
                )}
                {b.website && (
                  <a
                    href={b.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    Website besuchen
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
                {b.beschreibung && (
                  <p className="text-sm text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                    {b.beschreibung}
                  </p>
                )}
              </div>

              {/* Assigned Messstellen */}
              {b.messstellen.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Zugeordnete Messstellen ({b._count.messstellen})
                  </h3>
                  <ul className="space-y-2">
                    {b.messstellen.map((m) => (
                      <li key={m.id} className="flex items-center gap-2">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            verstossTypeBadge[m.verstossArt] || ''
                          }`}
                        >
                          {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                        </span>
                        <Link
                          href={`/messstellen/${encodeURIComponent(bundeslandName.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                          className="text-xs text-slate-700 hover:text-indigo-700 transition-colors duration-200 truncate cursor-pointer"
                        >
                          {m.titel}
                        </Link>
                      </li>
                    ))}
                    {b._count.messstellen > 5 && (
                      <li className="text-xs text-slate-400 pl-1">
                        +{b._count.messstellen - 5} weitere Messstellen
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}

        <div className="pt-4">
          <Link
            href="/bussgeldbehoerden"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
          >
            Alle Bundesländer anzeigen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
