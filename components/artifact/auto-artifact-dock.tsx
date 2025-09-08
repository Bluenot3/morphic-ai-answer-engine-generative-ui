'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  /** Full assistant text (concatenated as it streams). */
  content: string
  /** Optional hint: set true if the user asked to “build”, “prototype”, “landing page”, etc. */
  openHint?: boolean
}

function extractCode(text: string) {
  const m = text.match(/```(tsx|jsx|html|js|css)?\s*([\s\S]*?)```/)
  if (!m) return { lang: '', code: '' }
  return { lang: (m[1] || '').toLowerCase(), code: m[2] || '' }
}

function toSrcDoc(lang: string, code: string) {
  // If pure HTML, use directly; otherwise wrap into a tiny HTML shell
  if (lang === 'html') return code
  const escaped = code.replace(/<\/script>/g, '<\\/script>')
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:#0b0b0b;color:#fff}*,*:before,*:after{box-sizing:border-box}</style>
</head><body>
<div id="app"></div>
<script type="module">
${escaped}
</script>
</body></html>`
}

export default function AutoArtifactDock({ content, openHint }: Props) {
  const [open, setOpen] = useState(false)
  const { lang, code } = useMemo(() => extractCode(content), [content])

  useEffect(() => {
    const intent = /build|prototype|component|widget|landing\s?page|web\s?app|dashboard|frontend/i.test(content)
    if ((openHint || intent) && code && !open) setOpen(true)
  }, [content, code, open, openHint])

  if (!open || !code) return null

  const srcDoc = toSrcDoc(lang, code)

  return (
    <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-[560px] border-l border-white/10 bg-black/70 backdrop-blur-lg">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-xs text-white/70">Artifact Preview</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const el = document.getElementById('artifact-tabs')
              if (!el) return
              const codeTab = el.querySelector('[data-tab="code"]') as HTMLButtonElement | null
              codeTab?.click()
            }}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            View Code
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div id="artifact-tabs" className="flex border-b border-white/10">
        <button
          className="peer rounded-none px-3 py-2 text-sm hover:bg-white/5 data-[active=true]:bg-white/10"
          data-tab="preview"
          data-active="true"
          onClick={(e) => {
            const p = e.currentTarget; const c = p.nextElementSibling as HTMLButtonElement
            p.setAttribute('data-active', 'true'); c?.setAttribute('data-active', 'false')
            document.getElementById('artifact-preview')?.classList.remove('hidden')
            document.getElementById('artifact-code')?.classList.add('hidden')
          }}
        >
          Preview
        </button>
        <button
          className="rounded-none px-3 py-2 text-sm hover:bg-white/5"
          data-tab="code"
          onClick={(e) => {
            const c = e.currentTarget; const p = c.previousElementSibling as HTMLButtonElement
            c.setAttribute('data-active', 'true'); p?.setAttribute('data-active', 'false')
            document.getElementById('artifact-code')?.classList.remove('hidden')
            document.getElementById('artifact-preview')?.classList.add('hidden')
          }}
        >
          Code
        </button>
      </div>

      {/* Panels */}
      <div id="artifact-preview" className="h-[calc(100%-84px)]">
        <iframe
          title="Artifact"
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
          srcDoc={srcDoc}
        />
      </div>
      <pre
        id="artifact-code"
        className="hidden h-[calc(100%-84px)] overflow-auto bg-black/80 p-3 text-xs text-emerald-200"
      >
        <code>{code}</code>
      </pre>
    </aside>
  )
}
