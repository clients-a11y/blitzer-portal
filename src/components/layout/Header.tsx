'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Menu, X, Zap } from 'lucide-react'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setMobileMenuOpen(false)
    }
  }

  const navLinks = [
    { href: '/', label: 'Startseite' },
    { href: '/messstellen', label: 'Messstellen' },
    { href: '/suche', label: 'Suche' },
    { href: '/bussgeldbehoerden', label: 'Bußgeldbehörden' },
  ]

  return (
    <header role="banner" className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="container-gov">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-800 transition-colors">
              <Zap className="w-5 h-5 text-amber-400" fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <div className="text-slate-900 font-bold text-base leading-tight">Blitzer-Portal</div>
              <div className="text-slate-400 text-xs font-medium leading-none">Deutschland</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            role="navigation"
            aria-label="Hauptnavigation"
            className="hidden md:flex items-center gap-0.5 flex-1"
          >
            {navLinks.map(({ href, label }) => {
              const isActive =
                pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-slate-300 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-sm transition-all"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Messstelle suchen ..."
              aria-label="Messstellen suchen"
              className="px-3.5 py-2 text-sm outline-none bg-transparent w-52 text-slate-700 placeholder-slate-400"
            />
            <button
              type="submit"
              className="px-3 py-2 text-slate-400 hover:text-blue-700 transition-colors"
              aria-label="Suchen"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 ml-auto md:hidden">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Suche öffnen"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Navigation öffnen"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-all"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Messstelle, Autobahn, Ort ..."
                className="flex-1 px-4 py-3 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-3 bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-100 py-3">
            <ul className="space-y-0.5" role="list">
              {navLinks.map(({ href, label }) => {
                const isActive =
                  pathname === href || (href !== '/' && pathname.startsWith(href))
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block px-3 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
