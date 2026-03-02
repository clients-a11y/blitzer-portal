import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VERSTOSS_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string; page?: string; imported?: string }>
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  RESEARCHING: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
  FAILED: 'Fehlgeschlagen',
}

const statusClasses: Record<string, string> = {
  PENDING: 'status-pending',
  RESEARCHING: 'status-researching',
  COMPLETED: 'status-completed',
  FAILED: 'status-failed',
}

export default async function AdminMessstellenPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status
  const page = parseInt(params.page || '1')
  const importedCount = params.imported ? parseInt(params.imported) : null
  const limit = 25

  const where: Record<string, unknown> = {}
  if (statusFilter) where.researchStatus = statusFilter

  const [messstellen, total] = await Promise.all([
    prisma.messstelle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { behoerde: { select: { name: true } } },
    }),
    prisma.messstelle.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      {importedCount !== null && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm text-green-800">
          <strong>{importedCount} Messstelle{importedCount !== 1 ? 'n' : ''}</strong> erfolgreich importiert — die Recherche läuft im Hintergrund.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messstellen</h1>
          <p className="text-sm text-gray-500 mt-1">{total} Einträge gesamt</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/messstellen/import"
            className="bg-white text-[#003366] border border-[#003366] px-4 py-2 text-sm font-medium rounded hover:bg-blue-50 transition-colors"
          >
            XML importieren
          </Link>
          <Link
            href="/admin/messstellen/neu"
            className="bg-[#003366] text-white px-4 py-2 text-sm font-medium rounded hover:bg-[#002244] transition-colors flex items-center gap-2"
          >
            <span>+</span> Neue Messstelle
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { label: 'Alle', value: undefined },
          { label: 'Ausstehend', value: 'PENDING' },
          { label: 'In Bearbeitung', value: 'RESEARCHING' },
          { label: 'Abgeschlossen', value: 'COMPLETED' },
          { label: 'Fehler', value: 'FAILED' },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/messstellen?status=${f.value}` : '/admin/messstellen'}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap border transition-colors ${
              statusFilter === f.value || (!statusFilter && !f.value)
                ? 'bg-[#003366] text-white border-[#003366]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#003366]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Titel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Verstoß</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Bundesland</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Behörde</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Datum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messstellen.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-xs">{m.titel}</div>
                    <div className="text-xs text-gray-400 sm:hidden">
                      {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-600">
                      {VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">{m.bundesland}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusClasses[m.researchStatus]}`}>
                      {statusLabels[m.researchStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                    {m.behoerde?.name || '–'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/messstellen/${m.id}`}
                        className="text-xs text-[#003366] hover:underline"
                      >
                        Bearbeiten
                      </Link>
                      {m.istVeroeffentlicht && (
                        <Link
                          href={`/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`}
                          target="_blank"
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          ↗
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {messstellen.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Keine Messstellen gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">
              Seite {page} von {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/messstellen?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:border-[#003366] transition-colors"
                >
                  Zurück
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/messstellen?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:border-[#003366] transition-colors"
                >
                  Weiter
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
