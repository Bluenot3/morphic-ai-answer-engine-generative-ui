// app/layout.tsx
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
  metadataBase: new URL('https://arena.zenai.world'),
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://arena.zenai.world',
    siteName: 'ZEN Edge',
    images: [{ url: '/ZENAI.png', width: 1200, height: 630, alt: 'ZEN Edge' }],
    type: 'website',
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    images: ['/ZENAI.png'],
  },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: '#10B981', // ZEN emerald
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
          'bg-gradient-to-b from-black via-slate-950 to-black text-white selection:bg-emerald-500/30 selection:text-white',
          fontSans.variable,
        )}
      >
        {/* Ambient glow background (visual only) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 [background-image:radial-gradient(50%_40%_at_50%_0%,rgba(16,185,129,0.20),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(50%_50%_at_50%_50%,black,transparent)]"
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen>
            <AppSidebar />

            {/* Header is fixed via its own component */}
            <Header user={user} />

            <div className="flex flex-col flex-1">
              <main className="flex flex-1 min-h-0" data-avoid-overlap="true">
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
