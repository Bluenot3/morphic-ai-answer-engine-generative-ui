'use client'

import { useState } from 'react'

const MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'google/gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'groq/llama-3.1-70b-versatile', label: 'Llama 3.1 70B' }
]

export default function RerunWithModel({
  onRun
}: {
  onRun: (model: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
        onClick={() => setOpen(o => !o)}
        title="Re-run with another model"
        type="button"
      >
        Re-run
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-white/10 bg-black/80 p-1 backdrop-blur">
          {MODELS.map(m => (
            <button
              key={m.id}
              className="w-full rounded-md px-2 py-1 text-left text-xs hover:bg-white/10"
              onClick={() => {
                setOpen(false)
                onRun(m.id)
              }}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
