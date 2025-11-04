import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'AI Church Slide Builder - Beautiful Worship & Teaching Slides',
  description: 'Create stunning church presentation slides instantly with AI. Auto-layout from sermon notes, editable designs, export to PNG, PDF, or PPTX.',
  keywords: 'church slides, worship slides, sermon slides, presentation maker, church graphics, AI slides',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
