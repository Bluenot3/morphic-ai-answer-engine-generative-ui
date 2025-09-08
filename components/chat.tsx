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

// Define section structure
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
    body: {
      id
    },
    onFinish: () => {
      window.history.replaceState({}, '', `/search/${id}`)
      window.dispatchEvent(new CustomEvent('chat-history-updated'))
    },
    onError: error => {
      toast.error(`Error in chat: ${error.message}`)
    },
    sendExtraMessageFields: false, // Disable extra message fields,
    experimental_throttle: 100
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Convert messages array to sections array
  const sections = useMemo<ChatSection[]>(() => {
    const result: ChatSection[] = []
    let currentSection: ChatSection | null = null

    for (const message of messages) {
      if (message.role === 'user') {
        // Start a new section when a user message is found
        if (currentSection) {
          result.push(currentSection)
        }
        currentSection = {
          id: message.id,
          userMessage: message,
          assistantMessages: []
        }
      } else if (currentSection && message.role === 'assistant') {
        // Add assistant message to the current section
        currentSection.assistantMessages.push(message)
      }
      // Ignore other role types like 'system' for now
    }

    // Add the last section if exists
    if (currentSection) {
      result.push(currentSection)
    }

    return result
  }, [messages])

  // Detect if scroll container is at the bottom
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 50 // threshold in pixels
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsAtBottom(true)
      } else {
        setIsAtBottom(false)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to the section when a new user message is sent
  useEffect(() => {
    if (sections.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'user') {
        // If the last message is from user, find the corresponding section
        const sectionId = lastMessage.id
        requestAnimationFrame(() => {
          const sectionElement = document.getElementById(`section-${sectionId}`)
          sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    }
  }, [sections, messages])

  useEffect(() => {
    setMessages(savedMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onQuerySelect = (query: string) => {
    append({
      role: 'user',
      content: query
    })
  }

  const handleUpdateAndReloadMessage = async (
    messageId: string,
    newContent: string
  ) => {
    setMessages(currentMessages =>
      currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    )

    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      if (messageIndex === -1) return

      const messagesUpToEdited = messages.slice(0, messageIndex + 1)

      setMessages(messagesUpToEdited)

      setData(undefined)

      await reload({
        body: {
          chatId: id,
          regenerate: true
        }
      })
    } catch (error) {
      console.error('Failed to reload after message update:', error)
      toast.error(`Failed to reload conversation: ${(error as Error).message}`)
    }
  }

  const handleReloadFrom = async (
    messageId: string,
    options?: ChatRequestOptions
  ) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex !== -1) {
      const userMessageIndex = messages
        .slice(0, messageIndex)
        .findLastIndex(m => m.role === 'user')
      if (userMessageIndex !== -1) {
        const trimmedMessages = messages.slice(0, userMessageIndex + 1)
        setMessages(trimmedMessages)
        return await reload(options)
      }
    }
    return await reload(options)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setData(undefined)
    handleSubmit(e)
  }

  // ====== NEW: helpers for features 1,4, and artifacts ======

  // Latest assistant content (used by CopyAnswer + ArtifactDock)
  const lastAssistant = useMemo(
    () => [...messages].reverse().find(m => m.role === 'assistant'),
    [messages]
  )
  const lastAssistantText =
    typeof lastAssistant?.content === 'string'
      ? lastAssistant?.content
      : Array.isArray(lastAssistant?.content)
      ? lastAssistant?.content.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('\n')
      : ''

  // For Auto-Artifact Dock: buffer full assistant text (reuse latest assistant text)
  const [artifactText, setArtifactText] = useState('')
  useEffect(() => {
    setArtifactText(lastAssistantText || '')
  }, [lastAssistantText])

  // Re-run with another model: set cookie (backend reads 'selectedModel' from cookies)
  function setSelectedModelCookie(modelId: string) {
    try {
      const cookiePayload = {
        id: modelId,
        name: modelId,
        provider: '',
        providerId: '',
        enabled: true,
        toolCallType: 'native'
      }
      document.cookie = `selectedModel=${encodeURIComponent(
        JSON.stringify(cookiePayload)
      )}; path=/; max-age=86400`
    } catch {}
  }

  function rerunLastUserWithModel(modelId: string) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    const content =
      typeof lastUser?.content === 'string'
        ? lastUser?.content
        : Array.isArray(lastUser?.content)
        ? lastUser?.content.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('\n')
        : ''

    if (!content) return
    setSelectedModelCookie(modelId)
    append({ role: 'user', content })
  }

  // Quick Prompts integration
  function handleQuickPromptInsert(t: string) {
    const next = input ? `${input} ${t}` : t
    // synthesize event for handleInputChange
    handleInputChange({
      target: { value: next }
    } as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  // ====== END NEW ======

  return (
    <div
      className={cn(
        'relative flex h-full min-w-0 flex-1 flex-col',
        messages.length === 0 ? 'items-center justify-center' : ''
      )}
      data-testid="full-chat"
    >
      {/* NEW: Top tools bar (latest assistant actions) */}
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

      {/* NEW: Quick Prompts above the composer */}
      <div className="px-2">
        <QuickPrompts onPick={handleQuickPromptInsert} />
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

      {/* NEW: Input metrics under the composer */}
      <div className="px-2">
        <InputMetrics text={input || ''} model="openai/gpt-4o-mini" />
      </div>

      {/* NEW: Auto-Artifact Dock (opens when buildable code appears) */}
      <AutoArtifactDock content={artifactText} />
    </div>
  )
}
