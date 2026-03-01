'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { VERSTOSS_LABELS } from '@/types'
import type { Messstelle, FaqItem, BussgeldEintrag } from '@/types'

const statusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  RESEARCHING: 'KI recherchiert ...',
  COMPLETED: 'Abgeschlossen',
  FAILED: 'Fehler',
}

const statusClasses: Record<string, string> = {
  PENDING: 'status-pending',
  RESEARCHING: 'status-researching',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
}

export default function MessstelleDetailAdminPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = searchParams.get('neu') === 'true'

  const [messstelle, setMessstelle] = useState<Messstelle | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    async function fetchMessstelle() {
      const resp = await fetch(`/api/messstellen/${id}`)
      if (!resp.ok) return
      const data = await resp.json()
      setMessstelle(data)
      setLoading(false)

      // Poll while researching
      if (data.researchStatus === 'RESEARCHING' || data.researchStatus === 'PENDING') {
        interval = setInterval(async () => {
          const r = await fetch(`/api/messstellen/${id}`)
          if (!r.ok) return
          const d = await r.json()
          setMessstelle(d)
          if (d.researchStatus !== 'RESEARCHING' && d.researchStatus !== 'PENDING') {
            clearInterval(interval)
          }
        }, 3000)
      }
    }

    fetchMessstelle()
    return () => clearInterval(interval)
  }, [id])

  async function handleDelete() {
    if (!confirm(`Messstelle "${messstelle?.titel}" wirklich löschen?`)) return
    setDeleting(true)
    await fetch(`/api/messstellen/${id}`, { method: 'DELETE' })
    router.push('/admin/messstellen')
  }

  async function handleRetry() {
    setRetrying(true)
    await fetch('/api/agent/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': '',
      },
      body: JSON.stringify({ messstelleId: id }),
    })
    // Refetch
    const resp = await fetch(`/api/messstellen/${id}`)
    const data = await resp.json()
    setMessstelle(data)
    setRetrying(false)
  }

  async function togglePublished() {
    if (!messstelle) return
    const resp = await fetch(`/api/messstellen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ istVeroeffentlicht: !messstelle.istVeroeffentlicht }),
    })
    const data = await resp.json()
    setMessstelle(data)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-gray-500">
        <div className="w-5 h-5 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
        Wird geladen ...
      </div>
    )
  }

  if (!messstelle) {
    return (
      <div>
        <p className="text-red-600">Messstelle nicht gefunden.</p>
        <Link href="/admin/messstellen" className="text-[#003366] hover:underline text-sm mt-2 inline-block">
          ← Zurück
        </Link>
      </div>
    )
  }

  const faq = messstelle.faq as FaqItem[] | null
  const bussgeldTabelle = messstelle.bussgeldTabelle as BussgeldEintrag[] | null

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/messstellen" className="text-sm text-gray-500 hover:text-gray-700">
          ← Zurück
        </Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">{messstelle.titel}</h1>
      </div>

      {/* New entry success message */}
      {isNew && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6 flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-green-600 flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">Messstelle wurde erfolgreich gespeichert!</p>
            <p className="text-xs text-green-700 mt-0.5">Der AI-Agent recherchiert jetzt automatisch alle Informationen zur Messstelle.</p>
          </div>
        </div>
      )}

      {/* Status & Actions */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Recherche-Status</span>
              <span className={`text-sm px-3 py-1 rounded font-medium ${statusClasses[messstelle.researchStatus]}`}>
                {messstelle.researchStatus === 'RESEARCHING' && (
                  <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5 align-middle" />
                )}
                {statusLabels[messstelle.researchStatus]}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-1">Veröffentlicht</span>
              <button
                onClick={togglePublished}
                className={`text-sm px-3 py-1 rounded font-medium border transition-colors ${
                  messstelle.istVeroeffentlicht
                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {messstelle.istVeroeffentlicht ? '✓ Ja' : '✗ Nein'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messstelle.researchStatus === 'FAILED' && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {retrying ? 'Startet ...' : 'Erneut recherchieren'}
              </button>
            )}
            {messstelle.istVeroeffentlicht && (
              <Link
                href={`/messstellen/${encodeURIComponent(messstelle.bundesland.toLowerCase().replace(/\s/g, '-'))}/${messstelle.slug}`}
                target="_blank"
                className="text-xs border border-[#003366] text-[#003366] px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
              >
                Vorschau ↗
              </Link>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
            >
              {deleting ? 'Wird gelöscht ...' : 'Löschen'}
            </button>
          </div>
        </div>

        {messstelle.researchError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
            <strong>Fehler:</strong> {messstelle.researchError}
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">Stammdaten</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Titel', messstelle.titel],
            ['Verstoßart', VERSTOSS_LABELS[messstelle.verstossArt as keyof typeof VERSTOSS_LABELS]],
            ['Bundesland', messstelle.bundesland],
            ['Ort', messstelle.ort],
            ['Autobahn', messstelle.autobahn || '–'],
            ['Abschnitt', messstelle.abschnitt || '–'],
            ['Kilometer', messstelle.kilometer || '–'],
            ['Slug', messstelle.slug],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
              <dd className="text-gray-800 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* AI Research Results */}
      {messstelle.researchStatus === 'COMPLETED' && (
        <div className="space-y-4">
          {messstelle.beschreibung && (
            <Section title="Beschreibung" content={messstelle.beschreibung} />
          )}
          {messstelle.standortBeschreibung && (
            <Section title="Standort" content={messstelle.standortBeschreibung} />
          )}
          {messstelle.geraeteBeschreibung && (
            <Section title="Messgerät" content={messstelle.geraeteBeschreibung} />
          )}
          {messstelle.einspruchBeschreibung && (
            <Section title="Einspruchsmöglichkeiten" content={messstelle.einspruchBeschreibung} />
          )}
          {messstelle.behoerde && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Zuständige Bußgeldbehörde</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Name</dt>
                  <dd className="font-medium">{messstelle.behoerde.name}</dd>
                </div>
                {messstelle.behoerde.adresse && (
                  <div>
                    <dt className="text-xs text-gray-400">Adresse</dt>
                    <dd>{messstelle.behoerde.adresse}</dd>
                  </div>
                )}
                {messstelle.behoerde.telefon && (
                  <div>
                    <dt className="text-xs text-gray-400">Telefon</dt>
                    <dd>{messstelle.behoerde.telefon}</dd>
                  </div>
                )}
                {messstelle.behoerde.website && (
                  <div>
                    <dt className="text-xs text-gray-400">Website</dt>
                    <dd className="break-all text-[#003366]">{messstelle.behoerde.website}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
          {faq && faq.length > 0 && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">FAQ ({faq.length} Einträge)</h3>
              <dl className="space-y-3">
                {faq.map((item, i) => (
                  <div key={i} className="text-sm">
                    <dt className="font-medium text-gray-700">{item.frage}</dt>
                    <dd className="text-gray-600 mt-0.5 text-xs leading-relaxed">{item.antwort}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {bussgeldTabelle && bussgeldTabelle.length > 0 && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Bußgeldkatalog ({bussgeldTabelle.length} Einträge)</h3>
              <div className="overflow-x-auto">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Kategorie</th>
                      <th>Bußgeld (Innerorts)</th>
                      <th>Außerorts</th>
                      <th>Punkte</th>
                      <th>Fahrverbot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bussgeldTabelle.map((row, i) => (
                      <tr key={i}>
                        <td>{row.kategorie}</td>
                        <td>{row.innerorts || '–'}</td>
                        <td>{row.ausserorts || '–'}</td>
                        <td>{row.punkte || '–'}</td>
                        <td>{row.fahrverbot || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {(messstelle.researchStatus === 'PENDING' || messstelle.researchStatus === 'RESEARCHING') && (
        <div className="bg-white rounded border border-gray-200 p-10 text-center">
          <div className="w-10 h-10 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">KI-Agent recherchiert ...</p>
          <p className="text-sm text-gray-400">
            Der AI-Agent sammelt gerade alle Informationen zur Messstelle.
            Diese Seite aktualisiert sich automatisch.
          </p>
        </div>
      )}
    </div>
  )
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
    </div>
  )
}
