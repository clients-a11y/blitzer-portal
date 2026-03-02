import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { VERSTOSS_LABELS } from '@/types'
import type { FaqItem, BussgeldEintrag } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  MapPin,
  Building2,
  Phone,
  Mail,
  Globe,
  Calendar,
  Hash,
  Layers,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  ScanLine,
  FileText,
  Gauge,
  Maximize2,
  CircleX,
  ExternalLink,
} from 'lucide-react'

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

const verstossConfig = {
  GESCHWINDIGKEIT: {
    Icon: Gauge,
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    heroBg: 'from-amber-50/50',
  },
  ABSTAND: {
    Icon: Maximize2,
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    heroBg: 'from-sky-50/50',
  },
  ROTLICHT: {
    Icon: CircleX,
    badge: 'bg-red-50 text-red-600 border border-red-200',
    heroBg: 'from-red-50/50',
  },
} as const

function SectionCard({
  id,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  children,
}: {
  id: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
    >
      <h2
        id={id}
        className="text-base font-bold text-slate-900 flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100"
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {title}
      </h2>
      {children}
    </section>
  )
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

  const cfg = verstossConfig[messstelle.verstossArt as keyof typeof verstossConfig]
  const VerstossIcon = cfg.Icon

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

      <div className="min-h-screen bg-slate-50/50">
        <div className="container-gov py-8">
          <Breadcrumb
            items={[
              { label: 'Startseite', href: '/' },
              { label: 'Messstellen', href: '/messstellen' },
              { label: messstelle.bundesland, href: `/messstellen/${bundesland}` },
              { label: messstelle.titel },
            ]}
          />

          {/* Hero card */}
          <div
            className={`bg-gradient-to-br ${cfg.heroBg} via-white to-white border border-slate-100 rounded-2xl p-6 mb-6 shadow-sm`}
          >
            <div className="flex flex-wrap items-start gap-2.5 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${cfg.badge}`}
              >
                <VerstossIcon className="w-3.5 h-3.5" />
                {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
              </span>
              {messstelle.autobahn && (
                <span className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded-full font-mono font-bold tracking-wide">
                  {messstelle.autobahn}
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
              {messstelle.titel}
            </h1>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                {messstelle.bundesland}
              </span>
              {messstelle.ort && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  {messstelle.ort}
                </span>
              )}
              {messstelle.abschnitt && (
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  Abschnitt {messstelle.abschnitt}
                </span>
              )}
              {messstelle.kilometer && (
                <span className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  km {messstelle.kilometer}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />
                Eingetragen am {formatDate(messstelle.createdAt)}
              </span>
            </div>

            {messstelle.beschreibung && (
              <p className="mt-4 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {messstelle.beschreibung}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              {messstelle.standortBeschreibung && (
                <SectionCard
                  id="standort-heading"
                  icon={MapPin}
                  iconBg="bg-sky-100"
                  iconColor="text-sky-600"
                  title="Standort der Messstelle"
                >
                  <p className="text-slate-600 leading-relaxed">
                    {messstelle.standortBeschreibung}
                  </p>
                </SectionCard>
              )}

              {messstelle.geraeteBeschreibung && (
                <SectionCard
                  id="geraet-heading"
                  icon={ScanLine}
                  iconBg="bg-indigo-100"
                  iconColor="text-indigo-600"
                  title="Messgerät und Messtechnik"
                >
                  <p className="text-slate-600 leading-relaxed">
                    {messstelle.geraeteBeschreibung}
                  </p>
                </SectionCard>
              )}

              {bussgeldTabelle && bussgeldTabelle.length > 0 && (
                <SectionCard
                  id="busskat-heading"
                  icon={FileText}
                  iconBg="bg-emerald-100"
                  iconColor="text-emerald-600"
                  title={`Bußgeldkatalog – ${VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}`}
                >
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-sm" role="table">
                      <caption className="sr-only">
                        Bußgeldkatalog für{' '}
                        {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
                      </caption>
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            Kategorie
                          </th>
                          {messstelle.verstossArt === 'GESCHWINDIGKEIT' && (
                            <>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                              >
                                Innerorts
                              </th>
                              <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                              >
                                Außerorts
                              </th>
                            </>
                          )}
                          {(messstelle.verstossArt === 'ABSTAND' ||
                            messstelle.verstossArt === 'ROTLICHT') && (
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            >
                              Bußgeld
                            </th>
                          )}
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            Punkte
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            Fahrverbot
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {bussgeldTabelle.map((row, i) => (
                          <tr key={i} className="hover:bg-sky-50/40 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-800">
                              {row.kategorie}
                            </td>
                            {messstelle.verstossArt === 'GESCHWINDIGKEIT' && (
                              <>
                                <td className="px-4 py-3 text-slate-600">
                                  {row.innerorts || '–'}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {row.ausserorts || '–'}
                                </td>
                              </>
                            )}
                            {(messstelle.verstossArt === 'ABSTAND' ||
                              messstelle.verstossArt === 'ROTLICHT') && (
                              <td className="px-4 py-3 text-slate-600">
                                {row.innerorts || row.ausserorts || '–'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-slate-600">{row.punkte || '–'}</td>
                            <td className="px-4 py-3 text-slate-600">{row.fahrverbot || '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    * Stand: Bußgeldkatalog 2021 (BKatV). Angaben ohne Gewähr.
                  </p>
                </SectionCard>
              )}

              {messstelle.einspruchBeschreibung && (
                <SectionCard
                  id="einspruch-heading"
                  icon={ShieldCheck}
                  iconBg="bg-violet-100"
                  iconColor="text-violet-600"
                  title="Einspruch gegen den Bußgeldbescheid"
                >
                  <p className="text-slate-600 leading-relaxed">
                    {messstelle.einspruchBeschreibung}
                  </p>
                </SectionCard>
              )}

              {faq && faq.length > 0 && (
                <section
                  aria-labelledby="faq-heading"
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
                  itemScope
                  itemType="https://schema.org/FAQPage"
                >
                  <h2
                    id="faq-heading"
                    className="text-base font-bold text-slate-900 flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    Häufig gestellte Fragen
                  </h2>
                  <dl className="space-y-3">
                    {faq.map((item, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 rounded-xl p-4"
                        itemScope
                        itemType="https://schema.org/Question"
                        itemProp="mainEntity"
                      >
                        <dt
                          className="font-semibold text-slate-800 text-sm mb-1.5"
                          itemProp="name"
                        >
                          {item.frage}
                        </dt>
                        <dd
                          className="text-slate-600 text-sm leading-relaxed"
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
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-sky-600" />
                    </div>
                    Zuständige Bußgeldbehörde
                  </h2>
                  <div className="space-y-2.5">
                    <p className="font-semibold text-slate-800 text-sm">
                      {messstelle.behoerde.name}
                    </p>
                    {messstelle.behoerde.adresse && (
                      <p className="text-slate-500 text-xs leading-relaxed">
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
                      <a
                        href={`tel:${messstelle.behoerde.telefon}`}
                        className="flex items-center gap-2 text-xs text-sky-700 hover:text-sky-900 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {messstelle.behoerde.telefon}
                      </a>
                    )}
                    {messstelle.behoerde.email && (
                      <a
                        href={`mailto:${messstelle.behoerde.email}`}
                        className="flex items-center gap-2 text-xs text-sky-700 hover:text-sky-900 transition-colors break-all"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        {messstelle.behoerde.email}
                      </a>
                    )}
                    {messstelle.behoerde.website && (
                      <a
                        href={messstelle.behoerde.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-sky-700 hover:text-sky-900 transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        Website besuchen
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}
                    {messstelle.behoerde.beschreibung && (
                      <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                        {messstelle.behoerde.beschreibung}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/bussgeldbehoerden/${encodeURIComponent(messstelle.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                    className="block text-center mt-4 text-xs text-sky-600 font-medium hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-xl py-2.5 transition-colors cursor-pointer"
                  >
                    Alle Behörden in {messstelle.bundesland}
                  </Link>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Weitere Informationen</h3>
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href="/bussgeldbehoerden"
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-sky-700 hover:bg-sky-50 px-2.5 py-2 rounded-xl transition-colors group cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      Alle Bußgeldbehörden
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/messstellen/${bundesland}`}
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-sky-700 hover:bg-sky-50 px-2.5 py-2 rounded-xl transition-colors group cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      Alle Messstellen in {messstelle.bundesland}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/messstellen"
                      className="flex items-center gap-2 text-xs text-slate-600 hover:text-sky-700 hover:bg-sky-50 px-2.5 py-2 rounded-xl transition-colors group cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      Messstellen-Übersicht
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong className="text-amber-900">Hinweis:</strong> Alle Angaben ohne Gewähr.
                    Die Informationen dienen allgemeinen Informationszwecken. Für rechtliche
                    Beratung wenden Sie sich bitte an einen Fachanwalt für Verkehrsrecht.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
