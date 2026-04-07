import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Central — Gestão de Propriedades',
  description: 'SaaS de gestão de propriedades de curta temporada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
