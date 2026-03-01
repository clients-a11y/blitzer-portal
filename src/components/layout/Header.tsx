'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header role="banner">
      {/* Top Government Bar */}
      <div className="bg-[#003366] text-white">
        <div className="container-gov">
          <div className="flex items-center justify-between py-2 text-xs">
            <span className="font-medium tracking-wide">
              BLITZER-PORTAL DEUTSCHLAND
            </span>
            <span className="hidden sm:block text-blue-200">
              Informationsportal zu Messstellen und Verkehrskontrollen
            </span>
          </div>
        </div>
      </div>

      {/* Logo & Search Bar */}
      <div className="bg-white border-b-2 border-[#f0b429]">
        <div className="container-gov">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-[#003366] rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div>
                <div className="text-[#003366] font-bold text-lg leading-tight">Blitzer-Portal</div>
                <div className="text-gray-500 text-xs">Deutschland</div>
              </div>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-xl">
              <div className="flex border-2 border-[#003366] rounded overflow-hidden">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Messstelle, Autobahn, Ort oder Bundesland suchen ..."
                  aria-label="Messstellen suchen"
                  className="flex-1 px-4 py-2.5 text-sm outline-none bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#003366] text-white text-sm font-medium hover:bg-[#002244] transition-colors flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <span className="hidden sm:inline">Suchen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav role="navigation" aria-label="Hauptnavigation" className="bg-[#004080] text-white">
        <div className="container-gov">
          <div className="flex items-center justify-between">
            <ul className="hidden md:flex" role="list">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium hover:bg-[#003366] transition-colors border-b-2 border-transparent hover:border-[#f0b429]"
                >
                  Startseite
                </Link>
              </li>
              <li>
                <Link
                  href="/messstellen"
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium hover:bg-[#003366] transition-colors border-b-2 border-transparent hover:border-[#f0b429]"
                >
                  Messstellen
                </Link>
              </li>
              <li>
                <Link
                  href="/suche"
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium hover:bg-[#003366] transition-colors border-b-2 border-transparent hover:border-[#f0b429]"
                >
                  Suche
                </Link>
              </li>
              <li>
                <Link
                  href="/bussgeldbehoerden"
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium hover:bg-[#003366] transition-colors border-b-2 border-transparent hover:border-[#f0b429]"
                >
                  Bußgeldbehörden
                </Link>
              </li>
            </ul>

            {/* Mobile menu button */}
            <button
              className="md:hidden px-4 py-3 text-sm font-medium flex items-center gap-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Navigation öffnen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
              Menü
            </button>
          </div>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <ul className="md:hidden border-t border-blue-700 py-2" role="list">
              {[
                ['/', 'Startseite'],
                ['/messstellen', 'Messstellen'],
                ['/suche', 'Suche'],
                ['/bussgeldbehoerden', 'Bußgeldbehörden'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="block px-4 py-3 text-sm hover:bg-[#003366] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </header>
  )
}
