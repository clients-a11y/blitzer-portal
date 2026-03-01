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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
