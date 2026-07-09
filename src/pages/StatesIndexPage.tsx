import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// Handoff map of the prototype: every canonical screen & state, one click away.
// Mirrors the set exported to Figma; anything not listed here is exploration.
// Deep links are handled by PositionsPage's ?scope/&tab/&cell/&create/&log params.

const GROUPS: { label: string; note?: string; states: { name: string; desc: string; to: string }[] }[] = [
  {
    label: 'MVP — what engineering builds',
    states: [
      { name: 'Plan', desc: 'Role × month grid, default landing', to: '/positions?scope=mvp&tab=plan' },
      { name: 'Plan — all roles', desc: 'Empty cells become creation shortcuts', to: '/positions?scope=mvp&tab=plan&all=1' },
      { name: 'Detail panel — mixed cell', desc: 'Filled + open records (SSE, June)', to: '/positions?scope=mvp&cell=Senior Software Engineer|2026-06' },
      { name: 'Detail panel — past due', desc: 'Month passed, requests stay put (SSE, May)', to: '/positions?scope=mvp&cell=Senior Software Engineer|2026-05' },
      { name: 'Create positions', desc: 'List-based batch create; requests raised to Spark', to: '/positions?scope=mvp&create=1' },
      { name: 'Needs review', desc: 'Decision queue: past due + no request', to: '/positions?scope=mvp&tab=needs' },
      { name: 'Change log', desc: 'Audit trail of every action', to: '/positions?scope=mvp&log=1' },
    ],
  },
  {
    label: 'Full — future scope',
    note: 'Visible in the product, not in the MVP build.',
    states: [
      { name: 'Positions list', desc: 'Role-month table with locations, people, notes', to: '/positions?scope=full&tab=positions' },
      { name: 'Panel with notes', desc: 'Notes section on the detail panel', to: '/positions?scope=full&cell=Senior Software Engineer|2026-06' },
    ],
  },
  {
    label: 'AJ — individual grain (Jul 9 review direction, pending A/B)',
    states: [
      { name: 'Positions list, individual', desc: 'One row per record: status, person, age', to: '/positions?scope=aj&tab=positions' },
      { name: 'Panel, flat list', desc: 'No grouping — status badge per record', to: '/positions?scope=aj&cell=Senior Software Engineer|2026-06' },
    ],
  },
]

export default function StatesIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Positions — canonical states</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The handoff map of the prototype. Every screen and state below is one click; the same set lives in
        Figma as the pixel reference. Anything not listed here is exploration, not spec.
      </p>
      {GROUPS.map((g) => (
        <div key={g.label} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h2>
          {g.note && <p className="mt-1 text-xs text-muted-foreground">{g.note}</p>}
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            {g.states.map((s, i) => (
              <Link
                key={s.name}
                to={s.to}
                className={
                  'group flex items-center justify-between gap-4 bg-background px-4 py-3 transition-colors hover:bg-extended-hover' +
                  (i > 0 ? ' border-t border-border' : '')
                }
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{s.desc}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      ))}
      <p className="mt-8 text-xs text-muted-foreground">
        Build: <code className="rounded bg-muted px-1 py-0.5">freeze-2026-07-09</code> · repo README has the
        reference rules (Figma if it exists there, otherwise this prototype; components via Storybook).
      </p>
    </div>
  )
}
