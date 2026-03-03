'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Menu, X, Zap } from 'lucide-react'

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  const navLinks = [
    { href: '/messstellen', label: 'Messstellen' },
    { href: '/bussgeldbehoerden', label: 'Behörden' },
    { href: '/suche', label: 'Suche' },
  ]

  return (
    <header role="banner" className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="container-gov">
        <div className="flex items-center h-14 gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 group cursor-pointer"
            aria-label="Blitzer-Portal Startseite"
          >
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors duration-200">
              <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <span className="text-slate-900 font-bold text-sm leading-none">Blitzer-Portal</span>
              <span className="text-slate-400 text-[10px] font-medium ml-1">Deutschland</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-slate-200 flex-shrink-0" aria-hidden="true" />

          {/* Desktop Navigation */}
          <nav
            role="navigation"
            aria-label="Hauptnavigation"
            className="hidden md:flex items-center gap-0.5 flex-shrink-0"
          >
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
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
            className="hidden md:flex items-center gap-2 border border-slate-200 rounded-lg bg-slate-50 hover:border-slate-300 focus-within:border-indigo-400 focus-within:bg-white transition-all duration-200 px-3 py-1.5 flex-1 max-w-xs ml-auto"
            role="search"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Messstelle suchen …"
              aria-label="Messstellen suchen"
              className="text-sm outline-none bg-transparent flex-1 text-slate-700 placeholder-slate-400"
            />
          </form>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden ml-auto p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-150 cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label="Navigation öffnen"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="container-gov py-3 space-y-1">
            {/* Mobile search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 border border-slate-200 rounded-lg bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white transition-all duration-200 px-3 py-2 mb-2"
              role="search"
            >
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Messstelle suchen …"
                className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-150 cursor-pointer"
              >
                Suchen
              </button>
            </form>

            {/* Mobile nav links */}
            <nav aria-label="Mobile Navigation">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`block px-3 py-2.5 text-sm rounded-lg font-medium transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
