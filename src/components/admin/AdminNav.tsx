'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/messstellen', label: 'Messstellen' },
    { href: '/admin/behoerden', label: 'Behörden' },
  ]

  return (
    <header className="bg-[#003366] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-sm tracking-wide flex items-center gap-2">
              <div className="w-6 h-6 bg-[#f0b429] rounded flex items-center justify-center">
                <span className="text-[#1a1a2e] text-xs font-black">B</span>
              </div>
              Admin-Portal
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    pathname === link.href
                      ? 'bg-white/20 font-semibold'
                      : 'hover:bg-white/10 text-blue-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200 hidden sm:block">{userName}</span>
            <Link
              href="/"
              target="_blank"
              className="text-xs text-blue-200 hover:text-white transition-colors hidden sm:block"
            >
              Website ↗
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
