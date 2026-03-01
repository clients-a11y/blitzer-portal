'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSTOSS_LABELS } from '@/types'
import { Search, MapPin, ArrowRight } from 'lucide-react'

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

export default function SuchePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!initialQuery)

  const verstossColors: Record<string, string> = {
    GESCHWINDIGKEIT: 'badge-geschwindigkeit',
    ABSTAND: 'badge-abstand',
    ROTLICHT: 'badge-rotlicht',
  }

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([])
      return
    }
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

  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  }, [initialQuery, doSearch])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/suche?q=${encodeURIComponent(query.trim())}`, { scroll: false })
      doSearch(query.trim())
    }
  }

  return (
    <div className="container-gov py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-blue-700 transition-colors">
              Startseite
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">/</li>
          <li className="text-slate-700 font-medium" aria-current="page">
            Suche
          </li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6">
        Messstellen suchen
      </h1>

      <form onSubmit={handleSubmit} role="search" className="mb-8">
        <div className="flex border-2 border-blue-600 rounded-2xl overflow-hidden max-w-2xl focus-within:border-blue-700 focus-within:shadow-md transition-all bg-white">
          <label htmlFor="search-input" className="sr-only">
            Suchbegriff eingeben
          </label>
          <Search className="w-5 h-5 text-slate-400 ml-4 my-auto flex-shrink-0" />
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Autobahn, Ort, Bundesland oder Messstelle suchen ..."
            className="flex-1 px-3 py-3.5 text-sm outline-none text-slate-700 placeholder-slate-400 bg-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="px-5 py-3.5 bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2"
          >
            Suchen
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 ml-1">
          Beispiele: „A9 Bayern", „Stammbach", „Abstandsverstoß München"
        </p>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Suche läuft ...</span>
        </div>
      )}

      {!loading && searched && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            {results.length === 0
              ? `Keine Ergebnisse für „${initialQuery || query}".`
              : `${results.length} Ergebnis${results.length !== 1 ? 'se' : ''} für „${initialQuery || query}"`}
          </p>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r) => (
                <article key={r.id} className="gov-card p-4">
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${verstossColors[r.verstossArt]}`}
                    >
                      {VERSTOSS_LABELS[r.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </span>
                    {r.autobahn && (
                      <span className="text-xs bg-blue-700 text-white px-2.5 py-1 rounded-lg font-mono font-bold">
                        {r.autobahn}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-slate-900">
                    <Link
                      href={`/messstellen/${encodeURIComponent(r.bundesland.toLowerCase().replace(/\s/g, '-'))}/${r.slug}`}
                      className="hover:text-blue-700 transition-colors"
                    >
                      {r.titel}
                    </Link>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {r.bundesland} · {r.ort}
                  </p>
                  {r.beschreibung && (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{r.beschreibung}</p>
                  )}
                </article>
              ))}
            </div>
          )}

          {results.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500 mb-4">
                Keine Messstellen für Ihre Suchanfrage gefunden.
              </p>
              <Link
                href="/messstellen"
                className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-semibold hover:text-blue-800"
              >
                Alle Messstellen anzeigen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[
            {
              href: '/messstellen?verstossArt=GESCHWINDIGKEIT',
              label: 'Geschwindigkeitsmessung',
              desc: 'Blitzer und Streckenradar',
              color: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50',
            },
            {
              href: '/messstellen?verstossArt=ABSTAND',
              label: 'Abstandsmessung',
              desc: 'Section Control und Seitenradar',
              color: 'border-sky-200 hover:border-sky-400 hover:bg-sky-50',
            },
            {
              href: '/messstellen?verstossArt=ROTLICHT',
              label: 'Rotlichtüberwachung',
              desc: 'Ampelüberwachung',
              color: 'border-red-200 hover:border-red-400 hover:bg-red-50',
            },
          ].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`gov-card p-5 text-center group border-2 transition-colors ${cat.color}`}
            >
              <div className="font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {cat.label}
              </div>
              <div className="text-xs text-slate-500">{cat.desc}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
