import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer role="contentinfo" className="bg-[#1a1a2e] text-gray-300 mt-16">
      <div className="container-gov py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Blitzer-Portal
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Das Informationsportal für Blitzer-Messstellen in Deutschland.
              Detaillierte Informationen zu Verstößen und Bußgeldern.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Startseite</Link></li>
              <li><Link href="/messstellen" className="hover:text-white transition-colors">Messstellen</Link></li>
              <li><Link href="/suche" className="hover:text-white transition-colors">Suche</Link></li>
              <li><Link href="/bussgeldbehoerden" className="hover:text-white transition-colors">Bußgeldbehörden</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Informationen
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/messstellen?verstossArt=GESCHWINDIGKEIT" className="hover:text-white transition-colors">Geschwindigkeitsmessung</Link></li>
              <li><Link href="/messstellen?verstossArt=ABSTAND" className="hover:text-white transition-colors">Abstandsmessung</Link></li>
              <li><Link href="/messstellen?verstossArt=ROTLICHT" className="hover:text-white transition-colors">Rotlichtüberwachung</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Rechtliches
            </h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500">Impressum</span></li>
              <li><span className="text-gray-500">Datenschutz</span></li>
              <li><span className="text-gray-500">Haftungsausschluss</span></li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin-Bereich
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>
            © {currentYear} Blitzer-Portal Deutschland. Alle Angaben ohne Gewähr.
          </p>
          <p>
            Informationen dienen ausschließlich allgemeinen Informationszwecken.
          </p>
        </div>
      </div>
    </footer>
  )
}
