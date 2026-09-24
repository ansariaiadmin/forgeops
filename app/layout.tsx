import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

// EasyMDE markdown editor styles (used by the project Memory tab).
import 'easymde/dist/easymde.min.css'

import { SessionProvider } from '@/components/session-provider'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'ForgeOps',
    template: '%s · ForgeOps',
  },
  description: 'ForgeOps — DevOps control plane for deployments, pipelines and environments.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
