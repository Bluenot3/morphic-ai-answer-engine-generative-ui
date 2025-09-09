'use client'

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
    /\b(research|investigate|analyze|compare|summarize|sources|citations|tavily|web)\b/.test(t)

  const isWriting =
    /\b(email|post|tweet|thread|press release|cover letter|story|script|copy|landing copy)\b/.test(t)

  const isData =
    /\b(csv|json|table|chart|graph|plot|data|dataset|columns|rows|metrics|kpi)\b/.test(t)

  return { isBuild, isResearch, isWriting, isData }
}

function suggestionsFor(text: string) {
  const { isBuild, isResearch, isWriting, isData } = detectIntent(text)

  if (isBuild) {
    return {
      primary: [
        'Add a neuromorphic UI with soft shadows',
        'Apply glassmorphism with subtle blur/background gradient',
        'Make it fully responsive (mobile-first)',
        'Dark theme with emerald accent tokens',
        'Accessibility: roles, labels, keyboard navigation',
        'Split into reusable components with typed props'
      ],
      secondary: [
        'Inline docs for tricky logic',
        'Generate unit tests for components',
        'Bundle a standalone preview (single HTML)',
        'Optimize Lighthouse (performance + SEO)',
        'Add a sticky header + footer CTA'
      ]
    }
  }

  if (isResearch) {
    return {
      primary: [
        'Executive summary in 5 bullets with citations',
        'Pros/cons table with source refs',
        'Key metrics & dates extracted',
        'Three actionable recommendations',
        'Highlight uncertainties & missing data'
      ],
      secondary: [
        'Create a timeline with milestones',
        'Glossary of key terms',
        'Risk matrix with mitigations'
      ]
    }
  }

  if (isWriting) {
    return {
      primary: [
        'Outline first, then draft',
        'Executive tone, concise and direct',
        'Add a strong call-to-action',
        'Provide 3 headline options',
        'Include a 1-sentence TL;DR'
      ],
      secondary: [
        'Rewrite for clarity and brevity',
        'Convert to a 5-tweet thread',
        'Add objections & replies'
      ]
    }
  }

  if (isData) {
    return {
      primary: [
        'Convert to a clean table with headers',
        'Render a chart (bar/line/pie) from this data',
        'Identify anomalies/outliers',
        'Suggest 3 segmentations to explore',
        'Summarize insights + next steps'
      ],
      secondary: [
        'Compute stats (mean, median, p95)',
        'Note data quality limits',
        'Draft SQL to reproduce result'
      ]
    }
  }

  // Neutral premium defaults
  return {
    primary: [
      'Give a concise executive summary',
      'List trade-offs with recommendations',
      'Propose 3 alternative approaches',
      'Outline risks and mitigations',
      'Provide next steps with owners'
    ],
    secondary: [
      'Add a 1-sentence TL;DR',
      'Flag assumptions and unknowns',
      'Reframe as a one-page brief'
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
      {!!sugg.secondary?.length && (
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
      )}
    </div>
  )
}
