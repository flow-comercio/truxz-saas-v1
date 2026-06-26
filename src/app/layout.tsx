import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'TRUXZ', template: '%s | TRUXZ' },
  description: 'Street Motorsport Management — gestão para negócios automotivos',
  manifest: '/manifest.json',
  icons: { icon: '/logo-truxz.png', apple: '/logo-truxz.png' },
}

export const viewport: Viewport = {
  themeColor: '#080612',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(14,11,28,0.95)',
                backdropFilter: 'blur(20px)',
                color: '#fff',
                border: '1px solid rgba(157,78,221,0.3)',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                borderRadius: '16px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
