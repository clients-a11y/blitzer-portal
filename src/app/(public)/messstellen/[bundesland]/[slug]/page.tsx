import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS } from '@/types'
import type { FaqItem, BussgeldEintrag } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ bundesland: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const messstelle = await prisma.messstelle.findUnique({
    where: { slug },
    select: { titel: true, beschreibung: true, bundesland: true, verstossArt: true },
  })

  if (!messstelle) return { title: 'Messstelle nicht gefunden' }

  return {
    title: messstelle.titel,
    description:
      messstelle.beschreibung ||
      `Informationen zur Blitzer-Messstelle ${messstelle.titel} in ${messstelle.bundesland}`,
    openGraph: {
      title: `Blitzer: ${messstelle.titel}`,
      description:
        messstelle.beschreibung ||
        `Detaillierte Informationen zur Messstelle ${messstelle.titel}`,
    },
  }
}

export default async function MessstelleDetailPage({ params }: Props) {
  const { bundesland, slug } = await params

  const messstelle = await prisma.messstelle.findUnique({
    where: { slug, istVeroeffentlicht: true },
    include: { behoerde: true },
  })

  if (!messstelle) notFound()

  const faq = messstelle.faq as FaqItem[] | null
  const bussgeldTabelle = messstelle.bussgeldTabelle as BussgeldEintrag[] | null

  const verstossColors: Record<string, string> = {
    GESCHWINDIGKEIT: 'badge-geschwindigkeit',
    ABSTAND: 'badge-abstand',
    ROTLICHT: 'badge-rotlicht',
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: messstelle.titel,
    description: messstelle.beschreibung,
    address: {
      '@type': 'PostalAddress',
      addressRegion: messstelle.bundesland,
      addressLocality: messstelle.ort,
      addressCountry: 'DE',
    },
    ...(faq && faq.length > 0
      ? {
          mainEntity: {
            '@type': 'FAQPage',
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: item.frage,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.antwort,
              },
            })),
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-gov py-8">
        <Breadcrumb
          items={[
            { label: 'Startseite', href: '/' },
            { label: 'Messstellen', href: '/messstellen' },
            { label: messstelle.bundesland, href: `/messstellen/${bundesland}` },
            { label: messstelle.titel },
          ]}
        />

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <span
              className={`text-sm px-3 py-1 rounded font-medium ${verstossColors[messstelle.verstossArt]}`}
            >
              {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
            </span>
            {messstelle.autobahn && (
              <span className="text-sm bg-[#003366] text-white px-3 py-1 rounded font-mono font-bold">
                {messstelle.autobahn}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#003366] mb-2">{messstelle.titel}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>📍 {messstelle.bundesland}</span>
            {messstelle.ort && <span>🏘️ {messstelle.ort}</span>}
            {messstelle.abschnitt && <span>📏 Abschnitt {messstelle.abschnitt}</span>}
            {messstelle.kilometer && <span>🔢 km {messstelle.kilometer}</span>}
            <span>📅 Eingetragen am {formatDate(messstelle.createdAt)}</span>
          </div>
          {messstelle.beschreibung && (
            <p className="mt-4 text-gray-700 leading-relaxed">{messstelle.beschreibung}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Standort */}
            {messstelle.standortBeschreibung && (
              <section aria-labelledby="standort-heading" className="bg-white border border-gray-200 rounded p-6">
                <h2 id="standort-heading" className="gov-section-title">
                  Standort der Messstelle
                </h2>
                <p className="text-gray-700 leading-relaxed">{messstelle.standortBeschreibung}</p>
              </section>
            )}

            {/* Messgerät */}
            {messstelle.geraeteBeschreibung && (
              <section aria-labelledby="geraet-heading" className="bg-white border border-gray-200 rounded p-6">
                <h2 id="geraet-heading" className="gov-section-title">
                  Messgerät und Messtechnik
                </h2>
                <p className="text-gray-700 leading-relaxed">{messstelle.geraeteBeschreibung}</p>
              </section>
            )}

            {/* Bußgeldkatalog */}
            {bussgeldTabelle && bussgeldTabelle.length > 0 && (
              <section aria-labelledby="busskat-heading" className="bg-white border border-gray-200 rounded p-6">
                <h2 id="busskat-heading" className="gov-section-title">
                  Bußgeldkatalog –{' '}
                  {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
                </h2>
                <div className="overflow-x-auto -mx-6">
                  <table className="gov-table" role="table">
                    <caption className="sr-only">
                      Bußgeldkatalog für {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Kategorie</th>
                        {messstelle.verstossArt === 'GESCHWINDIGKEIT' && (
                          <>
                            <th scope="col">Innerorts</th>
                            <th scope="col">Außerorts</th>
                          </>
                        )}
                        {(messstelle.verstossArt === 'ABSTAND' || messstelle.verstossArt === 'ROTLICHT') && (
                          <>
                            <th scope="col">Bußgeld</th>
                          </>
                        )}
                        <th scope="col">Punkte</th>
                        <th scope="col">Fahrverbot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bussgeldTabelle.map((row, i) => (
                        <tr key={i}>
                          <td className="font-medium">{row.kategorie}</td>
                          {messstelle.verstossArt === 'GESCHWINDIGKEIT' && (
                            <>
                              <td>{row.innerorts || '–'}</td>
                              <td>{row.ausserorts || '–'}</td>
                            </>
                          )}
                          {(messstelle.verstossArt === 'ABSTAND' || messstelle.verstossArt === 'ROTLICHT') && (
                            <td>{row.innerorts || row.ausserorts || '–'}</td>
                          )}
                          <td>{row.punkte || '–'}</td>
                          <td>{row.fahrverbot || '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  * Stand: Bußgeldkatalog 2021 (BKatV). Angaben ohne Gewähr.
                </p>
              </section>
            )}

            {/* Einspruch */}
            {messstelle.einspruchBeschreibung && (
              <section aria-labelledby="einspruch-heading" className="bg-white border border-gray-200 rounded p-6">
                <h2 id="einspruch-heading" className="gov-section-title">
                  Einspruch gegen den Bußgeldbescheid
                </h2>
                <p className="text-gray-700 leading-relaxed">{messstelle.einspruchBeschreibung}</p>
              </section>
            )}

            {/* FAQ */}
            {faq && faq.length > 0 && (
              <section
                aria-labelledby="faq-heading"
                className="bg-white border border-gray-200 rounded p-6"
                itemScope
                itemType="https://schema.org/FAQPage"
              >
                <h2 id="faq-heading" className="gov-section-title">
                  Häufig gestellte Fragen (FAQ)
                </h2>
                <dl className="space-y-4">
                  {faq.map((item, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-100 pb-4 last:border-0"
                      itemScope
                      itemType="https://schema.org/Question"
                      itemProp="mainEntity"
                    >
                      <dt
                        className="font-semibold text-[#003366] mb-1.5"
                        itemProp="name"
                      >
                        {item.frage}
                      </dt>
                      <dd
                        className="text-gray-700 text-sm leading-relaxed"
                        itemScope
                        itemType="https://schema.org/Answer"
                        itemProp="acceptedAnswer"
                      >
                        <span itemProp="text">{item.antwort}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Behörde */}
            {messstelle.behoerde && (
              <div className="bg-white border border-gray-200 rounded p-5">
                <h2 className="text-sm font-bold text-[#003366] mb-3 uppercase tracking-wide">
                  Zuständige Bußgeldbehörde
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-gray-800">{messstelle.behoerde.name}</p>
                  {messstelle.behoerde.adresse && (
                    <p className="text-gray-600 text-xs">
                      {messstelle.behoerde.adresse}
                      {messstelle.behoerde.plz && (
                        <>
                          <br />
                          {messstelle.behoerde.plz} {messstelle.behoerde.stadt}
                        </>
                      )}
                    </p>
                  )}
                  {messstelle.behoerde.telefon && (
                    <p className="text-xs text-gray-600">
                      📞{' '}
                      <a
                        href={`tel:${messstelle.behoerde.telefon}`}
                        className="hover:underline text-[#003366]"
                      >
                        {messstelle.behoerde.telefon}
                      </a>
                    </p>
                  )}
                  {messstelle.behoerde.email && (
                    <p className="text-xs text-gray-600">
                      ✉️{' '}
                      <a
                        href={`mailto:${messstelle.behoerde.email}`}
                        className="hover:underline text-[#003366] break-all"
                      >
                        {messstelle.behoerde.email}
                      </a>
                    </p>
                  )}
                  {messstelle.behoerde.website && (
                    <p className="text-xs">
                      <a
                        href={messstelle.behoerde.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#003366] hover:underline break-all"
                      >
                        🌐 Website besuchen
                      </a>
                    </p>
                  )}
                  {messstelle.behoerde.beschreibung && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      {messstelle.behoerde.beschreibung}
                    </p>
                  )}
                </div>
                <Link
                  href={`/bussgeldbehoerden/${encodeURIComponent(messstelle.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                  className="block text-center mt-4 text-xs text-[#003366] font-medium hover:underline"
                >
                  Alle Behörden in {messstelle.bundesland}
                </Link>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-[#f5f7fa] rounded border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Weitere Informationen</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/bussgeldbehoerden"
                    className="text-[#003366] hover:underline text-xs"
                  >
                    → Alle Bußgeldbehörden
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/messstellen/${bundesland}`}
                    className="text-[#003366] hover:underline text-xs"
                  >
                    → Alle Messstellen in {messstelle.bundesland}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messstellen"
                    className="text-[#003366] hover:underline text-xs"
                  >
                    → Messstellen-Übersicht
                  </Link>
                </li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs text-amber-700">
              <strong>Hinweis:</strong> Alle Angaben ohne Gewähr. Die Informationen dienen
              allgemeinen Informationszwecken. Für rechtliche Beratung wenden Sie sich bitte an
              einen Fachanwalt für Verkehrsrecht.
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
