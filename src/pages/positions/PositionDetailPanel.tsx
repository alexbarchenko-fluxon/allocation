import { useState } from 'react'
import { X, Trash2, ExternalLink, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { avatarFor } from '@/lib/positions/avatars'
import { fmtFull } from '@/lib/positions/time'
import { isPastDueMonth } from '@/lib/positions/model'
import { type PosRow, type DetailRecord } from './lib'

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SLIDE = '0.35s'

// Location colours are dedicated tokens, deliberately off the status palette.
const LOC_TOKEN: Record<string, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
}

// Status tones map to the same tokens the metric cards use, so the panel and the
// top-of-page metrics read as one language: teal filled, blue open, amber past due.
type Tone = 'filled' | 'open' | 'pending' | 'neutral'
const TONE_BG: Record<Tone, string> = {
  filled: 'var(--metric-filled)',
  open: 'var(--electric-blue-600)',
  pending: 'var(--badge-warning-fg)',
  neutral: 'var(--muted-foreground)',
}

function CountBadge({ n, tone }: { n: number; tone: Tone }) {
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium text-primary-foreground tabular-nums"
      style={{ background: TONE_BG[tone] }}
    >
      {n}
    </span>
  )
}

// Ghost/outline icon button — the per-row Close. Only the footer "Close all" is filled red.
function CloseIconBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground shadow-xs transition-colors hover:bg-extended-hover hover:text-foreground"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

// Collapsible status section. Empty sections show a count of 0 and don't expand.
function Section({ label, count, tone, defaultOpen, children }: {
  label: string; count: number; tone: Tone; defaultOpen: boolean; children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const empty = count === 0
  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => !empty && setOpen((o) => !o)}
        className={cn('flex w-full items-center justify-between px-5 py-4', empty && 'cursor-default')}
      >
        <span className="flex items-center gap-1.5">
          <span className={cn('text-sm font-medium', empty ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
          <CountBadge n={count} tone={tone} />
        </span>
        {!empty && <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />}
      </button>
      {open && !empty && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

// One row per location group (Open / Past due), with a count badge when >1.
function LocRow({ loc, count, tone, children }: { loc: string; count: number; tone: Tone; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-b-0">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LOC_TOKEN[loc] ?? 'var(--muted-foreground)' }} />
        <span className="truncate text-sm font-medium text-foreground">{loc}</span>
        {count > 1 && <CountBadge n={count} tone={tone} />}
      </span>
      <span className="flex shrink-0 items-center gap-2">{children}</span>
    </div>
  )
}

function FilledRow({ rec, onPerson }: { rec: DetailRecord; onPerson: (name: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-b-0">
      {rec.person ? (
        <button
          onClick={() => onPerson(rec.person!.name)}
          className="group -mx-1 flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-extended-hover"
          title={`View ${rec.person.name} in People`}
        >
          <img src={avatarFor(rec.person.name)} alt={rec.person.name} className="h-6 w-6 shrink-0 rounded-full object-cover" />
          <span className="flex min-w-0 flex-col text-left">
            <span className="truncate text-sm font-medium text-foreground group-hover:underline">{rec.person.name}</span>
            <span className="truncate text-xs text-muted-foreground">Starts {fmtFull(rec.person.start)} · {rec.person.loc}</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LOC_TOKEN[rec.loc] ?? 'var(--muted-foreground)' }} />
          <span className="text-sm font-medium text-foreground">{rec.loc}</span>
        </span>
      )}
      <Badge variant="success">{rec.status === 'started' ? 'On staff' : 'Offer accepted'}</Badge>
    </div>
  )
}

function ClosedRow({ rec }: { rec: DetailRecord }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LOC_TOKEN[rec.loc] ?? 'var(--muted-foreground)' }} />
          <span className="text-sm font-medium text-foreground">{rec.loc}</span>
        </span>
        <Badge variant="neutral">Closed</Badge>
      </div>
      {rec.closedReason && (
        <p className="text-xs text-muted-foreground pl-3.5">
          {rec.closedReason}{rec.closedBy ? ` · ${rec.closedBy}` : ''}{rec.closedTs ? ` · ${rec.closedTs}` : ''}
        </p>
      )}
    </div>
  )
}

interface Props {
  row: PosRow | null
  records: DetailRecord[]
  isOpen: boolean
  onDismiss: () => void
  onExtend: (recIds: string[]) => void        // past-due records → extend wizard
  onOpenRequest: (recIds: string[]) => void   // no-request records → open-request wizard
  onCloseRecords: (recIds: string[]) => void  // → close wizard (reason required)
  onPerson: (name: string) => void
}

