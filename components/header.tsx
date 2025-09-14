/* eslint-disable simple-import-sort/imports */
'use client'

import React from 'react'
import type { User } from '@supabase/supabase-js'

import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()

  return (
    <header
      className={cn(
        // fixed glass header that respects safe-area and global header height
        'fixed left-0 right-0 z-50 glass-header flex items-center justify-between px-4 transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full',
      )}
      style={{ top: 'var(--safe-top, 0)', height: 'var(--header-h)' }}
      role="banner"
    >
      {/* Left: ZEN branding */}
      <div className="flex items-center gap-3">
        <div className="leading-none">
          <span
            className={cn(
              'text-lg md:text-xl font-semibold tracking-tight',
              'bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent',
              'drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]',
              'logo-glow', // subtle glowing animation
            )}
            aria-label="ZEN"
          >
            ZEN
          </span>
          <span className="ml-2 hidden text-sm text-white/70 md:inline">
            Edge — Generative Answers
          </span>
        </div>
      </div>

      {/* Right: capability chips + auth menu */}
      <div className="flex items-center gap-4">
        {/* Capability chips */}
        <div className="flex max-w-[50vw] items-center gap-2 overflow-x-auto md:max-w-none md:overflow-visible">
          <span className="chip whitespace-nowrap">Multi-Model</span>
          <span className="chip whitespace-nowrap">Search-Grounded</span>
          <span className="chip whitespace-nowrap">Edge Streaming</span>
        </div>

        {/* Auth menus */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {user ? <UserMenu user={user} /> : <GuestMenu />}
        </div>
      </div>
    </header>
  )
}

export default Header
