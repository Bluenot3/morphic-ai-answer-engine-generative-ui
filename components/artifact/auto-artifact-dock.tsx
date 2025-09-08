'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = { content: string; openHint?: boolean }

function extractCode(text: string) {
  const m = text.match(/```(tsx|jsx|html|js|css)?\s*([\s\S]*?)```/)
  if (!m) return { lang: '', code: '' }
  return { lang: (m[1] || '').toLowerCase(), code: m[2] || '' }
}

function toSrcDoc(lang: string, code: string) {
  if (lang === 'html') return code
  const escaped = code.replace(/<\/script>/g, '<\\/script>')
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; height: 100%; background: #060606; color: #fff; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<div id="app"></div>
<script type="module">
${escaped}
</script>
</body>
</html>`
}

export default function AutoArtifactDock({ content, openHint }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const { lang, code } = useMemo(() => extractCode(content), [content])

  useEffect(() => {
    const intent = /build|prototype|component|widget|landing\s?page|web\s?app|dashboard|frontend/i.test(
      content
    )
    if ((openHint || intent) && code && !open) setOpen(true)
  }, [content, code, open, openHint])

  if (!open || !code) return null

  const srcDoc = toSrcDoc(lang, code)

  return (
    <aside
      className="
        fixed right-0 top-0 z-40 h-full w-full max-w-[640px]
        border-l border-white/10
        bg-gradient-to-b from-white/5 via-white/[0.04] to-white/[0.03]
        backdrop-blur-2xl
        shadow-[0_0_60px_rgba(16,185,129,0.10)]
      "
      role="dialog"
      aria-label="Artifact"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
          <div className="text-xs text-white/70">Artifact — {lang || 'code'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10"
            type="button"
          >
            View Code
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10"
            type="button"
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('preview')}
          data-active={activeTab === 'preview'}
          className="rounded-none px-3 py-2 text-sm hover:bg-white/5 data-[active=true]:bg-white/10"
          type="button"
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('code')}
          data-active={activeTab === 'code'}
          className="rounded-none px-3 py-2 text-sm hover:bg-white/5 data-[active=true]:bg-white/10"
          type="button"
        >
          Code
        </button>
      </div>

      {/* Panels */}
      {activeTab === 'preview' ? (
        <div className="h-[calc(100%-84px)]">
          <iframe
            title="Artifact"
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            srcDoc={srcDoc}
          />
        </div>
      ) : (
        <pre className="h-[calc(100%-84px)] overflow-auto bg-black/80 p-3 text-xs text-emerald-200">
          <code>{code}</code>
        </pre>
      )}
    </aside>
  )
}
