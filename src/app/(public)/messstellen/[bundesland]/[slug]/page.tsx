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
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  ScanLine,
  FileText,
  Gauge,
  Maximize2,
  CircleX,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'

interface Props {
  params: Promise<{ bundesland: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const messstelle = await prisma.messstelle.findUnique({
    where: { slug },
    select: { titel: true, beschreibung: true, bundesland: true },
  })
  if (!messstelle) return { title: 'Messstelle nicht gefunden' }
  return {
    title: messstelle.titel,
    description:
      messstelle.beschreibung ||
      `Informationen zur Messstelle ${messstelle.titel} in ${messstelle.bundesland}`,
    openGraph: {
      title: `Blitzer: ${messstelle.titel}`,
      description: messstelle.beschreibung || `Detaillierte Informationen zur Messstelle ${messstelle.titel}`,
    },
  }
}

const verstossConfig = {
  GESCHWINDIGKEIT: {
    Icon: Gauge,
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    heroBg: 'from-amber-500/10',
    dot: 'bg-amber-400',
  },
  ABSTAND: {
    Icon: Maximize2,
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    heroBg: 'from-sky-500/10',
    dot: 'bg-sky-400',
  },
  ROTLICHT: {
    Icon: CircleX,
    badge: 'bg-red-50 text-red-600 border border-red-200',
    heroBg: 'from-red-500/10',
    dot: 'bg-red-400',
  },
} as const

function SectionCard({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
        <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <h2 id={id} className="text-sm font-bold text-slate-800">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
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
              acceptedAnswer: { '@type': 'Answer', text: item.antwort },
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

      <div className="min-h-screen bg-slate-50">
        {/* ── DARK HERO BANNER ────────────────────────────────────── */}
        <div className={`bg-slate-950 bg-gradient-to-br ${cfg.heroBg} to-transparent`}>
          <div className="container-gov pt-8 pb-8">
            <Breadcrumb
              items={[
                { label: 'Startseite', href: '/' },
                { label: 'Messstellen', href: '/messstellen' },
                { label: messstelle.bundesland, href: `/messstellen/${bundesland}` },
                { label: messstelle.titel },
              ]}
              dark
            />

            <div className="mt-5 flex flex-wrap items-center gap-2 mb-4">
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${cfg.badge}`}
              >
                <VerstossIcon className="w-3.5 h-3.5" />
                {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
              </span>
              {messstelle.autobahn && (
                <span className="text-xs bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full font-mono font-bold tracking-wide">
                  {messstelle.autobahn}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-5">
              {messstelle.titel}
            </h1>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {messstelle.bundesland}
              </span>
              {messstelle.ort && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {messstelle.ort}
                </span>
              )}
              {messstelle.abschnitt && (
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                  Abschnitt {messstelle.abschnitt}
                </span>
              )}
              {messstelle.kilometer && (
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                  km {messstelle.kilometer}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {formatDate(messstelle.createdAt)}
              </span>
            </div>

            {messstelle.beschreibung && (
              <p className="mt-4 text-slate-300 text-sm leading-relaxed max-w-2xl border-t border-white/10 pt-4">
                {messstelle.beschreibung}
              </p>
            )}
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────────── */}
        <div className="container-gov py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── LEFT (main content) ── */}
            <div className="lg:col-span-2 space-y-4">
              {messstelle.standortBeschreibung && (
                <SectionCard id="standort-heading" icon={MapPin} title="Standort">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {messstelle.standortBeschreibung}
                  </p>
                </SectionCard>
              )}

              {messstelle.geraeteBeschreibung && (
                <SectionCard id="geraet-heading" icon={ScanLine} title="Messgerät & Technik">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {messstelle.geraeteBeschreibung}
                  </p>
                </SectionCard>
              )}

              {bussgeldTabelle && bussgeldTabelle.length > 0 && (
                <section
                  aria-labelledby="busskat-heading"
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <h2 id="busskat-heading" className="text-sm font-bold text-slate-800">
                      Bußgeldkatalog —{' '}
                      {VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="table">
                      <caption className="sr-only">Bußgeldkatalog</caption>
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th scope="col" className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider">
                            Kategorie
                          </th>
                          {messstelle.verstossArt === 'GESCHWINDIGKEIT' && (
                            <>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Innerorts</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Außerorts</th>
                            </>
                          )}
                          {(messstelle.verstossArt === 'ABSTAND' || messstelle.verstossArt === 'ROTLICHT') && (
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Bußgeld</th>
                          )}
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Punkte</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fahrverbot</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bussgeldTabelle.map((row, i) => (
                          <tr key={i} className="hover:bg-indigo-50/40 transition-colors duration-150">
                            <td className="px-5 py-3 font-semibold text-slate-800 text-xs">{row.kategorie}</td>
                            {messstelle.verstossArt === 'GESCHWINDIGKEIT' && (
                              <>
                                <td className="px-4 py-3 text-slate-500 text-xs">{row.innerorts || '–'}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs">{row.ausserorts || '–'}</td>
                              </>
                            )}
                            {(messstelle.verstossArt === 'ABSTAND' || messstelle.verstossArt === 'ROTLICHT') && (
                              <td className="px-4 py-3 text-slate-500 text-xs">{row.innerorts || row.ausserorts || '–'}</td>
                            )}
                            <td className="px-4 py-3 text-slate-500 text-xs">{row.punkte || '–'}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{row.fahrverbot || '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-400 px-5 py-3">
                      Stand: Bußgeldkatalog 2021 (BKatV). Alle Angaben ohne Gewähr.
                    </p>
                  </div>
                </section>
              )}

              {messstelle.einspruchBeschreibung && (
                <SectionCard id="einspruch-heading" icon={ShieldCheck} title="Einspruch gegen den Bußgeldbescheid">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {messstelle.einspruchBeschreibung}
                  </p>
                </SectionCard>
              )}

              {faq && faq.length > 0 && (
                <section
                  aria-labelledby="faq-heading"
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                  itemScope
                  itemType="https://schema.org/FAQPage"
                >
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
                    <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <h2 id="faq-heading" className="text-sm font-bold text-slate-800">
                      Häufige Fragen
                    </h2>
                  </div>
                  <dl className="divide-y divide-slate-100">
                    {faq.map((item, i) => (
                      <div
                        key={i}
                        className="px-5 py-4"
                        itemScope
                        itemType="https://schema.org/Question"
                        itemProp="mainEntity"
                      >
                        <dt
                          className="flex items-start gap-3 font-bold text-slate-900 text-sm mb-2"
                          itemProp="name"
                        >
                          <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 text-[10px] font-black mt-0.5">
                            Q
                          </span>
                          {item.frage}
                        </dt>
                        <dd
                          className="pl-8 text-slate-500 text-sm leading-relaxed"
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

            {/* ── RIGHT (sticky sidebar) ── */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {/* Behörde card */}
              {messstelle.behoerde && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Zuständige Behörde</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="font-bold text-slate-900 text-sm">{messstelle.behoerde.name}</p>
                    {messstelle.behoerde.adresse && (
                      <p className="text-slate-500 text-xs leading-relaxed">
                        {messstelle.behoerde.adresse}
                        {messstelle.behoerde.plz && (
                          <><br />{messstelle.behoerde.plz} {messstelle.behoerde.stadt}</>
                        )}
                      </p>
                    )}
                    {messstelle.behoerde.telefon && (
                      <a
                        href={`tel:${messstelle.behoerde.telefon}`}
                        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {messstelle.behoerde.telefon}
                      </a>
                    )}
                    {messstelle.behoerde.email && (
                      <a
                        href={`mailto:${messstelle.behoerde.email}`}
                        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 break-all cursor-pointer"
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
                        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        Website besuchen
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}
                    {messstelle.behoerde.beschreibung && (
                      <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                        {messstelle.behoerde.beschreibung}
                      </p>
                    )}
                  </div>
                  <div className="border-t border-slate-100 px-4 py-3">
                    <Link
                      href={`/bussgeldbehoerden/${encodeURIComponent(messstelle.bundesland.toLowerCase().replace(/\s/g, '-'))}`}
                      className="flex items-center justify-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 hover:bg-indigo-50 rounded-xl py-2 transition-colors duration-200 cursor-pointer"
                    >
                      Alle Behörden in {messstelle.bundesland}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weitere Links</h3>
                </div>
                <ul className="p-2">
                  {[
                    { href: '/bussgeldbehoerden', label: 'Alle Bußgeldbehörden' },
                    { href: `/messstellen/${bundesland}`, label: `Messstellen ${messstelle.bundesland}` },
                    { href: '/messstellen', label: 'Alle Messstellen' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-2.5 rounded-xl transition-colors duration-200 group cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors duration-200" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong className="text-amber-900">Hinweis:</strong> Alle Angaben ohne Gewähr.
                    Für rechtliche Beratung wenden Sie sich an einen Fachanwalt für Verkehrsrecht.
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
