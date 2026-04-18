import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Macro Tracker - Travel Nutrition',
  description: 'Track your macros on the go',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
