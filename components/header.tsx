'use client'

import React from 'react'
import { User } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'

import GuestMenu from './guest-menu'
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { open } = useSidebar()

  return (
    <header
      className={cn(
        // sticky + glass header
        'glass-header flex justify-between items-center z-30 px-4 py-2 transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full'
      )}
    >
      {/* Left: Glowing Z + Title */}
      <div className="flex items-center gap-3">
        {/* Prefer renaming your file to /public/zen-logo.png. If you keep spaces, encode them below */}
        <img
          src="/ZEN%20AI%20.png" 
          alt="ZEN Edge"
          width={36}
          height={36}
          className="logo-glow rounded-md"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] uppercase tracking-[0.18em] text-emerald-300/90">
            ZEN
          </span>
          <span className="text-base md:text-lg font-semibold">
            ZEN Edge — Generative Answers
          </span>
        </div>
      </div>

      {/* Right: capability chips + auth */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">
          <span className="chip">Multi-Model</span>
          <span className="chip">Search-Grounded</span>
          <span className="chip">Edge Streaming</span>
        </div>

        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
