'use client'

import { useEffect, useState } from 'react'

import { Globe } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getCookie, setCookie } from '@/lib/utils/cookies'

import { Toggle } from './ui/toggle'

export function SearchModeToggle() {
  const [isSearchMode, setIsSearchMode] = useState(true)

  useEffect(() => {
    const savedMode = getCookie('search-mode')
    if (savedMode !== null) {
      setIsSearchMode(savedMode === 'true')
    } else {
      setCookie('search-mode', 'true')
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail
      if (detail && typeof detail.enabled === 'boolean') {
        setIsSearchMode(detail.enabled)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('zen:search-mode-changed', handler as EventListener)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'zen:search-mode-changed',
          handler as EventListener
        )
      }
    }
  }, [])

  const handleSearchModeChange = (pressed: boolean) => {
    setIsSearchMode(pressed)
    setCookie('search-mode', pressed.toString())
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zen:search-mode-changed', {
          detail: { enabled: pressed }
        })
      )
    }
  }

  return (
    <Toggle
      aria-label="Toggle search mode"
      pressed={isSearchMode}
      onPressedChange={handleSearchModeChange}
      variant="outline"
      className={cn(
        'gap-1 px-3 border border-input text-muted-foreground bg-background',
        'data-[state=on]:bg-accent-blue',
        'data-[state=on]:text-accent-blue-foreground',
        'data-[state=on]:border-accent-blue-border',
        'hover:bg-accent hover:text-accent-foreground rounded-full'
      )}
    >
      <Globe className="size-4" />
      <span className="text-xs">Search</span>
    </Toggle>
  )
}
