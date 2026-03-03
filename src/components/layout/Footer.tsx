import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer role="contentinfo" className="bg-slate-950 text-slate-400 mt-0">
      <div className="container-gov py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">Blitzer-Portal</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Das Informationsportal für Blitzer-Messstellen in Deutschland.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/', label: 'Startseite' },
                { href: '/messstellen', label: 'Messstellen' },
                { href: '/bussgeldbehoerden', label: 'Bußgeldbehörden' },
                { href: '/suche', label: 'Suche' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-500 hover:text-white transition-colors duration-200 cursor-pointer"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kategorien */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
              Kategorien
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/messstellen?verstossArt=GESCHWINDIGKEIT', label: 'Geschwindigkeit' },
                { href: '/messstellen?verstossArt=ABSTAND', label: 'Abstand' },
                { href: '/messstellen?verstossArt=ROTLICHT', label: 'Rotlicht' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-500 hover:text-white transition-colors duration-200 cursor-pointer"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
              Rechtliches
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><span className="text-slate-700 cursor-default">Impressum</span></li>
              <li><span className="text-slate-700 cursor-default">Datenschutz</span></li>
              <li><span className="text-slate-700 cursor-default">Haftungsausschluss</span></li>
              <li>
                <Link
                  href="/admin"
                  className="text-slate-500 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  Admin-Bereich
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-600">
            © {currentYear} Blitzer-Portal Deutschland. Alle Angaben ohne Gewähr.
          </p>
          <p className="text-xs text-slate-700">
            Informationen dienen ausschließlich allgemeinen Informationszwecken.
          </p>
        </div>
      </div>
    </footer>
  )
}
