'use client'

import { useMemo } from 'react'

// rough client-only estimates for UX (not billing)
const COSTS_PER_1K = {
  'openai/gpt-4o-mini': 0.15,
  'anthropic/claude-3-5-sonnet': 3.0,
  'google/gemini-1.5-flash': 0.05,
  'groq/llama-3.1-70b-versatile': 0.0
}

export default function InputMetrics({ text, model }: { text: string; model: string }) {
  const { words, tokens, cost } = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const tokens = Math.round(words * 1.3)
    const per1k = COSTS_PER_1K[model as keyof typeof COSTS_PER_1K] ?? 0
    const cost = (tokens / 1000) * per1k
    return { words, tokens, cost }
  }, [text, model])

  return (
    <div className="mt-1 flex items-center justify-between text-[11px] text-white/60">
      <div>{words} words · ~{tokens} tokens</div>
      <div>~${cost.toFixed(3)}</div>
    </div>
  )
}
