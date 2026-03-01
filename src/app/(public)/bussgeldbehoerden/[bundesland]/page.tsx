import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'

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
    <div className="container-gov py-8">
      <Breadcrumb
        items={[
          { label: 'Startseite', href: '/' },
          { label: 'Bußgeldbehörden', href: '/bussgeldbehoerden' },
          { label: bundeslandName },
        ]}
      />

      <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-2">
        Bußgeldbehörden {bundeslandName}
      </h1>
      <p className="text-gray-600 mb-8">
        {behoerden.length} Behörde{behoerden.length !== 1 ? 'n' : ''} in {bundeslandName}
      </p>

      <div className="space-y-6">
        {behoerden.map((b) => (
          <article key={b.id} className="gov-card p-6">
            <h2 className="text-lg font-bold text-[#003366] mb-3">{b.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                {b.adresse && (
                  <address className="not-italic text-gray-700">
                    {b.adresse}
                    {b.plz && (
                      <>
                        <br />
                        {b.plz} {b.stadt}
                      </>
                    )}
                  </address>
                )}
                {b.telefon && (
                  <p>
                    <a href={`tel:${b.telefon}`} className="text-[#003366] hover:underline">
                      📞 {b.telefon}
                    </a>
                  </p>
                )}
                {b.email && (
                  <p>
                    <a href={`mailto:${b.email}`} className="text-[#003366] hover:underline break-all">
                      ✉️ {b.email}
                    </a>
                  </p>
                )}
                {b.website && (
                  <p>
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#003366] hover:underline"
                    >
                      🌐 {b.website}
                    </a>
                  </p>
                )}
                {b.beschreibung && (
                  <p className="text-gray-600 text-sm leading-relaxed">{b.beschreibung}</p>
                )}
              </div>

              {b.messstellen.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Zugeordnete Messstellen ({b._count.messstellen})
                  </h3>
                  <ul className="space-y-1">
                    {b.messstellen.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/messstellen/${encodeURIComponent(bundeslandName.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                          className="text-xs text-[#003366] hover:underline"
                        >
                          {m.titel}
                        </Link>
                      </li>
                    ))}
                    {b._count.messstellen > 5 && (
                      <li className="text-xs text-gray-400">
                        +{b._count.messstellen - 5} weitere Messstellen
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
