'use client'

/* eslint-disable simple-import-sort/imports */

import { useEffect, useMemo, useRef, useState } from 'react'

import type { ChatRequestOptions } from 'ai'
import type { Message } from 'ai/react'
import { useChat } from '@ai-sdk/react'
import { toast } from 'sonner'

import AutoArtifactDock from '@/components/artifact/auto-artifact-dock'
import CopyAnswer from '@/components/CopyAnswer'
import InputMetrics from '@/components/InputMetrics'
import QuickPrompts from '@/components/QuickPrompts'
import RerunWithModel from '@/components/RerunWithModel'
import { CHAT_ID } from '@/lib/constants'
import type { Model } from '@/lib/types/models'
import { cn } from '@/lib/utils'

import { ChatMessages } from './chat-messages'
import { ChatPanel } from './chat-panel'

// ---------------- Helpers ----------------
function contentToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (!part) return ''
        if (typeof part === 'string') return part
        if (typeof part.text === 'string') return part.text
        if (typeof part.content === 'string') return part.content
        return ''
      })
      .join('\n')
  }
  return ''
}

function isBuildIntent(t: string) {
  const s = (t || '').toLowerCase()
  return (
    /\b(build|prototype|make|create|scaffold|generate)\b/.test(s) &&
    /\b(app|page|website|component|widget|frontend|ui|dashboard)\b/.test(s)
  )
}

const BUILD_OUTPUT_SPEC = `
You are a senior UI engineer. When asked for an app/page/ui, return **one fenced code block only**.

- \`\`\`html ... full HTML with <style> + inline JS ... \`\`\`
- \`\`\`tsx ... self-contained React component ... \`\`\`

Quality: responsive, accessible, semantic, smooth transitions, glass/neuromorphic polish.
If asked for charts: include fenced \`\`\`json\`\`\` with { "chart": { ... } }.
If asked for table: { "table": { "columns": [...], "rows": [...] } }.
No prose outside code fences.
`
// -------------- End Helpers --------------

interface ChatSection {
  id: string // User message ID
  userMessage: Message
  assistantMessages: Message[]
}

