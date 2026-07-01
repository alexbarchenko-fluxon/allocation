import { X, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SidePanelSection } from '@/components/ui/side-panel-section'
import { avatarFor } from '@/lib/positions/avatars'
import { fmtFull } from '@/lib/positions/time'
import { isPastDueMonth } from '@/lib/positions/model'
import { type PosRow } from './lib'
import { type DetailRecord } from './lib'

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SLIDE = '0.35s'

function StatusBadge({ status }: { status: DetailRecord['status'] }) {
  if (status === 'started') return <Badge variant="success">On staff</Badge>
  if (status === 'accepted') return <Badge variant="success">Offer accepted</Badge>
  if (status === 'pending') return <Badge variant="warning">Past due</Badge>
  if (status === 'closed') return <Badge variant="neutral">Closed</Badge>
  return <Badge variant="blue">Open</Badge>
}

const LOC_DOT: Record<string, string> = { India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)' }

function RecordRow({ rec, onExtend, onClose, onPerson }: { rec: DetailRecord; onExtend: () => void; onClose: () => void; onPerson: (name: string) => void }) {
  const filled = rec.status === 'started' || rec.status === 'accepted'
  const actionable = rec.status === 'open' || rec.status === 'pending'
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-border last:border-b-0">
      {/* Primary line: who/where on the left, status on the right */}
      <div className="flex items-center justify-between gap-3">
        {filled && rec.person ? (
          <button onClick={() => onPerson(rec.person!.name)} className="group flex items-center gap-2 min-w-0 rounded-md -mx-1 px-1 py-0.5 hover:bg-extended-hover transition-colors" title={`View ${rec.person.name} in People`}>
            <img src={avatarFor(rec.person.name)} alt={rec.person.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
            <span className="text-sm font-medium text-foreground truncate group-hover:underline">{rec.person.name}</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ) : (
          <span className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LOC_DOT[rec.loc] || 'var(--muted-foreground)' }} />
            <span className="text-sm font-medium text-foreground truncate">{rec.loc}</span>
          </span>
        )}
        <StatusBadge status={rec.status} />
      </div>

      {/* Secondary line: context */}
      {filled && rec.person && (
        <p className="text-xs text-muted-foreground pl-1">Starts {fmtFull(rec.person.start)} · {rec.person.loc}</p>
      )}
      {rec.noReq && <p className="text-xs text-muted-foreground pl-1">No hiring request yet. Open one to start recruiting, or close the position.</p>}
      {rec.status === 'pending' && !rec.noReq && <p className="text-xs text-muted-foreground pl-1">Target start date has passed. Extend moves it forward to the current month, or close it.</p>}
      {rec.status === 'closed' && rec.closedReason && (
        <p className="text-xs text-muted-foreground pl-1">{rec.closedReason} {rec.closedBy ? `· ${rec.closedBy}` : ''}{rec.closedTs ? ` · ${rec.closedTs}` : ''}</p>
      )}

      {/* Actions: grouped, right-aligned, primary action first */}
      {actionable && (
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onClose}><Trash2 className="h-3.5 w-3.5" /> Close</Button>
          {rec.noReq
            ? <Button variant="outline" size="sm" className="h-8" onClick={onExtend}>Open request</Button>
            : rec.status === 'pending'
            ? <Button size="sm" className="h-8" onClick={onExtend}>Extend request</Button>
            : null}
        </div>
      )}
    </div>
  )
}

interface Props {
  row: PosRow | null
  records: DetailRecord[]
  isOpen: boolean
  onClose: () => void
  onExtend: (recId: string) => void
  onCloseRecord: (recId: string) => void
  onPerson: (name: string) => void
}

export function PositionDetailPanel({ row, records, isOpen, onClose, onExtend, onCloseRecord, onPerson }: Props) {
  const monthPastDue = row ? isPastDueMonth(row.mk) : false
  // In a past month, open items are past due. Normalise so the UI treats them as such.
  const recs = records.map((r) => (monthPastDue && r.status === 'open' && !r.noReq ? { ...r, status: 'pending' as const } : r))
  const onStaff = recs.filter((r) => r.status === 'started').length
  const accepted = recs.filter((r) => r.status === 'accepted').length
  const filled = recs.filter((r) => r.status === 'started' || r.status === 'accepted')
  const active = recs.filter((r) => r.status === 'open' || r.status === 'pending')
  const pastDue = recs.filter((r) => r.status === 'pending').length
  const openN = recs.filter((r) => r.status === 'open').length
  const closed = recs.filter((r) => r.status === 'closed')

  // Location split across active+filled (not closed)
  const locSplit: Record<string, number> = {}
  records.filter((r) => r.status !== 'closed').forEach((r) => { locSplit[r.loc] = (locSplit[r.loc] || 0) + 1 })
  const LOC_TOKEN: Record<string, string> = { India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)' }

  const segs = [
    { label: 'on staff', n: onStaff, c: 'var(--electric-blue-600)' },
    { label: 'offer accepted', n: accepted, c: 'var(--badge-success-fg)' },
    { label: 'past due', n: pastDue, c: 'var(--badge-warning-fg)' },
    { label: 'open', n: openN, c: 'var(--electric-blue-100)' },
  ].filter((s) => s.n > 0)
  const segTotal = segs.reduce((a, s) => a + s.n, 0) || 1

  return (
    <div
      className="overflow-hidden flex-shrink-0 h-full"
      style={{ width: isOpen ? 420 : 0, marginLeft: isOpen ? 0 : -10, transition: `width ${SLIDE} ${EASING}, margin-left ${SLIDE} ${EASING}` }}
    >
      <div className="w-[420px] h-full bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between gap-2 border-b border-border">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight truncate">{row?.title}</span>
            </div>
            <span className="text-sm text-muted-foreground">{row?.monthLabel} · {row?.dept}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground"><X /></Button>
        </div>

        {/* Summary: status bar + location split */}
        <div className="px-5 py-4 border-b border-border flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
              {segs.map((s) => <span key={s.label} style={{ flex: s.n / segTotal, background: s.c }} />)}
            </div>
            <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
              {segs.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />{s.n} {s.label}
                </span>
              ))}
            </div>
          </div>
          {Object.keys(locSplit).length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Location split</span>
              <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
                {Object.entries(locSplit).map(([loc, n]) => (
                  <span key={loc} className="flex items-center gap-1.5 text-sm text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: LOC_TOKEN[loc] ?? 'var(--muted-foreground)' }} />{loc} {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-y-auto scrollbar-minimal flex-1">
          <SidePanelSection title={`Filled (${filled.length})`} defaultOpen>
            {filled.length ? filled.map((r) => <RecordRow key={r.id} rec={r} onExtend={() => onExtend(r.id)} onClose={() => onCloseRecord(r.id)} onPerson={onPerson} />)
              : <p className="text-sm text-muted-foreground pb-2">None filled yet.</p>}
          </SidePanelSection>

          <SidePanelSection title={`Open & past due (${active.length})`} defaultOpen>
            {active.length ? active.map((r) => <RecordRow key={r.id} rec={r} onExtend={() => onExtend(r.id)} onClose={() => onCloseRecord(r.id)} onPerson={onPerson} />)
              : <p className="text-sm text-muted-foreground pb-2">No open records.</p>}
          </SidePanelSection>

          {closed.length > 0 && (
            <SidePanelSection title={`Closed (${closed.length})`} defaultOpen={false}>
              {closed.map((r) => <RecordRow key={r.id} rec={r} onExtend={() => {}} onClose={() => {}} onPerson={onPerson} />)}
            </SidePanelSection>
          )}
        </div>
      </div>
    </div>
  )
}
