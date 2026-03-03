'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Menu, X, Zap, ArrowRight } from 'lucide-react'

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
    { href: '/bussgeldbehoerden', label: 'Behörden' },
    { href: '/suche', label: 'Suche' },
  ]

  return (
    <header role="banner" className="sticky top-0 z-50 px-4 py-3">
      <div className="max-w-[1200px] mx-auto">
        {/* Floating nav card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/60">
          <div className="flex items-center h-14 px-4 gap-3">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
              aria-label="Blitzer-Portal Startseite"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors duration-200">
                <Zap className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <div className="hidden sm:block">
                <div className="text-slate-900 font-bold text-sm leading-tight tracking-tight">
                  Blitzer-Portal
                </div>
                <div className="text-slate-400 text-[10px] font-medium leading-none">Deutschland</div>
              </div>
            </Link>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-slate-200 mx-1" />

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
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
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
              className="hidden md:flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50 hover:border-slate-300 focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-sm transition-all duration-200 px-3 py-2"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Messstelle suchen ..."
                aria-label="Messstellen suchen"
                className="text-sm outline-none bg-transparent w-44 text-slate-700 placeholder-slate-400"
              />
            </form>

            {/* Desktop CTA */}
            <Link
              href="/messstellen"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-white font-semibold bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap cursor-pointer flex-shrink-0"
            >
              Alle Blitzer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile controls */}
            <div className="flex items-center gap-1 ml-auto md:hidden">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors duration-200 cursor-pointer"
                aria-label="Suche öffnen"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors duration-200 cursor-pointer"
                aria-expanded={mobileMenuOpen}
                aria-label="Navigation öffnen"
              >
                {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <div className="md:hidden border-t border-slate-100 px-4 py-3">
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 border border-slate-200 rounded-xl bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-all duration-200 px-3 py-2"
              >
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Autobahn, Ort, Bundesland ..."
                  className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                >
                  Suchen
                </button>
              </form>
            </div>
          )}

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <nav
              className="md:hidden border-t border-slate-100 px-3 py-2"
              aria-label="Mobile Navigation"
            >
              <ul className="space-y-0.5" role="list">
                {navLinks.map(({ href, label }) => {
                  const isActive =
                    pathname === href || (href !== '/' && pathname.startsWith(href))
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`block px-3 py-2.5 text-sm rounded-xl font-medium transition-colors duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
                <li className="pt-1">
                  <Link
                    href="/messstellen"
                    className="flex items-center justify-center gap-1.5 text-sm text-white font-semibold bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Alle Blitzer anzeigen
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
