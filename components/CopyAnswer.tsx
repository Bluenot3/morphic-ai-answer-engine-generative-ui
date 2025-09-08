'use client'

import { useState } from 'react'

export default function CopyAnswer({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {}
      }}
      className={`rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 ${className}`}
      aria-label="Copy answer"
      title="Copy answer"
      type="button"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
