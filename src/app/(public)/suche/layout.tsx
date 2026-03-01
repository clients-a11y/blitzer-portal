import { Suspense } from 'react'

export default function SucheLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="container-gov py-8 text-gray-500">Wird geladen ...</div>}>{children}</Suspense>
}
