import type { Metadata, Viewport } from 'next'
import { Inter as FontSans } from 'next/font/google'

import { Analytics } from '@vercel/analytics/next'

import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

import AppSidebar from '@/components/app-sidebar'
import ArtifactRoot from '@/components/artifact/artifact-root'
import Header from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

/** ZEN Edge branding */
const title = 'ZEN Edge'
const description =
  'Search-grounded, multi-model AI answers. Built on Vercel AI, tuned for ZEN.'

export const metadata: Metadata = {
  // Update to your live domain if different
  metadataBase: new URL('https://arena.zenai.world'),
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://arena.zenai.world',
    siteName: 'ZEN Edge',
    images: [
      // Use your uploaded asset from /public
      { url: '/ZENAI.png', width: 1200, height: 630, alt: 'ZEN Edge' },
    ],
    type: 'website',
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    images: ['/ZENAI.png'],
    // creator: '@zenai' // optional: set your handle
  },
  icons: { icon: '/favicon.ico' }, // safe if you have one; otherwise remove
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  // Next.js 15: themeColor belongs in viewport (not metadata)
  themeColor: '#10B981', // ZEN emerald
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()
    user = supabaseUser
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen flex flex-col font-sans antialiased',
          // Powerful, state-of-the-art but non-breaking global look:
          // cinematic gradient + crisp white text + emerald selection highlight
          'bg-gradient-to-b from-black via-slate-950 to-black text-white selection:bg-emerald-500/30 selection:text-white',
          fontSans.variable,
        )}
      >
        {/* Subtle ambient effects (purely visual; won’t touch layout) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 [background-image:radial-gradient(50%_40%_at_50%_0%,rgba(16,185,129,0.20),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(50%_50%_at_50%_50%,black,transparent)]"
        />

        {/* Tasteful capability badge (can remove anytime) */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center">
          <div className="pointer-events-auto mt-4 rounded-full border border-emerald-500/30 bg-black/60 px-3 py-1 text-[11px] uppercase tracking-wide text-emerald-300 backdrop-blur">
            ZEN Edge • Multi-Model • Search-Grounded • Edge Streaming
          </div>
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <Header user={user} />
              <main className="flex flex-1 min-h-0">
                <ArtifactRoot>{children}</ArtifactRoot>
              </main>
            </div>
          </SidebarProvider>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