export function PositionDetailPanel({ row, records, isOpen, onDismiss, onExtend, onOpenRequest, onCloseRecords, onPerson }: Props) {
  const monthPastDue = row ? isPastDueMonth(row.mk) : false
  // In a past month, open items (with a request) are past due — normalise so they land in the right section.
  const recs = records.map((r) => (monthPastDue && r.status === 'open' && !r.noReq ? { ...r, status: 'pending' as const } : r))

  const filled = recs.filter((r) => r.status === 'started' || r.status === 'accepted')
  const openRecs = recs.filter((r) => r.status === 'open')
  const pastDue = recs.filter((r) => r.status === 'pending')
  const closed = recs.filter((r) => r.status === 'closed')

  // Open groups split by location AND request state — no-request positions get a
  // different action ("Open request") than plain open ones (Close only).
  const openGroups = (() => {
    const m = new Map<string, { loc: string; noReq: boolean; items: DetailRecord[] }>()
    for (const r of openRecs) {
      const key = `${r.loc}|${!!r.noReq}`
      if (!m.has(key)) m.set(key, { loc: r.loc, noReq: !!r.noReq, items: [] })
      m.get(key)!.items.push(r)
    }
    return [...m.values()]
  })()

  const pastDueGroups = (() => {
    const m = new Map<string, DetailRecord[]>()
    for (const r of pastDue) { if (!m.has(r.loc)) m.set(r.loc, []); m.get(r.loc)!.push(r) }
    return [...m.entries()].map(([loc, items]) => ({ loc, items }))
  })()

  const closeableIds = [...openRecs, ...pastDue].map((r) => r.id)
  const pastDueIds = pastDue.map((r) => r.id)

  return (
    <div
      className="h-full flex-shrink-0 overflow-hidden"
      style={{ width: isOpen ? 420 : 0, marginLeft: isOpen ? 0 : -10, transition: `width ${SLIDE} ${EASING}, margin-left ${SLIDE} ${EASING}` }}
    >
      <div className="flex h-full w-[420px] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-lg font-semibold tracking-tight">{row?.title}</span>
            <span className="text-sm text-muted-foreground">{row?.monthLabel} · {row?.dept}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onDismiss} className="shrink-0 text-muted-foreground hover:text-foreground"><X /></Button>
        </div>

        {/* Sections (keyed by row so the accordion resets when a different position is opened) */}
        <div key={row?.id} className="scrollbar-minimal flex-1 overflow-y-auto">
          <Section label="Filled" count={filled.length} tone="filled" defaultOpen={filled.length > 0}>
            {filled.map((r) => <FilledRow key={r.id} rec={r} onPerson={onPerson} />)}
          </Section>

          <Section label="Open" count={openRecs.length} tone="open" defaultOpen={openRecs.length > 0}>
            <p className="mb-1 text-xs leading-4 text-muted-foreground">Actively recruiting via Spark. Close a request if the role's no longer needed.</p>
            {openGroups.map((g) => (
              <LocRow key={`${g.loc}|${g.noReq}`} loc={g.loc} count={g.items.length} tone="open">
                <CloseIconBtn onClick={() => onCloseRecords(g.items.map((i) => i.id))} label={`Close ${g.loc} ${row?.title ?? ''}`} />
                {g.noReq && (
                  <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenRequest(g.items.map((i) => i.id))}>Open request</Button>
                )}
              </LocRow>
            ))}
          </Section>

          <Section label="Past due" count={pastDue.length} tone="pending" defaultOpen={pastDue.length > 0}>
            <p className="mb-1 text-xs leading-4 text-muted-foreground">Target start date has passed. Extend moves it forward to the current month, or close it.</p>
            {pastDueGroups.map((g) => (
              <LocRow key={g.loc} loc={g.loc} count={g.items.length} tone="pending">
                <CloseIconBtn onClick={() => onCloseRecords(g.items.map((i) => i.id))} label={`Close ${g.loc} ${row?.title ?? ''}`} />
                <Button variant="outline" size="sm" className="h-8" onClick={() => onExtend(g.items.map((i) => i.id))}>Extend request</Button>
              </LocRow>
            ))}
          </Section>

          {closed.length > 0 && (
            <Section label="Closed" count={closed.length} tone="neutral" defaultOpen={false}>
              {closed.map((r) => <ClosedRow key={r.id} rec={r} />)}
            </Section>
          )}
        </div>

        {/* Footer — bulk actions */}
        {(closeableIds.length > 0 || pastDueIds.length > 0) && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border p-4">
            {closeableIds.length > 0 && (
              <Button variant="destructive" onClick={() => onCloseRecords(closeableIds)}>
                <Trash2 className="h-4 w-4" /> Close all
              </Button>
            )}
            {pastDueIds.length > 0 && (
              <Button onClick={() => onExtend(pastDueIds)}>
                Extend all requests
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-xs font-medium tabular-nums">{pastDueIds.length}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
