import { useState } from 'react'
import { X, Trash2, ExternalLink, ChevronDown, Plus, NotepadText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { avatarFor } from '@/lib/positions/avatars'
import { fmtFull } from '@/lib/positions/time'
import { isPastDueMonth } from '@/lib/positions/model'
import { type PosRow, type DetailRecord, type PosNote } from './lib'

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
function Section({ label, count, tone, defaultOpen, emptyText, children }: {
  label: string; count: number; tone: Tone; defaultOpen: boolean; emptyText?: string; children?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const empty = count === 0
  return (
    <div className="border-t border-border">
      {/* Empty sections stay expandable — the chevron is the affordance, and opening
          one answers "is there really nothing here?" instead of leaving a dead row. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="flex items-center gap-1.5">
          <span className={cn('text-sm font-medium', empty ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
          <CountBadge n={count} tone={tone} />
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          {empty ? <p className="pb-2 text-sm text-muted-foreground">{emptyText ?? 'Nothing here yet.'}</p> : children}
        </div>
      )}
    </div>
  )
}

// One row per location group (Open / Past due), with a count badge when >1.
function LocRow({ loc, count, tone, children }: { loc: string; count: number; tone: Tone; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-b-0">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LOC_TOKEN[loc] ?? 'var(--muted-foreground)' }} />
        <span className="truncate text-sm font-medium text-foreground" title={loc}>{loc}</span>
        {/* Badge shows even at 1 — reviewers read the bare name as ambiguous (Brandon, item 4). */}
        <CountBadge n={count} tone={tone} />
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

// Note authors get an initials chip, same tones as the change log avatars.
const NOTE_TONE = ['var(--chart-4)', 'var(--badge-success-fg)', 'var(--primary)', 'var(--chart-2)']
function NoteAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const ini = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  const tone = NOTE_TONE[(ini.charCodeAt(0) || 0) % NOTE_TONE.length]
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase text-white" style={{ background: tone }}>
      {ini}
    </span>
  )
}

// Notes accordion — positions flavour of the Deals notes pattern: composer on top,
// newest first, most recent note highlighted with the primary dot.
function NotesSection({ notes, onAddNote }: { notes: PosNote[]; onAddNote: (text: string) => void }) {
  const [open, setOpen] = useState(notes.length > 0)
  const [text, setText] = useState('')
  const submit = () => { if (text.trim()) { onAddNote(text.trim()); setText('') } }
  return (
    <div className="border-t border-border">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2">
          <NotepadText className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Notes</span>
          {notes.length > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground tabular-nums">{notes.length}</span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-5 pb-4">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="resize-none" placeholder="Add context for BizOps or Talent — priorities, constraints, backfill details…" />
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-8" disabled={!text.trim()} onClick={submit}>Add note</Button>
          </div>
          <div className="flex flex-col gap-1">
            {notes.map((n, i) => (
              // Note-card pattern shared with the change log: newest card highlighted + dot.
              <div key={n.id} className={cn('flex flex-col gap-1.5 rounded-md p-3', i === 0 ? 'bg-[rgba(231,235,255,0.5)]' : 'bg-transparent')}>
                <div className="flex items-center gap-2 text-xs">
                  <NoteAvatar name={n.author} />
                  <span className="font-medium text-foreground">{n.author}</span>
                  <span className="text-muted-foreground/60">|</span>
                  <span className="text-muted-foreground">{n.date}</span>
                  {i === 0 && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="text-xs leading-4 text-muted-foreground">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  row: PosRow | null
  records: DetailRecord[]
  notes: PosNote[]
  isOpen: boolean
  onDismiss: () => void
  onOpenRequest: (recIds: string[]) => void   // no-request records → open-request wizard
  onCloseRecords: (recIds: string[]) => void  // → close wizard (reason required)
  onNewPosition: () => void                   // footer → create dialog, role prefilled
  onAddNote: (text: string) => void
  onPerson: (name: string) => void
}

export function PositionDetailPanel({ row, records, notes, isOpen, onDismiss, onOpenRequest, onCloseRecords, onNewPosition, onAddNote, onPerson }: Props) {
  const monthPastDue = row ? isPastDueMonth(row.mk) : false
  // In a past month, open items (with a request) are past due — normalise so they land in the right section.
  const recs = records.map((r) => (monthPastDue && r.status === 'open' && !r.noReq ? { ...r, status: 'pending' as const } : r))

  const filled = recs.filter((r) => r.status === 'started' || r.status === 'accepted')
  // "Open" means a hiring request exists and recruiting is underway. Positions
  // without a request are their own state — nothing is being recruited yet.
  const openRecs = recs.filter((r) => r.status === 'open' && !r.noReq)
  const noReqRecs = recs.filter((r) => r.status === 'open' && r.noReq)
  const pastDue = recs.filter((r) => r.status === 'pending')
  const closed = recs.filter((r) => r.status === 'closed')

  const groupByLoc = (list: DetailRecord[]) => {
    const m = new Map<string, DetailRecord[]>()
    for (const r of list) { if (!m.has(r.loc)) m.set(r.loc, []); m.get(r.loc)!.push(r) }
    return [...m.entries()].map(([loc, items]) => ({ loc, items }))
  }
  const openGroups = groupByLoc(openRecs)
  const noReqGroups = groupByLoc(noReqRecs)
  const pastDueGroups = groupByLoc(pastDue)

  const closeableIds = [...openRecs, ...noReqRecs, ...pastDue].map((r) => r.id)

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
          <Section label="Filled" count={filled.length} tone="filled" defaultOpen={filled.length > 0} emptyText="None filled yet.">
            {filled.map((r) => <FilledRow key={r.id} rec={r} onPerson={onPerson} />)}
          </Section>

          <Section label="Open" count={openRecs.length} tone="open" defaultOpen={openRecs.length > 0} emptyText="No open requests.">
            <p className="mb-1 text-xs leading-4 text-muted-foreground">Actively recruiting via Spark. Close a request if the role's no longer needed.</p>
            {openGroups.map((g) => (
              <LocRow key={g.loc} loc={g.loc} count={g.items.length} tone="open">
                <CloseIconBtn onClick={() => onCloseRecords(g.items.map((i) => i.id))} label={`Close ${g.loc} ${row?.title ?? ''}`} />
              </LocRow>
            ))}
          </Section>

          {/* Exception states hide at zero — when visible, they always mean something. */}
          {noReqRecs.length > 0 && (
            <Section label="No request" count={noReqRecs.length} tone="neutral" defaultOpen>
              <p className="mb-1 text-xs leading-4 text-muted-foreground">No hiring request raised yet, so nothing is being recruited. Open a request to start, or close the position.</p>
              {noReqGroups.map((g) => (
                <LocRow key={g.loc} loc={g.loc} count={g.items.length} tone="neutral">
                  <CloseIconBtn onClick={() => onCloseRecords(g.items.map((i) => i.id))} label={`Close ${g.loc} ${row?.title ?? ''}`} />
                  <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenRequest(g.items.map((i) => i.id))}>Open request</Button>
                </LocRow>
              ))}
            </Section>
          )}

          {pastDue.length > 0 && (
            <Section label="Past due" count={pastDue.length} tone="pending" defaultOpen>
              <p className="mb-1 text-xs leading-4 text-muted-foreground">Target start date has passed. The request stays open — hiring is just delayed. Close it if we're no longer hiring.</p>
              {pastDueGroups.map((g) => (
                <LocRow key={g.loc} loc={g.loc} count={g.items.length} tone="pending">
                  <CloseIconBtn onClick={() => onCloseRecords(g.items.map((i) => i.id))} label={`Close ${g.loc} ${row?.title ?? ''}`} />
                </LocRow>
              ))}
            </Section>
          )}

          {closed.length > 0 && (
            <Section label="Closed" count={closed.length} tone="neutral" defaultOpen={false}>
              {closed.map((r) => <ClosedRow key={r.id} rec={r} />)}
            </Section>
          )}

          <NotesSection notes={notes} onAddNote={onAddNote} />
        </div>

        {/* Footer — bulk close + add more positions for this role */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border p-4">
          {closeableIds.length > 0 && (
            <Button variant="destructive" onClick={() => onCloseRecords(closeableIds)}>
              <Trash2 className="h-4 w-4" /> Close all
            </Button>
          )}
          <Button onClick={onNewPosition}>
            <Plus className="h-4 w-4" /> New position
          </Button>
        </div>
      </div>
    </div>
  )
}
