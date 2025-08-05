import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Airsoft AR - Battle Proximity',
  description: 'Game PVP airsoft augmented reality yang seru dan menantang',
  keywords: 'airsoft, AR, augmented reality, game, PVP, battle',
  authors: [{ name: 'Airsoft AR Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 min-h-screen`}>
        {children}
      </body>
    </html>
  )
} 