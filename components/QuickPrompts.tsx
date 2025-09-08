'use client'

const PRESETS = [
  'Summarize this into 5 bullets',
  'Explain like I’m 12',
  'Pros and cons in a table',
  'Give 3 options with tradeoffs',
  'Create an action plan in 6 steps'
]

export default function QuickPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {PRESETS.map(p => (
        <button
          key={p}
          onClick={() => onPick(p)}
          className="chip"
          type="button"
          aria-label={p}
          title={p}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
