'use client'

import { Sparkles } from 'lucide-react'

import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-white/20 bg-black/30 text-xs text-white/80 hover:bg-white/10"
        >
          <Sparkles className="mr-2 size-3.5 text-emerald-300" aria-hidden />
          Rerun
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {MODELS.map(model => (
          <DropdownMenuItem key={model.id} onSelect={() => onRun(model.id)}>
            {model.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
