'use client'

/**
 * Dynamic Quick Prompts
 * - Adapts chips to the latest user prompt (build/research/writing/data/general)
 * - No backend changes. Pure client logic.
 */

type Props = {
  lastUserText: string
  onPick: (text: string) => void
}

function detectIntent(text: string) {
  const t = (text || '').toLowerCase()

  const isBuild =
    /\b(build|prototype|make|create|scaffold|generate)\b/.test(t) &&
    /\b(app|page|website|component|widget|frontend|ui|dashboard)\b/.test(t)

  const isResearch =
    /\b(research|investigate|analyze|compare|explain|summarize|what|why|how)\b/.test(t) ||
    /\b(links|sources|citations|web results|tavily)\b/.test(t)

  const isWriting =
    /\b(email|post|tweet|thread|press release|cover letter|story|script|copy)\b/.test(t)

  const isData =
    /\b(csv|json|table|chart|graph|plot|data|dataset|columns|rows)\b/.test(t)

  return { isBuild, isResearch, isWriting, isData }
}

function suggestionsFor(text: string) {
  const { isBuild, isResearch, isWriting, isData } = detectIntent(text)

  if (isBuild) {
    return {
      primary: [
        'Add a neuromorphic UI with soft shadows',
        'Make it responsive for mobile + desktop',
        'Use glassmorphism with subtle blurs',
        'Dark theme with emerald accent tokens',
        'Add a sticky header + footer CTA',
        'Refactor into components with clear props'
      ],
      secondary: [
        'Generate unit tests for critical UI pieces',
        'Inline docs: comment tricky parts',
        'Export a single self-contained HTML for preview',
        'Add accessibility (ARIA roles, keyboard nav)',
        'Optimize for Lighthouse performance'
      ]
    }
  }

  if (isResearch) {
    return {
      primary: [
        'Give a 5-bullet executive summary',
        'Create a pros/cons table with citations',
        'Extract key numbers & dates',
        'Add source links with one-line annotations',
        'Propose 3 actionable next steps'
      ],
      secondary: [
        'Rewrite as a 90-second brief',
        'Highlight uncertainties and missing data',
        'Add a timeline with milestones',
        'Generate a glossary of terms'
      ]
    }
  }

  if (isWriting) {
    return {
      primary: [
        'Outline first, then write',
        'Executive tone, concise',
        'Add a strong CTA at the end',
        'Give 3 headline options',
        'Add a TL;DR at the top'
      ],
      secondary: [
        'Rewrite for 5th-grade clarity',
        'Punchier, more active voice',
        'Convert to a 5-tweet thread',
        'Add an “objections & replies” section'
      ]
    }
  }

  if (isData) {
    return {
      primary: [
        'Turn into a clean table',
        'Make a chart with labeled axes',
        'Find anomalies and outliers',
        'Suggest 3 segmentations',
        'Summarize in 5 bullets + actions'
      ],
      secondary: [
        'Infer missing values if sensible',
        'Compute basic stats (mean, median, p95)',
        'Note data quality limitations',
        'Draft SQL to recreate this result'
      ]
    }
  }

  // Default: helpful general chips
  return {
    primary: [
      'Summarize in 5 bullets',
      'Explain like I’m 12',
      'Pros/cons with tradeoffs',
      'Turn into an action plan',
      'Give 3 alternative approaches'
    ],
    secondary: [
      'Add a one-sentence TL;DR',
      'Highlight risks and mitigations',
      'Rewrite for clarity and brevity'
    ]
  }
}

export default function QuickPrompts({ lastUserText, onPick }: Props) {
  const sugg = suggestionsFor(lastUserText)

  return (
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        {sugg.primary.map((p) => (
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
      {sugg.secondary?.length ? (
        <div className="flex flex-wrap gap-2">
          {sugg.secondary.map((p) => (
            <button
              key={p}
              onClick={() => onPick(p)}
              className="chip opacity-80 hover:opacity-100"
              type="button"
              aria-label={p}
              title={p}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