export function Chat({
  id,
  savedMessages = [],
  query,
  models
}: {
  id: string
  savedMessages?: Message[]
  query?: string
  models?: Model[]
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    stop,
    append,
    data,
    setData,
    addToolResult,
    reload
  } = useChat({
    initialMessages: savedMessages,
    id: CHAT_ID,
    body: { id },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false,
    experimental_throttle: 0 // flush tokens as soon as they stream
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Sections (user message + its assistant replies)
  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let current: ChatSection | null = null
    for (const m of messages) {
      if (m.role === 'user') {
        if (current) result.push(current)
        current = { id: m.id, userMessage: m, assistantMessages: [] }
      } else if (current && m.role === 'assistant') {
        current.assistantMessages.push(m)
      }
    }
    if (current) result.push(current)
    return result
  }, [messages])

  // Scroll state
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll to new user section
  useEffect(() => {
    if (sections.length > 0) {
      const last = messages[messages.length - 1]
      if (last?.role === 'user') {
        const sectionId = last.id
        requestAnimationFrame(() => {
          const sectionEl = document.getElementById(`section-${sectionId}`)
          sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [sections, messages])

  useEffect(() => {
    setMessages(savedMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onQuerySelect = (q: string) => {
    append({ role: 'user', content: q })
  }

  const handleUpdateAndReloadMessage = async (messageId: string, newContent: string) => {
    setMessages(curr => curr.map(msg => (msg.id === messageId ? { ...msg, content: newContent } : msg)))
    try {
      const idx = messages.findIndex(msg => msg.id === messageId)
      if (idx === -1) return
      const upto = messages.slice(0, idx + 1)
      setMessages(upto)
      setData(undefined)
      await reload({ body: { chatId: id, regenerate: true } })
    } catch (error) {
      console.error('Failed to reload after message update:', error)
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const handleReloadFrom = async (messageId: string, options?: ChatRequestOptions) => {
    const idx = messages.findIndex(m => m.id === messageId)
    if (idx !== -1) {
      const userIdx = messages.slice(0, idx).findLastIndex(m => m.role === 'user')
      if (userIdx !== -1) {
        const trimmed = messages.slice(0, userIdx + 1)
        setMessages(trimmed)
        return await reload(options)
      }
    }
    return await reload(options)
  }

  // --- Submit override to enforce buildable artifacts ---
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)

    const userText = input?.toString() ?? ''
    if (isBuildIntent(userText)) {
      const content = `${userText}\n\n--- OUTPUT SPEC ---\n${BUILD_OUTPUT_SPEC}`
      append({ role: 'user', content })
      return
    }
    handleSubmit(e)
  }
  // ------------------------------------------------------

  // -------- Artifact cleaning & feeding --------
  function cleanAssistantForArtifact(s: string): string {
    if (!s) return ''
    let out = s
    out = out.replace(/---\s*OUTPUT SPEC\s*---[\s\S]*?```/, '```')
    const hasHtml = /<!doctype html/i.test(out) || /<html[\s>]/i.test(out)
    if (hasHtml) {
      const alreadyFenced =
        /```[a-zA-Z0-9+.-]*[\s\S]*<!doctype html/i.test(out) ||
        /```[a-zA-Z0-9+.-]*[\s\S]*<html[\s>]/i.test(out)
      if (!alreadyFenced) {
        const start =
          out.search(/<!doctype html/i) !== -1
            ? out.search(/<!doctype html/i)
            : out.search(/<html[\s>]/i)
        const prefix = out.slice(0, start)
        const html = out.slice(start)
        out = `${prefix}\n\`\`\`html\n${html}\n\`\`\`\n`
      }
    }
    return out.trim()
  }

  const lastAssistant = useMemo(() => [...messages].reverse().find(m => m.role === 'assistant'), [messages])
  const lastAssistantTextRaw = contentToText(lastAssistant?.content)
  const lastAssistantText = cleanAssistantForArtifact(lastAssistantTextRaw)

  const lastUser = useMemo(() => [...messages].reverse().find(m => m.role === 'user'), [messages])
  const lastUserText = contentToText(lastUser?.content)

  const [artifactText, setArtifactText] = useState('')
  useEffect(() => {
    setArtifactText(lastAssistantText || '')
  }, [lastAssistantText])
  // --------------------------------------------

  // Re-run with another model via cookie + resend last user
  function setSelectedModelCookie(modelId: string) {
    try {
      const payload = {
        id: modelId,
        name: modelId,
        provider: '',
        providerId: '',
        enabled: true,
        toolCallType: 'native'
      }
      document.cookie = `selectedModel=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=86400`
    } catch {}
  }

  function rerunLastUserWithModel(modelId: string) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    const content = contentToText(lastUserMsg?.content)
    if (!content) return
    setSelectedModelCookie(modelId)
    append({ role: 'user', content })
  }

  function handleQuickPromptInsert(t: string) {
    const next = input ? `${input} ${t}` : t
    handleInputChange({ target: { value: next } } as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <div
      className={cn(
        'relative flex h-full min-w-0 flex-1 flex-col',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      {/* Top tools bar */}
      {lastAssistantText && (
        <div className="sticky top-0 z-20 mx-2 mb-2 mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 backdrop-blur">
          <span className="text-[11px] uppercase tracking-wide text-white/50">Answer Tools</span>
          <CopyAnswer text={lastAssistantText} />
          <RerunWithModel onRun={(id) => rerunLastUserWithModel(id)} />
        </div>
      )}

      <ChatMessages
        sections={sections}
        data={data}
        onQuerySelect={onQuerySelect}
        isLoading={isLoading}
        chatId={id}
        addToolResult={addToolResult}
        scrollContainerRef={scrollContainerRef}
        onUpdateMessage={handleUpdateAndReloadMessage}
        reload={handleReloadFrom}
      />

      {/* Dynamic chips */}
      <div className="px-2">
        <QuickPrompts lastUserText={lastUserText} onPick={handleQuickPromptInsert} />
      </div>

      <ChatPanel
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        setMessages={setMessages}
        stop={stop}
        query={query}
        append={append}
        models={models}
        showScrollToBottomButton={!isAtBottom}
        scrollContainerRef={scrollContainerRef}
      />

      <div className="px-2">
        <InputMetrics text={input || ''} model="openai/gpt-4.1" />
      </div>

      <AutoArtifactDock content={artifactText} />
    </div>
  )
}
