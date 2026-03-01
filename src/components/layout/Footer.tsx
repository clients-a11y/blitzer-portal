import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer role="contentinfo" className="bg-slate-900 text-slate-400 mt-16">
      <div className="container-gov py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" fill="currentColor" />
              </div>
              <span className="text-white font-bold text-sm">Blitzer-Portal</span>
            </div>
            <p className="text-sm leading-relaxed">
              Das Informationsportal für Blitzer-Messstellen in Deutschland.
              Detaillierte Informationen zu Verstößen und Bußgeldern.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Startseite
                </Link>
              </li>
              <li>
                <Link href="/messstellen" className="hover:text-white transition-colors">
                  Messstellen
                </Link>
              </li>
              <li>
                <Link href="/suche" className="hover:text-white transition-colors">
                  Suche
                </Link>
              </li>
              <li>
                <Link href="/bussgeldbehoerden" className="hover:text-white transition-colors">
                  Bußgeldbehörden
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Kategorien</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/messstellen?verstossArt=GESCHWINDIGKEIT"
                  className="hover:text-white transition-colors"
                >
                  Geschwindigkeitsmessung
                </Link>
              </li>
              <li>
                <Link
                  href="/messstellen?verstossArt=ABSTAND"
                  className="hover:text-white transition-colors"
                >
                  Abstandsmessung
                </Link>
              </li>
              <li>
                <Link
                  href="/messstellen?verstossArt=ROTLICHT"
                  className="hover:text-white transition-colors"
                >
                  Rotlichtüberwachung
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Rechtliches</h3>
            <ul className="space-y-2.5 text-sm">
              <li><span className="text-slate-600 cursor-default">Impressum</span></li>
              <li><span className="text-slate-600 cursor-default">Datenschutz</span></li>
              <li><span className="text-slate-600 cursor-default">Haftungsausschluss</span></li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin-Bereich
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <p>© {currentYear} Blitzer-Portal Deutschland. Alle Angaben ohne Gewähr.</p>
          <p>Informationen dienen ausschließlich allgemeinen Informationszwecken.</p>
        </div>
      </div>
    </footer>
  )
}
