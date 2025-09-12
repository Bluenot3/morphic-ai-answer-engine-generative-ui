'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type Props = { content: string; openHint?: boolean }

type ChartSpec = {
  type: string
  data: any
  options?: any
}

/* ---------- Helpers to parse renderable content ---------- */

function extractLooseHtml(text: string) {
  const s = text || ''
  if (/<\s*!doctype/i.test(s) || /<\s*html/i.test(s)) {
    const start =
      s.search(/<\s*!doctype/i) !== -1
        ? s.search(/<\s*!doctype/i)
        : s.search(/<\s*html/i)
    return s.slice(start)
  }
  if (/<\s*div[^>]*>[\s\S]*<\/\s*div>/.test(s)) {
    const body = s.match(/<\s*div[^>]*>[\s\S]*<\/\s*div>/)?.[0] ?? s
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body>${body}</body></html>`
  }
  return ''
}

function extractCodeOrChart(text: string) {
  const fence = text.match(/```([a-zA-Z0-9+.-]*)?\s*([\s\S]*?)```/)
  if (fence) {
    const rawLang = (fence[1] || '').toLowerCase()
    const lang =
      rawLang === ''
        ? 'text'
        : /^(html|html\+tailwind|htm)$/.test(rawLang)
          ? 'html'
          : /^(tsx|typescriptreact)$/.test(rawLang)
            ? 'tsx'
            : /^(jsx|javascriptreact)$/.test(rawLang)
              ? 'jsx'
              : /^(js|javascript|mjs|cjs)$/.test(rawLang)
                ? 'js'
                : /^(css|scss|sass)$/.test(rawLang)
                  ? 'css'
                  : /^(json)$/.test(rawLang)
                    ? 'json'
                    : rawLang

    const body = fence[2] || ''

    if (lang === 'json') {
      try {
        const parsed = JSON.parse(body)
        if (parsed?.chart?.type && parsed?.chart?.data) {
          return {
            kind: 'chart' as const,
            lang,
            code: '',
            chart: parsed.chart as ChartSpec
          }
        }
      } catch {
        // treat as code
      }
    }

    return {
      kind: 'code' as const,
      lang,
      code: body,
      chart: null as ChartSpec | null
    }
  }

  const loose = extractLooseHtml(text)
  if (loose) {
    return { kind: 'code' as const, lang: 'html', code: loose, chart: null }
  }

  return { kind: 'none' as const, lang: '', code: '', chart: null }
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
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #050505; color: #fff; font-family: Inter, system-ui, sans-serif; }
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
  html, body { margin: 0; height: 100%; background: #050505; color: #fff; font-family: Inter, system-ui, sans-serif; display: grid; place-items: center; }
  #wrap { width: min(960px, 96vw); height: min(560px, 78vh); }
  canvas { width: 100% !important; height: 100% !important; }
</style>
</head>
<body>
<div id="wrap"><canvas id="c"></canvas></div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const spec = ${spec};
new Chart(document.getElementById('c'), { type: spec.type, data: spec.data, options: spec.options });
</script>
</body>
</html>`
}

function hashFor(text: string) {
  const s = text || ''
  return `${s.length}:${s.slice(0, 64)}:${s.slice(-64)}`
}

/* ---------- Component ---------- */

export default function AutoArtifactDock({ content, openHint }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const dismissedHashRef = useRef<string>('')

  const { kind, lang, code, chart } = useMemo(
    () => extractCodeOrChart(content),
    [content]
  )

  useEffect(() => {
    const hasRenderable =
      (kind === 'chart' && chart) || (kind === 'code' && code)
    const h = hashFor(content)
    if (
      (openHint || hasRenderable) &&
      !open &&
      dismissedHashRef.current !== h
    ) {
      setOpen(true)
      setActiveTab('preview')
      setIsLoading(true)
      setProgress(0)
    }
  }, [content, open, openHint, kind, code, chart])

  useEffect(() => {
    if (!open || !isLoading) return
    let pct = 0
    const id = setInterval(() => {
      pct = Math.min(pct + Math.max(1, (85 - pct) * 0.08), 85)
      setProgress(Math.round(pct))
    }, 60)
    return () => clearInterval(id)
  }, [open, isLoading])

  if (!open) return null
  if (!(kind === 'chart' ? chart : code)) return null

  const srcDoc =
    kind === 'chart' && chart
      ? toSrcDocForChart(chart)
      : toSrcDocForCode(lang, code)

  return (
    <aside
      className="
        fixed right-0 top-0 z-40 h-full w-full max-w-[820px]
        border-l border-white/20
        bg-white/10
        backdrop-blur-3xl
        shadow-[0_0_120px_rgba(16,185,129,0.30)]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-white/80">
          Artifact — {kind}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setActiveTab('preview')}>
            Preview
          </Button>
          <Button size="sm" onClick={() => setActiveTab('code')}>
            Code
          </Button>
          <Button
            size="sm"
            onClick={() => {
              dismissedHashRef.current = hashFor(content)
              setOpen(false)
            }}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div className="relative h-1.5 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="relative h-[calc(100%-92px)]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <Spinner className="h-8 w-8 text-emerald-300" />
          </div>
        )}
        {activeTab === 'preview' ? (
          <iframe
            className={`h-full w-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            sandbox="allow-scripts allow-same-origin"
            srcDoc={srcDoc}
            onLoad={() => {
              setProgress(100)
              setTimeout(() => setIsLoading(false), 200)
            }}
          />
        ) : (
          <pre className="h-full overflow-auto rounded-xl bg-black/60 p-4 text-emerald-200 text-xs backdrop-blur-sm">
            <code>
              {kind === 'chart' ? JSON.stringify({ chart }, null, 2) : code}
            </code>
          </pre>
        )}
      </div>
    </aside>
  )
}
