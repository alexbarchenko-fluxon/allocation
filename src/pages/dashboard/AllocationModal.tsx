import { useState, useMemo, useEffect, useRef } from 'react'
import { DraftingCompass, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { DateField } from './DateField'
import { TimelineMonths, TimelineLane, type TimelineBarData, type Period } from './AllocationTimeline'
import { buildWindow } from './timeline-scale'
import { useTrackWidth } from './useTrackWidth'
import { fmtDate } from './format'
import { MODAL_CANDIDATES, CANDIDATE_PERSON_MAP, type Seat, type CandidateTagTone, type ModalCandidate } from './data'
import { NewAllocationDialog } from './NewAllocationDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { PersonDetailsSidePanel } from '@/pages/PeoplePage'
import { MOCK_PEOPLE, PERSON_MAP } from '@/mocks/people'
import { cn } from '@/lib/utils'

const LEFT = 'w-[380px] shrink-0'

const TECH_SCOPE_OPTIONS = [
  { value: 'fullstack', label: 'Full Stack' },
  { value: 'frontend', label: 'Front End' },
  { value: 'backend', label: 'Back End' },
]

type CandStatus = 'proposed' | 'assigned'

const TAG_VARIANT: Record<CandidateTagTone, string> = {
  success: 'bg-badge-success border-badge-success-stroke text-badge-success-fg',
  dark: 'bg-[#111827] border-transparent text-white',
  orange: 'bg-badge-warning border-badge-warning-stroke text-badge-warning-fg',
  neutral: 'bg-badge-neutral border-badge-neutral-stroke text-badge-neutral-fg',
  blue: 'bg-[#e7ebff] border-transparent text-[#0e35ff]',
  // Canonical PA (pending approval) pill — Figma: #d1d5db bg, #111827 text.
  gray: 'bg-[#d1d5db] border-transparent text-[#111827] dark:bg-[#4b5563] dark:text-white',
}

function HoursField({ hours }: { hours: number }) {
  return (
    <span className="flex h-9 w-[72px] items-center rounded-md border border-input bg-[var(--input-bg)] px-2.5 text-sm text-foreground shadow-sm">
      {hours}h
    </span>
  )
}

const CAND_MAP = new Map(MODAL_CANDIDATES.map((c) => [c.id, c]))

export function AllocationModal({
  open, onOpenChange, seat,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  seat: Seat
}) {
  const { ref, width } = useTrackWidth()
  const [query, setQuery] = useState('')
  const [techScope, setTechScope] = useState<string[]>([])
  const [fullSpanOnly, setFullSpanOnly] = useState(false)
  const [excludeNewJoiners, setExcludeNewJoiners] = useState(false)
  const [shift, setShift] = useState(0)
  const win = useMemo(() => buildWindow(shift), [shift])

  // ── Allocation flow state ────────────────────────────────────────────────────
  const [status, setStatus] = useState<Record<string, CandStatus>>({})
  const [order, setOrder] = useState<string[]>([])            // allocated ids, most-recent first
  const [ranges, setRanges] = useState<Record<string, Period>>({})
  // Which candidate's profile is shown in the split-view side panel (null = closed).
  const [profileCandId, setProfileCandId] = useState<string | null>(null)
  // Candidate awaiting the "New Allocation" confirmation (null = dialog closed).
  const [confirmCand, setConfirmCand] = useState<ModalCandidate | null>(null)
  // Assigned candidate awaiting the "Delete Allocation" confirmation.
  const [removeCandId, setRemoveCandId] = useState<string | null>(null)
  // Fresh flow each time the modal opens (state 1 — no current allocation).
  useEffect(() => {
    if (open) { setStatus({}); setOrder([]); setRanges({}); setQuery(''); setTechScope([]); setShift(0); setActiveSection('current'); setProfileCandId(null); setConfirmCand(null); setRemoveCandId(null) }
  }, [open])

  // Resolve the profile-panel person from the clicked candidate (prototype mapping).
  const profilePerson = profileCandId
    ? (PERSON_MAP.get(CANDIDATE_PERSON_MAP[profileCandId] ?? '') ?? MOCK_PEOPLE[0])
    : null

  const projectPeriod: Period = { startDate: seat.startDate, endDate: seat.endDate }
  const setPeriod: Period = { startDate: seat.startDate, endDate: seat.endDate }
  const rangeFor = (id: string): Period => ranges[id] ?? { startDate: seat.startDate, endDate: seat.endDate }

  const shiftPrev = () => setShift((s) => Math.max(-6, s - 1))
  const shiftNext = () => setShift((s) => Math.min(6, s + 1))

  // Actions
  const propose = (id: string) => { setStatus((s) => ({ ...s, [id]: 'proposed' })); setOrder((o) => [id, ...o.filter((x) => x !== id)]) }
  const assign = (id: string) => { setStatus((s) => ({ ...s, [id]: 'assigned' })); setOrder((o) => [id, ...o.filter((x) => x !== id)]) }
  const reject = (id: string) => { setStatus((s) => { const n = { ...s }; delete n[id]; return n }); setOrder((o) => o.filter((x) => x !== id)) }
  const onBarChange = (id: string, next: Period) => setRanges((r) => ({ ...r, [id]: next }))

  // Current Allocation lane bars (proposed = orange + PA, assigned = blue).
  const allocatedIds = order.filter((id) => status[id])
  const currentBars: TimelineBarData[] = allocatedIds.map((id) => {
    const c = CAND_MAP.get(id)!
    const st = status[id]
    const r = rangeFor(id)
    return {
      id, startDate: r.startDate, endDate: r.endDate, label: c.name,
      tone: st === 'assigned' ? 'primary' : 'misalloc',
      badge: st === 'proposed' ? 'PA' : undefined, badgeTone: 'gray',
      avatar: c.avatar, draggable: true,
    }
  })

  // List: allocated (proposed/assigned) first in action order, then the rest.
  const q = query.toLowerCase()
  const listed = useMemo(() => {
    const scopeOk = (c: ModalCandidate | undefined) =>
      !!c && (techScope.length === 0 || techScope.includes(c.scope))
    const match = (id: string) => {
      const c = CAND_MAP.get(id)
      return !!c && c.name.toLowerCase().includes(q) && scopeOk(c)
    }
    const alloc = allocatedIds.filter(match).map((id) => CAND_MAP.get(id)!)
    const rest = MODAL_CANDIDATES.filter((c) => !status[c.id] && c.name.toLowerCase().includes(q) && scopeOk(c))
    return [...alloc, ...rest]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, techScope, order, status])

  const CONTROLS_H = 44

  // The single timeline control is pinned; its section label follows scroll:
  // once the New Allocations filters reach the top, the label swaps.
  const bodyRef = useRef<HTMLDivElement>(null)
  const newTitleRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<'current' | 'new'>('current')
  const onScroll = () => {
    const body = bodyRef.current, t = newTitleRef.current
    if (!body || !t) return
    // Flip once the New Allocations title tucks up behind the pinned control.
    setActiveSection(body.scrollTop + CONTROLS_H >= t.offsetTop - 1 ? 'new' : 'current')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-40px)] max-h-[900px] w-[calc(100vw-40px)] max-w-[1400px] flex-col gap-0 overflow-hidden p-0">
        {/* Navbar — spans the full modal width, above the list/profile split. */}
        <div className="flex h-[64px] flex-shrink-0 items-center gap-3 border-b border-border px-6">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <DraftingCompass className="h-5 w-5" />
          </span>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {seat.role} Seat
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-normal text-foreground">{fmtDate(seat.startDate)} – {fmtDate(seat.endDate)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-normal text-foreground">{seat.hoursPerWeek}h <span className="text-muted-foreground">/week</span></span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-normal text-foreground">{seat.weeks} weeks</span>
            {!seat.billable && <Badge variant="blue" className="ml-1 text-[10px]">NB</Badge>}
          </DialogTitle>
        </div>

        {/* Body: candidate list + profile split, both sitting below the navbar.
            Muted backdrop so the (white) profile side panel reads as its own card. */}
        <div className="flex min-h-0 flex-1 flex-row gap-[10px] bg-muted">

        {/* Scroll body */}
        <div ref={bodyRef} onScroll={onScroll} className="scrollbar-panel relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">

          {/* Single timeline control (bottom layer) — pinned; the label reflects
              whichever section is crossing it. Never duplicated. */}
          <div className="sticky top-0 z-30 flex items-center border-b border-border bg-muted" style={{ height: CONTROLS_H }}>
            <div className={cn(LEFT, 'px-6')}>
              <span className="text-sm font-medium text-foreground">{activeSection === 'new' ? 'New Allocations' : 'Current Allocation'}</span>
            </div>
            <div className="relative min-w-0 flex-1">
              <div ref={ref} className="w-full pt-1"><TimelineMonths width={width} win={win} /></div>
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-primary">
                <button type="button" onClick={shiftPrev} className="flex size-6 items-center justify-center rounded bg-muted hover:bg-accent"><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={shiftNext} className="flex size-6 items-center justify-center rounded bg-muted hover:bg-accent"><ChevronRight className="h-5 w-5" /></button>
              </div>
            </div>
          </div>

          {/* Current Allocation content */}
          <div className="flex items-stretch border-b border-border">
            <div className={cn(LEFT, 'flex items-center gap-2 px-6 py-3')}>
              <DateField iso={seat.startDate} icon={false} className="w-[100px]" />
              <span className="text-muted-foreground">–</span>
              <DateField iso={seat.endDate} icon={false} className="w-[100px]" />
            </div>
            <div className="min-w-0 flex-1">
              <TimelineLane width={width} win={win} bars={currentBars} projectPeriod={projectPeriod} setPeriod={setPeriod} onChange={onBarChange} />
            </div>
          </div>

          {/* New Allocations title — its own gray bar; tucks behind the control
              (z below it) as you scroll, so the control's label becomes its title. */}
          <div ref={newTitleRef} className="sticky top-0 z-10 flex items-center border-b border-border bg-muted px-6" style={{ height: CONTROLS_H }}>
            <span className="text-sm font-medium text-foreground">New Allocations</span>
          </div>

          {/* New Allocations filters — stick just beneath the timeline control */}
          <div className="sticky z-20 flex flex-wrap items-center gap-3 border-b border-border bg-muted px-6 py-3" style={{ top: CONTROLS_H }}>
            <DateField iso={seat.startDate} icon={false} className="w-[100px]" />
            <span className="text-muted-foreground">–</span>
            <DateField iso={seat.endDate} icon={false} className="w-[100px]" />
            <HoursField hours={20} />
            <div className="relative w-[280px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search People" className="h-9 pl-8" />
            </div>
            <FilterMultiSelect label="By technical scope" options={TECH_SCOPE_OPTIONS} value={techScope} onChange={setTechScope} />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={fullSpanOnly} onCheckedChange={setFullSpanOnly} /> Fits full span only
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={excludeNewJoiners} onCheckedChange={setExcludeNewJoiners} /> Exclude new joiners
            </label>
          </div>

          {/* Candidate list */}
          {listed.map((c) => {
            const st = status[c.id]
            const tinted = !!st
            const rowBg = st === 'assigned'
              ? 'bg-[#f0fdf4] dark:bg-[#052e16]'      // green-50
              : st === 'proposed'
                ? 'bg-[#f3f4f6] dark:bg-[#1f2937]'    // gray-100
                : ''
            return (
              <div
                key={c.id}
                className={cn('group relative flex w-full items-stretch border-b border-border text-left transition-colors', rowBg)}
              >
                <div className={cn(LEFT, 'flex items-center gap-3 px-6 py-3')}>
                  <button
                    type="button"
                    onClick={() => setProfileCandId(c.id)}
                    aria-label={`View ${c.name}'s profile`}
                    className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img src={c.avatar} alt="" className="size-10 rounded-full object-cover" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setProfileCandId(c.id)}
                        className="text-base leading-[22px] text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        {c.name}
                      </button>
                      <span className="rounded-full border border-badge-success-stroke bg-badge-success px-2 py-0.5 text-xs font-medium text-badge-success-fg">{c.hoursLabel}</span>
                      {c.tags.map((t) => (
                        <span key={t.label} className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', TAG_VARIANT[t.tone])}>{t.label}</span>
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.role}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <TimelineLane
                    width={width} win={win} bars={c.bars as TimelineBarData[]} height={64}
                    projectPeriod={projectPeriod} setPeriod={setPeriod}
                    laneClassName={tinted ? 'bg-transparent' : 'bg-[#f8fafc] dark:bg-[#0f1729]'}
                  />
                </div>
                {/* Full-row hover highlight — spans person column + timeline. */}
                <div className="pointer-events-none absolute inset-0 bg-foreground/[0.04] opacity-0 transition-opacity group-hover:opacity-100" />
                {/* Right side — status by default, actions on hover (they swap). */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  {st && (
                    <span className={cn('text-sm group-hover:hidden', st === 'assigned' ? 'text-badge-success-fg' : 'text-muted-foreground')}>
                      {st === 'assigned' ? 'Assigned' : 'Proposed'}
                    </span>
                  )}
                  <div className="hidden items-center gap-2 group-hover:flex">
                    {st === 'assigned' ? (
                      <button
                        type="button"
                        onClick={() => setRemoveCandId(c.id)}
                        title={`Remove ${c.name}`}
                        className="flex size-9 items-center justify-center rounded-md bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : st === 'proposed' ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => reject(c.id)} className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">Reject</Button>
                        <Button size="sm" onClick={() => setConfirmCand(c)}>Assign</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => propose(c.id)}>Propose</Button>
                        <Button size="sm" onClick={() => setConfirmCand(c)}>Assign</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {listed.length === 0 && <p className="px-6 py-6 text-sm text-muted-foreground">No matching people.</p>}
        </div>

        {/* Profile split view — sits inside the modal, below the navbar, and
            pushes the candidate list narrower when open. */}
        <PersonDetailsSidePanel
          person={profilePerson}
          isOpen={!!profileCandId}
          onClose={() => setProfileCandId(null)}
        />
        </div>
      </DialogContent>

      {/* Assign confirmation — "New Allocation" */}
      <NewAllocationDialog
        open={!!confirmCand}
        onOpenChange={(v) => { if (!v) setConfirmCand(null) }}
        candidate={confirmCand}
        period={confirmCand ? rangeFor(confirmCand.id) : projectPeriod}
        hoursPerWeek={20}
        onPropose={() => { if (confirmCand) propose(confirmCand.id); setConfirmCand(null) }}
        onConfirm={() => { if (confirmCand) assign(confirmCand.id); setConfirmCand(null) }}
      />

      {/* Remove confirmation — "Delete Allocation" */}
      {(() => {
        const c = removeCandId ? CAND_MAP.get(removeCandId) : null
        if (!c) return null
        const r = rangeFor(c.id)
        return (
          <DeleteConfirmDialog
            open={!!removeCandId}
            onOpenChange={(v) => { if (!v) setRemoveCandId(null) }}
            title="Delete Allocation"
            fields={[
              { label: 'Employee', value: c.name },
              { label: 'Allocation role', value: c.role },
              { label: 'Start-End date', value: `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}` },
            ]}
            warning={new Date(r.startDate).getTime() < Date.now()
              ? 'Start date of the allocation is in past. Deleting this allocation may cause unexpected impact on the billing for past billing cycle.'
              : undefined}
            onConfirm={() => { reject(c.id); setRemoveCandId(null) }}
          />
        )
      })()}
    </Dialog>
  )
}
