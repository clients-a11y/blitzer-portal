'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ParsedEntry {
  verstossOrt: string
  verstossArt: string
  valid: boolean
  error?: string
}

const VALID_VERSTOSS_ARTEN = ['GESCHWINDIGKEIT', 'ABSTAND', 'ROTLICHT']

const VERSTOSS_LABELS: Record<string, string> = {
  GESCHWINDIGKEIT: 'Geschwindigkeit',
  ABSTAND: 'Abstand',
  ROTLICHT: 'Rotlicht',
}

const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<messstellen>
  <messstelle>
    <verstossOrt>A1 bei Köln, Nordrhein-Westfalen</verstossOrt>
    <verstossArt>GESCHWINDIGKEIT</verstossArt>
  </messstelle>
  <messstelle>
    <verstossOrt>A9 München Süd, Bayern</verstossOrt>
    <verstossArt>ABSTAND</verstossArt>
  </messstelle>
  <messstelle>
    <verstossOrt>B2 Berlin Mitte</verstossOrt>
    <verstossArt>ROTLICHT</verstossArt>
  </messstelle>
</messstellen>`

function parseXmlPreview(xml: string): ParsedEntry[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) return []

  const entries: ParsedEntry[] = []
  doc.querySelectorAll('messstelle').forEach((node) => {
    const ort = node.querySelector('verstossOrt')?.textContent?.trim() || ''
    const art = node.querySelector('verstossArt')?.textContent?.trim() || ''

    if (!ort) {
      entries.push({ verstossOrt: '(leer)', verstossArt: art, valid: false, error: 'Verstoßort fehlt' })
    } else if (!VALID_VERSTOSS_ARTEN.includes(art)) {
      entries.push({ verstossOrt: ort, verstossArt: art, valid: false, error: `Ungültige Verstoßart: "${art}"` })
    } else {
      entries.push({ verstossOrt: ort, verstossArt: art, valid: true })
    }
  })

  return entries
}

export default function ImportPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedEntry[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    setFile(f)
    setParseError(null)
    setImportError(null)

    if (!f.name.endsWith('.xml')) {
      setParseError('Bitte eine .xml-Datei auswählen.')
      setPreview(null)
      return
    }

    const text = await f.text()
    const parsed = parseXmlPreview(text)

    if (parsed.length === 0) {
      setParseError('Keine <messstelle>-Einträge in der Datei gefunden oder ungültiges XML.')
      setPreview(null)
    } else {
      setPreview(parsed)
    }
  }

  const handleImport = async () => {
    if (!file || !preview) return

    const validCount = preview.filter((p) => p.valid).length
    if (validCount === 0) {
      setImportError('Keine gültigen Einträge zum Importieren.')
      return
    }

    setImporting(true)
    setImportError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/messstellen/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Import fehlgeschlagen')

      router.push(`/admin/messstellen?imported=${data.count}`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen')
      setImporting(false)
    }
  }

  const validCount = preview?.filter((p) => p.valid).length ?? 0
  const invalidCount = preview?.filter((p) => !p.valid).length ?? 0

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/messstellen" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">XML-Import</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Mehrere Messstellen aus einer XML-Datei importieren und automatisch recherchieren lassen
          </p>
        </div>
      </div>

      {/* Format-Hinweis */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm">
        <p className="font-medium text-blue-800 mb-2">Erwartetes XML-Format:</p>
        <pre className="text-blue-700 text-xs bg-blue-100 rounded p-3 overflow-x-auto whitespace-pre">
          {EXAMPLE_XML}
        </pre>
        <p className="text-blue-600 mt-2 text-xs">
          Gültige Verstoßarten:{' '}
          <code className="bg-blue-100 px-1 rounded">GESCHWINDIGKEIT</code>,{' '}
          <code className="bg-blue-100 px-1 rounded">ABSTAND</code>,{' '}
          <code className="bg-blue-100 px-1 rounded">ROTLICHT</code>
        </p>
      </div>

      {/* Datei-Upload */}
      <div className="bg-white border border-gray-200 rounded p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">XML-Datei auswählen</label>
        <input
          ref={inputRef}
          type="file"
          accept=".xml"
          onChange={handleFile}
          className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
            file:text-sm file:font-medium file:bg-[#003366] file:text-white
            hover:file:bg-[#002244] file:cursor-pointer cursor-pointer"
        />
        {parseError && (
          <p className="mt-2 text-xs text-red-600">{parseError}</p>
        )}
      </div>

      {/* Vorschau */}
      {preview !== null && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              Vorschau — {preview.length} {preview.length === 1 ? 'Eintrag' : 'Einträge'}
            </span>
            <div className="flex gap-4 text-xs">
              {validCount > 0 && (
                <span className="text-green-600 font-medium">{validCount} gültig</span>
              )}
              {invalidCount > 0 && (
                <span className="text-red-500 font-medium">{invalidCount} ungültig</span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {preview.map((entry, i) => (
              <div
                key={i}
                className={`px-4 py-3 flex items-start gap-3 text-sm ${
                  entry.valid ? '' : 'bg-red-50'
                }`}
              >
                <span className={`text-base leading-none mt-0.5 ${entry.valid ? 'text-green-500' : 'text-red-400'}`}>
                  {entry.valid ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{entry.verstossOrt}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {VERSTOSS_LABELS[entry.verstossArt] || entry.verstossArt}
                    {entry.error && (
                      <span className="ml-2 text-red-500">— {entry.error}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {importError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
          {importError}
        </div>
      )}

      {preview !== null && (
        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            disabled={importing || validCount === 0}
            className="bg-[#003366] text-white px-6 py-2.5 text-sm font-medium rounded
              hover:bg-[#002244] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2"
          >
            {importing ? (
              <>
                <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importiere & starte Recherche…
              </>
            ) : (
              `${validCount} Messstelle${validCount !== 1 ? 'n' : ''} importieren`
            )}
          </button>

          {invalidCount > 0 && (
            <p className="text-xs text-gray-500">
              {invalidCount} ungültige{' '}
              {invalidCount === 1 ? 'Eintrag wird' : 'Einträge werden'} übersprungen
            </p>
          )}
        </div>
      )}
    </div>
  )
}
