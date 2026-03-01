'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSTOSS_LABELS } from '@/types'

export default function NeueMessstellePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [titel, setTitel] = useState('')
  const [verstossArt, setVerstossArt] = useState<'GESCHWINDIGKEIT' | 'ABSTAND' | 'ROTLICHT'>('GESCHWINDIGKEIT')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const resp = await fetch('/api/messstellen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titel: titel.trim(), verstossArt }),
      })

      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      const messstelle = await resp.json()
      router.push(`/admin/messstellen/${messstelle.id}?neu=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setLoading(false)
    }
  }

  const beispiele = [
    'Stammbach, A9, Ri. München, Abschnitt 240, km 4.469',
    'München, A8, Ri. Salzburg, km 12.3',
    'Nürnberg, A6, Ri. Mannheim, Abschnitt 180, km 55.0',
    'Berlin, A10, Ri. Hamburg, km 21.5',
  ]

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/messstellen" className="text-sm text-gray-500 hover:text-gray-700">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Neue Messstelle</h1>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h2 className="text-sm font-semibold text-blue-800 mb-1">
          Automatische KI-Recherche
        </h2>
        <p className="text-xs text-blue-700 leading-relaxed">
          Nach dem Speichern startet der AI-Agent automatisch und recherchiert detaillierte
          Informationen zur Messstelle: Beschreibung, Standort, Messgerät, zuständige Behörde,
          Einspruchsmöglichkeiten, FAQ und Bußgeldkatalog.
        </p>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="titel" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Titel der Messstelle
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="titel"
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              required
              placeholder="z.B. Stammbach, A9, Ri. München, Abschnitt 240, km 4.469"
              className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Geben Sie den vollständigen Titel inkl. Autobahn, Richtung und Kilometer-Angabe an.
            </p>
          </div>

          <div>
            <label htmlFor="verstossArt" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Verstoßart
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['GESCHWINDIGKEIT', 'ABSTAND', 'ROTLICHT'] as const).map((art) => (
                <label
                  key={art}
                  className={`flex items-center gap-2 p-3 border-2 rounded cursor-pointer transition-colors ${
                    verstossArt === art
                      ? 'border-[#003366] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="verstossArt"
                    value={art}
                    checked={verstossArt === art}
                    onChange={() => setVerstossArt(art)}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    verstossArt === art ? 'border-[#003366] bg-[#003366]' : 'border-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">
                    {VERSTOSS_LABELS[art]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div
              className="bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !titel.trim()}
              className="bg-[#003366] text-white px-6 py-2.5 text-sm font-semibold rounded hover:bg-[#002244] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wird gespeichert ...
                </>
              ) : (
                'Speichern & KI-Recherche starten'
              )}
            </button>
            <Link
              href="/admin/messstellen"
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </div>

      {/* Beispiele */}
      <div className="mt-6 bg-gray-50 rounded border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Beispiel-Titel
        </h3>
        <ul className="space-y-1.5">
          {beispiele.map((b) => (
            <li key={b}>
              <button
                type="button"
                onClick={() => setTitel(b)}
                className="text-xs text-[#003366] hover:underline text-left"
              >
                {b}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
