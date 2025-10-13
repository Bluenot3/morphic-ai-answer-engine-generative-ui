// components/ActionBar.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  Globe2,
  Share2,
  Sparkles,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Switch } from './ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

type ModelOption = { id: string; label: string }

type ActionBarProps = {
  /** Full transcript that can be copied or exported */
  transcript: string
  /** Triggered when the conversation should be reset */
  onReset?: () => void
  /** Toggle retrieval / web mode */
  onToggleWeb?: (enabled: boolean) => void
  /** Invoked when selecting a different model */
  onModelSwitch?: (id: string) => void
  /** Currently selected model */
  currentModelId?: string
  /** Available models for fast switching */
  models?: ModelOption[]
  /** Whether retrieval is active */
  isWebEnabled: boolean
  /** Whether there is any conversation history yet */
  hasConversation: boolean
  /** Optional className to merge */
  className?: string
}

export default function ActionBar({
  transcript,
  onReset,
  onToggleWeb,
  onModelSwitch,
  currentModelId,
  models = [],
  isWebEnabled,
  hasConversation,
  className,
}: ActionBarProps) {
  const [copied, setCopied] = useState(false)
  const [shareInFlight, setShareInFlight] = useState(false)

  const sanitizedTranscript = useMemo(() => transcript?.trim() ?? '', [transcript])
  const hasTranscript = sanitizedTranscript.length > 0

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  const handleCopy = async () => {
    if (!hasTranscript) {
      toast.info('Nothing to copy yet—try asking a question first.')
      return
    }

    try {
      await navigator.clipboard.writeText(sanitizedTranscript)
      setCopied(true)
      toast.success('Conversation copied to your clipboard.')
    } catch (error) {
      console.error('Failed to copy transcript', error)
      toast.error('Your browser prevented copying the transcript.')
    }
  }

  const handleExport = () => {
    if (!hasTranscript) {
      toast.info('Ask something first to export the dialogue.')
      return
    }

    const blob = new Blob([sanitizedTranscript], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zen-edge-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Exported conversation as Markdown.')
  }

  const handleShare = async () => {
    if (!hasTranscript) {
      toast.info('Generate an answer before sharing.')
      return
    }
    if (typeof navigator === 'undefined' || !(navigator as any).share) {
      toast.info('Share is not supported here—copied instead.')
      return handleCopy()
    }

    try {
      setShareInFlight(true)
      await (navigator as any).share({
        title: 'ZEN Edge Conversation',
        text: sanitizedTranscript.slice(0, 5000),
      })
      toast.success('Shared conversation successfully.')
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Share failed', error)
        toast.error('Unable to share this conversation.')
      }
    } finally {
      setShareInFlight(false)
    }
  }

  const activeModel = useMemo(() => {
    if (!models.length || !currentModelId) return null
    return models.find(model => model.id === currentModelId) ?? null
  }, [models, currentModelId])

  const handleWebToggle = (enabled: boolean) => {
    onToggleWeb?.(enabled)
  }

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={0}>
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4',
          className,
        )}
      >
        <div
          className={cn(
            'w-full max-w-5xl rounded-3xl border border-white/10 bg-neutral-900/80 p-4 text-sm shadow-[0_30px_120px_rgba(16,185,129,0.35)] backdrop-blur-2xl transition-all duration-300 pointer-events-auto',
            hasConversation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-80',
          )}
          role="region"
          aria-label="Conversation utility bar"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-1.5">
              <Sparkles className="size-4 text-emerald-300" aria-hidden />
              <div className="flex flex-col leading-tight">
                <span className="text-xs uppercase tracking-[0.24em] text-white/60">
                  ZEN build-grade answers
                </span>
                <span className="text-sm font-medium text-white/90">
                  Precision code & research ready for deployment
                </span>
              </div>
            </div>

            {activeModel ? (
              <Badge variant="outline" className="rounded-full border-emerald-400/40 bg-emerald-400/10 text-emerald-200">
                <ArrowRightLeft className="mr-2 size-3.5" aria-hidden />
                {activeModel.label}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5">
                  <Globe2 className="size-4 text-emerald-300" aria-hidden />
                  <span className="text-xs uppercase tracking-wide text-white/60">Web Grounding</span>
                  <Switch
                    aria-label="Toggle web search grounding"
                    checked={isWebEnabled}
                    onCheckedChange={handleWebToggle}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                Stream live web research into the next answer.
              </TooltipContent>
            </Tooltip>

            {models.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-black/40 text-white/80">
                    <ArrowRightLeft className="mr-2 size-3.5" aria-hidden />
                    Switch model
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {models.map(model => (
                    <DropdownMenuItem
                      key={model.id}
                      onSelect={() => onModelSwitch?.(model.id)}
                      className={cn('flex items-center justify-between gap-2',
                        model.id === currentModelId ? 'text-emerald-300' : '',
                      )}
                    >
                      <span>{model.label}</span>
                      {model.id === currentModelId ? <Check className="size-3" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white/80 hover:bg-white/10"
                  onClick={handleCopy}
                >
                  {copied ? <CheckmarkIcon /> : <Copy className="size-4" />}
                  <span className="sr-only">Copy transcript</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy the entire conversation</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white/80 hover:bg-white/10"
                  onClick={handleExport}
                >
                  <Download className="size-4" />
                  <span className="sr-only">Export conversation</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as Markdown</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white/80 hover:bg-white/10"
                  onClick={handleShare}
                  disabled={shareInFlight}
                >
                  <Share2 className="size-4" />
                  <span className="sr-only">Share conversation</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share to another device</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-rose-300 hover:bg-rose-500/20"
                  onClick={onReset}
                  disabled={!hasConversation}
                >
                  <XCircle className="size-4" />
                  <span className="sr-only">Reset conversation</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start a brand-new conversation</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function CheckmarkIcon() {
  return (
    <svg
      className="size-4 text-emerald-300"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.6654 4.66667L6.33203 11L3.33203 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
