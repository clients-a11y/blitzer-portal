import Link from 'next/link'
import { prisma } from '@/lib/db'
import { VERSTOSS_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const [
    totalMessstellen,
    pending,
    researching,
    completed,
    failed,
    recentMessstellen,
    behoerden,
  ] = await Promise.all([
    prisma.messstelle.count(),
    prisma.messstelle.count({ where: { researchStatus: 'PENDING' } }),
    prisma.messstelle.count({ where: { researchStatus: 'RESEARCHING' } }),
    prisma.messstelle.count({ where: { researchStatus: 'COMPLETED' } }),
    prisma.messstelle.count({ where: { researchStatus: 'FAILED' } }),
    prisma.messstelle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        titel: true,
        verstossArt: true,
        bundesland: true,
        researchStatus: true,
        istVeroeffentlicht: true,
        createdAt: true,
      },
    }),
    prisma.behoerde.count(),
  ])

  return { totalMessstellen, pending, researching, completed, failed, recentMessstellen, behoerden }
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  RESEARCHING: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
  FAILED: 'Fehlgeschlagen',
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const statusClasses: Record<string, string> = {
    PENDING: 'status-pending',
    RESEARCHING: 'status-researching',
    COMPLETED: 'status-completed',
    FAILED: 'status-failed',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Übersicht aller Messstellen und Aktivitäten</p>
        </div>
        <Link
          href="/admin/messstellen/neu"
          className="bg-[#003366] text-white px-4 py-2 text-sm font-medium rounded hover:bg-[#002244] transition-colors flex items-center gap-2"
        >
          <span>+</span> Neue Messstelle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Gesamt" value={data.totalMessstellen} color="text-gray-900" />
        <StatCard label="Ausstehend" value={data.pending} color="text-amber-700" />
        <StatCard label="In Arbeit" value={data.researching} color="text-blue-700" />
        <StatCard label="Fertig" value={data.completed} color="text-green-700" />
        <StatCard label="Fehler" value={data.failed} color="text-red-700" />
        <StatCard label="Behörden" value={data.behoerden} color="text-purple-700" />
      </div>

      {/* AI Research Status Banner */}
      {data.researching > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-blue-700">
            <strong>{data.researching}</strong> Messstelle{data.researching !== 1 ? 'n werden' : ' wird'} gerade vom AI-Agenten recherchiert ...
          </p>
        </div>
      )}
      {data.failed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-sm text-red-700">
            <strong>{data.failed}</strong> Messstelle{data.failed !== 1 ? 'n haben' : ' hat'} einen Fehler bei der Recherche.{' '}
            <Link href="/admin/messstellen?status=FAILED" className="underline">
              Jetzt ansehen
            </Link>
          </p>
        </div>
      )}

      {/* Recent Messstellen */}
      <div className="bg-white rounded border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Zuletzt eingetragene Messstellen</h2>
          <Link href="/admin/messstellen" className="text-sm text-[#003366] hover:underline">
            Alle anzeigen
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Messstelle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verstoßart</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Datum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentMessstellen.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-xs">{m.titel}</div>
                    <div className="text-xs text-gray-400">{m.bundesland}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{VERSTOSS_LABELS[m.verstossArt as keyof typeof VERSTOSS_LABELS]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusClasses[m.researchStatus]}`}>
                      {statusLabels[m.researchStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/messstellen/${m.id}`}
                      className="text-xs text-[#003366] hover:underline whitespace-nowrap"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
              {data.recentMessstellen.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Noch keine Messstellen eingetragen.{' '}
                    <Link href="/admin/messstellen/neu" className="text-[#003366] hover:underline">
                      Jetzt eintragen
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded border border-gray-200 p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
