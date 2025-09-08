'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = { content: string; openHint?: boolean }

type ChartSpec = {
  type: string
  data: any
  options?: any
}

function extractCodeOrChart(text: string) {
  // First: fenced code
  const fence = text.match(/```(tsx|jsx|html|js|css|json)?\s*([\s\S]*?)```/)
  if (!fence) return { kind: 'none' as const, lang: '', code: '', chart: null as ChartSpec | null }

  const lang = (fence[1] || '').toLowerCase()
  const body = fence[2] || ''

  // Try chart JSON convention: { "chart": { type, data, options } }
  if (lang === 'json') {
    try {
      const parsed = JSON.parse(body)
      if (parsed && parsed.chart && parsed.chart.type && parsed.chart.data) {
        return { kind: 'chart' as const, lang, code: '', chart: parsed.chart as ChartSpec }
      }
    } catch {}
  }

  return { kind: 'code' as const, lang, code: body, chart: null }
}

function toSrcDocForCode(lang: string, code: string) {
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

function toSrcDocForChart(chart: ChartSpec) {
  const spec = JSON.stringify(chart)
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; height: 100%; background: #060606; color: #fff; display: grid; place-items: center; }
  * { box-sizing: border-box; }
  #wrap { width: min(900px, 96vw); height: min(520px, 78vh); padding: 16px; }
  canvas { width: 100% !important; height: 100% !important; }
</style>
</head>
<body>
<div id="wrap"><canvas id="c"></canvas></div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const spec = ${spec};
const ctx = document.getElementById('c');
new Chart(ctx, {
  type: spec.type || 'bar',
  data: spec.data || {},
  options: spec.options || { responsive: true, plugins: { legend: { labels: { color: '#eee' } } }, scales: { x: { ticks: { color: '#bbb' } }, y: { ticks: { color: '#bbb' } } } }
});
</script>
</body>
</html>`
}

function hashFor(text: string) {
  // lightweight content hash to prevent re-open on same content
  const s = text || ''
  return `${s.length}:${s.slice(0, 64)}:${s.slice(-64)}`
}

export default function AutoArtifactDock({ content, openHint }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const dismissedHashRef = useRef<string>('')

  const { kind, lang, code, chart } = useMemo(() => extractCodeOrChart(content), [content])

  // Auto-open logic with "don’t reopen if dismissed for same content"
  useEffect(() => {
    const intent = /build|prototype|component|widget|landing\s?page|web\s?app|dashboard|frontend|chart|graph/i.test(
      content
    )
    const hasRenderable = (kind === 'chart' && chart) || (kind === 'code' && code)
    const h = hashFor(content)

    if ((openHint || intent) && hasRenderable && !open && dismissedHashRef.current !== h) {
      setOpen(true)
    }
  }, [content, open, openHint, kind, code, chart])

  if (!open) return null
  if (!(kind === 'chart' ? chart : code)) return null

  const srcDoc = kind === 'chart' && chart ? toSrcDocForChart(chart) : toSrcDocForCode(lang, code)

  return (
    <aside
      className="
        fixed right-0 top-0 z-40 h-full w-full max-w-[720px]
        border-l border-white/10
        bg-gradient-to-b from-white/5 via-white/[0.04] to-white/[0.03]
        backdrop-blur-2xl
        shadow-[0_0_60px_rgba(16,185,129,0.12)]
      "
      role="dialog"
      aria-label="Artifact"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
          <div className="text-xs text-white/70">
            Artifact — {kind === 'chart' ? 'chart' : (lang || 'code')}
          </div>
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
            onClick={() => {
              dismissedHashRef.current = hashFor(content)
              setOpen(false)
            }}
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
          <code>{kind === 'chart' ? JSON.stringify({ chart }, null, 2) : code}</code>
        </pre>
      )}
    </aside>
  )
}
