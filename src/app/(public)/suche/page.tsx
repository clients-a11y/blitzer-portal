'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSTOSS_LABELS } from '@/types'

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
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
        <ol className="flex items-center gap-1">
          <li><Link href="/" className="hover:text-[#003366]">Startseite</Link></li>
          <li aria-hidden="true" className="text-gray-300">/</li>
          <li className="text-gray-700 font-medium" aria-current="page">Suche</li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-6">
        Messstellen suchen
      </h1>

      <form onSubmit={handleSubmit} role="search" className="mb-8">
        <div className="flex border-2 border-[#003366] rounded overflow-hidden max-w-2xl">
          <label htmlFor="search-input" className="sr-only">
            Suchbegriff eingeben
          </label>
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Autobahn, Ort, Bundesland oder Messstelle suchen ..."
            className="flex-1 px-4 py-3 text-sm outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Suchen
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Beispiele: „A9 Bayern", „Stammbach", „Abstandsverstoß München"
        </p>
      </form>

      {loading && (
        <div className="flex items-center gap-3 py-8 text-gray-500">
          <div className="w-5 h-5 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
          <span>Suche läuft ...</span>
        </div>
      )}

      {!loading && searched && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {results.length === 0
              ? `Keine Ergebnisse für „${initialQuery || query}".`
              : `${results.length} Ergebnis${results.length !== 1 ? 'se' : ''} für „${initialQuery || query}"`}
          </p>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r) => (
                <article key={r.id} className="gov-card p-4">
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${verstossColors[r.verstossArt]}`}>
                      {VERSTOSS_LABELS[r.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </span>
                    {r.autobahn && (
                      <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded font-mono font-bold">
                        {r.autobahn}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-[#003366]">
                    <Link
                      href={`/messstellen/${encodeURIComponent(r.bundesland.toLowerCase().replace(/\s/g, '-'))}/${r.slug}`}
                      className="hover:underline"
                    >
                      {r.titel}
                    </Link>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.bundesland} · {r.ort}
                  </p>
                  {r.beschreibung && (
                    <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{r.beschreibung}</p>
                  )}
                </article>
              ))}
            </div>
          )}

          {results.length === 0 && (
            <div className="text-center py-10 border border-dashed border-gray-300 rounded">
              <p className="text-gray-500 mb-4">
                Keine Messstellen für Ihre Suchanfrage gefunden.
              </p>
              <Link href="/messstellen" className="text-sm text-[#003366] font-medium hover:underline">
                Alle Messstellen anzeigen
              </Link>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[
            { href: '/messstellen?verstossArt=GESCHWINDIGKEIT', label: 'Geschwindigkeitsmessung', desc: 'Blitzer und Streckenradar' },
            { href: '/messstellen?verstossArt=ABSTAND', label: 'Abstandsmessung', desc: 'Section Control und Seitenradar' },
            { href: '/messstellen?verstossArt=ROTLICHT', label: 'Rotlichtüberwachung', desc: 'Ampelüberwachung' },
          ].map((cat) => (
            <Link key={cat.href} href={cat.href} className="gov-card p-5 text-center group">
              <div className="font-semibold text-[#003366] group-hover:underline mb-1">{cat.label}</div>
              <div className="text-xs text-gray-500">{cat.desc}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
