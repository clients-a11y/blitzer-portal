'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSTOSS_LABELS } from '@/types'
import { Search, MapPin, ArrowRight, Gauge, Maximize2, CircleX } from 'lucide-react'

interface SearchResult {
  id: string
  titel: string
  verstossArt: string
  bundesland: string
  ort: string
  autobahn: string | null
  slug: string
  beschreibung: string | null
}

const verstossConfig = {
  GESCHWINDIGKEIT: { Icon: Gauge, badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  ABSTAND: { Icon: Maximize2, badge: 'bg-sky-50 text-sky-700 border border-sky-200' },
  ROTLICHT: { Icon: CircleX, badge: 'bg-red-50 text-red-600 border border-red-200' },
} as const

export default function SuchePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initialQuery)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return }
    setLoading(true)
    setSearched(true)
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await resp.json()
      setResults(data.results || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (initialQuery) doSearch(initialQuery) }, [initialQuery, doSearch])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/suche?q=${encodeURIComponent(query.trim())}`, { scroll: false })
      doSearch(query.trim())
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero search area */}
      <div className="bg-white border-b border-slate-200">
        <div className="container-gov py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-5">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/" className="hover:text-indigo-600 transition-colors duration-200 cursor-pointer">
                  Startseite
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">/</li>
              <li className="text-slate-700 font-medium" aria-current="page">Suche</li>
            </ol>
          </nav>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-6">
            Messstellen suchen
          </h1>

          <form onSubmit={handleSubmit} role="search" className="max-w-2xl">
            <div className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:shadow-sm rounded-2xl px-4 py-3 transition-all duration-200">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <label htmlFor="search-input" className="sr-only">Suchbegriff eingeben</label>
              <input
                id="search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Autobahn, Ort, Bundesland oder Messstelle ..."
                className="flex-1 text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent"
                autoFocus
              />
              <button
                type="submit"
                className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors duration-200 cursor-pointer"
              >
                Suchen
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 ml-1">
              z.B. &bdquo;A9 Bayern&ldquo;, &bdquo;Stammbach&ldquo;, &bdquo;Abstandsverstoß München&ldquo;
            </p>
          </form>
        </div>
      </div>

      <div className="container-gov py-8">
        {loading && (
          <div className="flex items-center gap-3 py-12 text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Suche läuft ...</span>
          </div>
        )}

        {!loading && searched && (
          <div>
            <p className="text-sm text-slate-500 mb-5">
              {results.length === 0
                ? `Keine Ergebnisse für „${initialQuery || query}".`
                : `${results.length} Ergebnis${results.length !== 1 ? 'se' : ''} für „${initialQuery || query}"`}
            </p>

            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((r) => {
                  const cfg = verstossConfig[r.verstossArt as keyof typeof verstossConfig]
                  const Icon = cfg?.Icon
                  const href = `/messstellen/${encodeURIComponent(r.bundesland.toLowerCase().replace(/\s/g, '-'))}/${r.slug}`
                  return (
                    <article
                      key={r.id}
                      className="group bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex flex-col"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {cfg && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}>
                            {Icon && <Icon className="w-3 h-3" />}
                            {VERSTOSS_LABELS[r.verstossArt as keyof typeof VERSTOSS_LABELS]}
                          </span>
                        )}
                        {r.autobahn && (
                          <span className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded-lg font-mono font-bold tracking-wide">
                            {r.autobahn}
                          </span>
                        )}
                      </div>
                      <h2 className="font-bold text-slate-900 text-sm leading-snug mb-1.5 flex-1">
                        <Link href={href} className="hover:text-indigo-700 transition-colors duration-200 cursor-pointer">
                          {r.titel}
                        </Link>
                      </h2>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {r.bundesland}{r.ort && ` · ${r.ort}`}
                      </p>
                      {r.beschreibung && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {r.beschreibung}
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
            )}

            {results.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm mb-1">Keine Messstellen gefunden.</p>
                <p className="text-slate-400 text-xs mb-4">Versuchen Sie einen anderen Suchbegriff.</p>
                <Link
                  href="/messstellen"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
                >
                  Alle Messstellen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Initial state */}
        {!searched && (
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Nach Kategorie stöbern
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: '/messstellen?verstossArt=GESCHWINDIGKEIT', icon: Gauge, label: 'Geschwindigkeitsmessung', desc: 'Blitzer, Streckenradar, Section Control', iconClass: 'text-amber-600 bg-amber-100', border: 'border-amber-200 hover:border-amber-300' },
                { href: '/messstellen?verstossArt=ABSTAND', icon: Maximize2, label: 'Abstandsmessung', desc: 'Seitenradar, Videobrücken', iconClass: 'text-sky-600 bg-sky-100', border: 'border-sky-200 hover:border-sky-300' },
                { href: '/messstellen?verstossArt=ROTLICHT', icon: CircleX, label: 'Rotlichtüberwachung', desc: 'Ampelkameras', iconClass: 'text-red-600 bg-red-100', border: 'border-red-200 hover:border-red-300' },
              ].map((cat) => {
                const Icon = cat.icon
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className={`group bg-white border-2 rounded-2xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer ${cat.border}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cat.iconClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-700 transition-colors duration-200">
                      {cat.label}
                    </div>
                    <div className="text-xs text-slate-500">{cat.desc}</div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
