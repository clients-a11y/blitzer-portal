import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Blitzer-Portal Deutschland',
    default: 'Blitzer-Portal Deutschland – Messstellen & Bußgeldinformationen',
  },
  description:
    'Das offizielle Informationsportal zu Blitzer-Messstellen in Deutschland. Detaillierte Informationen zu Geschwindigkeits-, Abstands- und Rotlichtverstößen, Bußgeldbehörden und Einspruchsmöglichkeiten.',
  keywords: [
    'Blitzer',
    'Messstelle',
    'Geschwindigkeit',
    'Bußgeld',
    'Radarfalle',
    'Tempoüberschreitung',
    'Einspruch',
    'Bußgeldbehörde',
    'Deutschland',
    'Verkehrskontrolle',
  ],
  authors: [{ name: 'Blitzer-Portal Deutschland' }],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Blitzer-Portal Deutschland',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
