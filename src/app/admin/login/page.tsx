'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-Mail oder Passwort ungültig.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#003366] text-white p-6 rounded-t text-center">
          <div className="w-12 h-12 bg-[#f0b429] rounded mx-auto mb-3 flex items-center justify-center">
            <span className="text-[#1a1a2e] text-xl font-black">B</span>
          </div>
          <h1 className="text-lg font-bold">Blitzer-Portal</h1>
          <p className="text-blue-200 text-sm">Admin-Anmeldung</p>
        </div>
        <div className="bg-white border border-gray-200 border-t-0 rounded-b p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#003366]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#003366]"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003366] text-white py-2.5 text-sm font-semibold rounded hover:bg-[#002244] transition-colors disabled:opacity-60"
            >
              {loading ? 'Anmelden ...' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
