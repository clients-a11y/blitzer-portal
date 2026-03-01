import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminBehoerdenPage() {
  const behoerden = await prisma.behoerde.findMany({
    orderBy: [{ bundesland: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { messstellen: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bußgeldbehörden</h1>
          <p className="text-sm text-gray-500 mt-1">
            {behoerden.length} Behörden (automatisch vom AI-Agent erfasst)
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-700">
        Behörden werden automatisch beim Anlegen von Messstellen durch den AI-Agenten erkannt und hier eingetragen.
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Bundesland</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Stadt</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Messstellen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Erstellt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {behoerden.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.name}</div>
                    {b.telefon && <div className="text-xs text-gray-400">{b.telefon}</div>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-600">{b.bundesland}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">{b.stadt || '–'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {b._count.messstellen}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {formatDate(b.createdAt)}
                  </td>
                </tr>
              ))}
              {behoerden.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Noch keine Behörden eingetragen.{' '}
                    <Link href="/admin/messstellen/neu" className="text-[#003366] hover:underline">
                      Erste Messstelle anlegen
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
