import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Check, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateField } from './DateField'
import { TimelineMonths, TimelineMarkers, TimelineLane, type TimelineBarData, type BarConflict, type Period } from './AllocationTimeline'
import { buildWindow, addDaysISO, makeScale } from './timeline-scale'
import { useTrackWidth } from './useTrackWidth'
import { fmtDate, weeksBetween, daysBetween } from './format'
import { MODAL_CANDIDATES, DASH_PERSON_MAP, PERSON_BADGE_PILL, PERSON_BADGE_STYLE, type Seat, type DashProject, type ModalCandidate, type CandidateBar, type SeatAllocation, type AllocConflict } from './data'
import { NewAllocationDialog } from './NewAllocationDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { cn } from '@/lib/utils'

const LEFT = 'w-[380px] shrink-0'

type CandStatus = 'proposed' | 'assigned'

// The default requested hours in the modal filter. The hero seat is 40h/week,
// but a 20h request is the demo scenario the candidate data is modelled around.
const DEFAULT_REQ_HOURS = 20

// ── Availability math ─────────────────────────────────────────────────────────
// Only confirmed commitments reduce free hours; TA (tentative) projects,
// PA (proposed) allocations, OOO and flags do NOT.
const reducesHours = (b: CandidateBar) =>
  b.hours != null &&
  (b.tone === 'assigned' || b.tone === 'available') &&
  !b.badges?.some((x) => x.label === 'TA')

interface CandStats {
  /** Lowest free hours/week anywhere in the requested range. */
  freeHours: number
  /** Weeks within the range where free hours fall below the request (0 = fits). */
  conflictWeeks: number
  ooo: boolean
}

// Day sweep across the requested period: free = capacity − confirmed committed
// hours that day. The badge shows the worst (minimum) free hours; every day
// below the requested hours counts toward the conflict weeks.
function candStats(c: ModalCandidate, period: Period, reqHours: number): CandStats {
  let free = c.capacity
  let conflictDays = 0
  for (let d = period.startDate; d <= period.endDate; d = addDaysISO(d, 1)) {
    const committed = c.bars.reduce(
      (n, b) => (reducesHours(b) && b.startDate <= d && d <= b.endDate ? n + (b.hours ?? 0) : n), 0)
    const f = Math.max(0, c.capacity - committed)
    if (f < free) free = f
    if (f < reqHours) conflictDays++
  }
  // OOO only raises the tag when the time off lands on the *first week* of the
  // allocation — that's its most disruptive point (the person is out as the seat
  // kicks off). Time off buried later in the window doesn't flag. First week =
  // the first 7 days of the period, clamped to the end for sub-week windows.
  const firstWeekEnd = minISO(addDaysISO(period.startDate, 6), period.endDate)
  return {
    freeHours: free,
    conflictWeeks: conflictDays === 0 ? 0 : Math.max(1, Math.round(conflictDays / 7)),
    ooo: c.bars.some(
      (b) => b.tone === 'ooo' && b.startDate <= firstWeekEnd && b.endDate >= period.startDate,
    ),
  }
}

// Candidate ordering for the list:
//   exact hours match → more free hours than requested → has time off → has conflicts.
// Time off and conflicts trump the hours comparison; when conflict-free, free
// hours are always ≥ requested, so "not exact" means "more than requested".
const candRank = (s: CandStats, reqHours: number): number => {
  if (s.conflictWeeks > 0) return 3  // has conflicts (last)
  if (s.ooo) return 2                // has time off
  return s.freeHours === reqHours ? 0 : 1
}

const CAND_MAP = new Map(MODAL_CANDIDATES.map((c) => [c.id, c]))

// Plan entries are keyed by a unique instance id ("candId#n") rather than by the
// candidate id, so one person can hold several non-crossing slots in the same
// seat (e.g. Jun–Jul, then Jul–Nov). candIdOf recovers the underlying candidate.
const candIdOf = (planId: string) => planId.split('#')[0]

const maxISO = (a: string, b: string) => (a > b ? a : b)
const minISO = (a: string, b: string) => (a < b ? a : b)

// Two windows cross when they share more than a shared endpoint — adjacent
// periods that merely touch (Jul 15 – Jul 15) do NOT cross.
const crosses = (a: Period, b: Period) =>
  a.startDate < b.endDate && b.startDate < a.endDate

// A plan entry can come from two people universes: the seat's own allocations
// (DASH_PEOPLE, keyed "p-…") seeded when the modal opens so the board card, the
// sidebar and this modal all show the same person; or a candidate booked from
// the search list (MODAL_CANDIDATES, keyed "c-…"). candIdOf recovers whichever.
function planPersonOf(planId: string): { name: string; avatar: string; role: string } {
  const id = candIdOf(planId)
  const dash = DASH_PERSON_MAP.get(id)
  if (dash) return { name: dash.name, avatar: dash.avatar, role: dash.role }
  const c = CAND_MAP.get(id)!
  return { name: c.name, avatar: c.avatar, role: c.role }
}

// Compact label for the allocation-plan header: surname first, given-name
// initial ("Ethan Thompson" → "Thompson E."). Names that are already
// abbreviated to a trailing initial (a booked candidate's "Maya R.") are left
// as-is — they're short already, and reversing them would drop the given name.
function planShortName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  const last = parts[parts.length - 1]
  if (/^[A-Za-z]\.?$/.test(last)) return name
  return `${last} ${parts[0][0]}.`
}

// A seeded person's own commitments live on the allocation's `conflicts` (the
// same list the sidebar renders under a proposed candidate). Shape them into the
// expanded plan row's schedule bars + the bar's hover-tooltip conflicts.
function conflictsToRowBars(conflicts: AllocConflict[]): TimelineBarData[] {
  return conflicts.map((cf, i) => ({
    id: `cf-${i}`, startDate: cf.startDate, endDate: cf.endDate,
    hours: cf.hoursPerWeek, label: cf.project, tone: 'available',
    badges: cf.badge ? [{ label: cf.badge }] : undefined,
  }))
}
function conflictsToBarConflicts(conflicts: AllocConflict[]): BarConflict[] {
  return conflicts.map((cf) => ({
    label: cf.project, startDate: cf.startDate, endDate: cf.endDate, note: cf.badge,
  }))
}

// One row per person (Figma 4774-52144): project bars that overlap in time are
// merged into a single segmented bar ("20h Allox · 20h Spark") instead of being
// stacked on parallel rows. OOO / flag bars stay separate (they never stack in
// the mock data, so the row still reads as a single lane).
function toRowBars(bars: ModalCandidate['bars']): TimelineBarData[] {
  const isProject = (b: ModalCandidate['bars'][number]) => b.tone !== 'ooo' && b.tone !== 'flag'
  const projects = bars.filter(isProject).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const others = bars.filter((b) => !isProject(b)) as unknown as TimelineBarData[]
  const groups: (typeof projects)[] = []
  let groupEnd = ''
  for (const b of projects) {
    const g = groups[groups.length - 1]
    if (g && b.startDate <= groupEnd) { g.push(b); if (b.endDate > groupEnd) groupEnd = b.endDate }
    else { groups.push([b]); groupEnd = b.endDate }
  }
  const merged: TimelineBarData[] = groups.map((g) => ({
    id: g.map((x) => x.id).join('+'),
    startDate: g.reduce((m, x) => (x.startDate < m ? x.startDate : m), g[0].startDate),
    endDate: g.reduce((m, x) => (x.endDate > m ? x.endDate : m), g[0].endDate),
    segments: g.map((x) => ({ hours: x.hours, label: x.label ?? '', startDate: x.startDate, endDate: x.endDate })),
    tone: g.some((x) => x.tone === 'proposed') ? 'proposed' : 'available',
    badges: g.flatMap((x) => x.badges ?? []).filter((b, i, a) => a.findIndex((y) => y.label === b.label) === i),
  }))
  return [...merged, ...others]
}

// The only three user badges a candidate row can show (Figma 4397-30884).
// A person who can cover the requested hours gets the green "• Nh" free-hours
// pill (plus gray "OOO" when they're out during the allocation's first week);
// one who can't gets ONLY the red "Nw conflict" pill.
function UserBadges({ s }: { s: CandStats }) {
  if (s.conflictWeeks > 0) {
    return (
      <span className="rounded-full border border-badge-error-stroke bg-badge-error px-2 py-0.5 text-xs font-medium text-badge-error-fg">
        {s.conflictWeeks}w conflict
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1">
      <span className="flex items-center rounded-full border border-badge-success-stroke bg-badge-success py-0.5 pl-1 pr-2 text-xs font-medium text-badge-success-fg">
        <span className="flex size-3 items-center justify-center">
          <span className="size-1 rounded-full bg-current" />
        </span>
        {s.freeHours}h
      </span>
      {s.ooo && (
        <span className="rounded-full bg-[var(--timeline-assigned-stroke)] px-2 py-0.5 text-xs font-medium text-[var(--timeline-assigned-fg)]">
          OOO
        </span>
      )}
    </span>
  )
}

export function AllocationModal({
  open, onOpenChange, seat, project, allocations,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  seat: Seat
  project?: DashProject | null
  /** The seat's effective allocations (override-aware) — the same list the board
   *  card + sidebar render from. Seeds the plan so all three surfaces agree. */
  allocations: SeatAllocation[]
}) {
  const { ref, width } = useTrackWidth()
  const [query, setQuery] = useState('')
  const [shift, setShift] = useState(0)
  const win = useMemo(
    () => buildWindow({ startDate: seat.startDate, endDate: seat.endDate }, shift),
    [seat.startDate, seat.endDate, shift],
  )

  // Allocation period — starts equal to the seat window. Editing the date range
  // (or dragging the empty plan bar) reshapes the gray "period box" that runs
  // across every candidate row.
  const [allocPeriod, setAllocPeriod] = useState<Period>({ startDate: seat.startDate, endDate: seat.endDate })
  // Requested hours/week — the editable hours filter. Availability badges are
  // computed against this: free ≥ requested → green pill, less → conflict.
  const [reqHours, setReqHours] = useState(DEFAULT_REQ_HOURS)

  // ── Allocation flow state ────────────────────────────────────────────────────
  const [status, setStatus] = useState<Record<string, CandStatus>>({})
  const [order, setOrder] = useState<string[]>([])            // plan ids, most-recent first
  const [ranges, setRanges] = useState<Record<string, Period>>({})
  // Seeded plan entries → their source seat allocation (for conflict sub-bars).
  // Only holds entries seeded from the seat; candidate-booked entries resolve via
  // CAND_MAP instead, so their id is absent here.
  const [seed, setSeed] = useState<Record<string, SeatAllocation>>({})
  // The candidate currently picked in the list (drives the footer). Single-select.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Whether the allocation plan is expanded to show each person's own schedule.
  const [planOpen, setPlanOpen] = useState(false)
  // Candidate awaiting the "New Allocation" confirmation (null = dialog closed).
  const [confirmCand, setConfirmCand] = useState<ModalCandidate | null>(null)
  // Plan entry (instance id) awaiting the "Delete Allocation" confirmation.
  const [removePlanId, setRemovePlanId] = useState<string | null>(null)
  // Monotonic counter minting unique plan-entry ids ("candId#n").
  const planSeq = useRef(0)

  // On open, seed the allocation plan from the seat's own allocations so the
  // modal shows the SAME people as the board card + sidebar (filled → current
  // holder, proposed → PA candidate, combinations → the whole hand-off). Past
  // allocations sit before the timeline window (and would skew the plan summary),
  // so only current / upcoming / proposed seed. An open seat seeds nothing → the
  // empty draggable window, exactly as before.
  useEffect(() => {
    if (!open) return
    const nextStatus: Record<string, CandStatus> = {}
    const nextRanges: Record<string, Period> = {}
    const nextSeed: Record<string, SeatAllocation> = {}
    const ids: string[] = []
    const placed: Period[] = []
    planSeq.current = 0
    // A seat is a single-track timeline — one person per period, no alternatives.
    // Committed slots win first (current, then upcoming), then proposed; any
    // allocation that would overlap an already-placed one is left OUT of the plan
    // lane (competing proposals for one slot still show in the sidebar's Proposed
    // list, which is a shortlist, not a timeline). Past sits before the window.
    const rank = { current: 0, upcoming: 1, proposed: 2, past: 9 } as const
    const ordered = [...allocations]
      .filter((a) => a.status !== 'past')
      .sort((a, b) => rank[a.status] - rank[b.status] || a.startDate.localeCompare(b.startDate))
    for (const a of ordered) {
      const range = { startDate: a.startDate, endDate: a.endDate }
      if (placed.some((p) => crosses(p, range))) continue
      placed.push(range)
      const id = `${a.personId}#${planSeq.current++}`
      nextStatus[id] = a.status === 'proposed' ? 'proposed' : 'assigned'
      nextRanges[id] = range
      nextSeed[id] = a
      ids.push(id)
    }
    setStatus(nextStatus); setRanges(nextRanges); setSeed(nextSeed)
    setOrder(ids.reverse())   // most-recent first, matching `allocate`
    setQuery(''); setShift(0)
    setSelectedId(null); setPlanOpen(false)
    setConfirmCand(null); setRemovePlanId(null)
    setAllocPeriod({ startDate: seat.startDate, endDate: seat.endDate })
    setReqHours(DEFAULT_REQ_HOURS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Seat span → blue band (fixed reference). Allocation span → gray dashed band.
  const projectPeriod: Period = { startDate: seat.startDate, endDate: seat.endDate }
  const setPeriod: Period = allocPeriod
  // The project runs a while past the seat's own window — marks the "project ends" line.
  const projectEndDate = addDaysISO(seat.endDate, 35)
  const rangeFor = (id: string): Period => ranges[id] ?? allocPeriod

  // A plan entry's own schedule (expanded row) + hover-tooltip conflicts. A
  // candidate booked from the list brings their MODAL_CANDIDATES schedule; a
  // person seeded from the seat brings the allocation's `conflicts`.
  const planRowBars = (planId: string): TimelineBarData[] => {
    const c = CAND_MAP.get(candIdOf(planId))
    if (c) return toRowBars(c.bars)
    const a = seed[planId]
    return a?.conflicts ? conflictsToRowBars(a.conflicts) : []
  }
  const planConflicts = (planId: string): BarConflict[] => {
    const c = CAND_MAP.get(candIdOf(planId))
    if (c) {
      return c.bars
        .filter((b) => b.tone !== 'flag')
        .map((b) => ({
          label: b.tone === 'ooo' ? 'Time-Off' : b.label ?? 'Project',
          startDate: b.startDate, endDate: b.endDate,
          note: b.badges?.some((x) => x.label === 'TA') ? 'TA' : undefined,
        }))
    }
    const a = seed[planId]
    return a?.conflicts ? conflictsToBarConflicts(a.conflicts) : []
  }
  // "Today" sits a week before the range start, so the marker reads just ahead of
  // the allocation window rather than buried inside it.
  const today = addDaysISO(seat.startDate, -7)

  const shiftPrev = () => setShift((s) => Math.max(-6, s - 1))
  const shiftNext = () => setShift((s) => Math.min(6, s + 1))

  // Plan ids (in the order they were added, newest first).
  const planIds = order.filter((id) => status[id])
  const hasPlan = planIds.length > 0
  // Chronological order (by start) — how the hand-off reads on the timeline.
  const planSorted = [...planIds].sort((a, b) => rangeFor(a).startDate.localeCompare(rangeFor(b).startDate))

  // ── Actions ────────────────────────────────────────────────────────────────
  // Committing snapshots a range for the new plan entry, laid out as a sequential
  // hand-off (a relay, not a stack): the first person takes the whole window; the
  // second splits it — the outgoing person rolls off at the hand-off point and the
  // newcomer picks up the tail; a third+ appends after the latest end.
  const allocate = (candId: string, st: CandStatus) => {
    const existing = planIds
    // Fresh instance id so the same person can hold more than one slot.
    const id = `${candId}#${planSeq.current++}`
    setStatus((s) => ({ ...s, [id]: st }))
    setOrder((o) => [id, ...o])
    setRanges((r) => {
      if (existing.length === 0) return { ...r, [id]: allocPeriod }
      if (existing.length === 1) {
        const prev = existing[0]
        const prevRange = r[prev] ?? allocPeriod
        // Retargeted window (e.g. a clicked open spot) that doesn't overlap the
        // sitting person: the newcomer just takes the window — no hand-off split.
        if (allocPeriod.endDate <= prevRange.startDate || allocPeriod.startDate >= prevRange.endDate)
          return { ...r, [id]: allocPeriod }
        const total = daysBetween(allocPeriod.startDate, allocPeriod.endDate)
        const handoff = addDaysISO(allocPeriod.startDate, Math.max(7, Math.round(total / 2)))
        if (handoff >= allocPeriod.endDate) return { ...r, [id]: allocPeriod }
        return {
          ...r,
          [prev]: { startDate: prevRange.startDate, endDate: handoff },
          [id]: { startDate: handoff, endDate: allocPeriod.endDate },
        }
      }
      const latestEnd = existing.reduce((m, x) => maxISO(m, (r[x] ?? allocPeriod).endDate), allocPeriod.startDate)
      const start = latestEnd < allocPeriod.endDate ? latestEnd : allocPeriod.startDate
      return { ...r, [id]: { startDate: start, endDate: allocPeriod.endDate } }
    })
    setSelectedId(null)
  }
  const propose = (id: string) => allocate(id, 'proposed')
  const assign = (id: string) => allocate(id, 'assigned')
  const remove = (id: string) => {
    setStatus((s) => { const n = { ...s }; delete n[id]; return n })
    setOrder((o) => o.filter((x) => x !== id))
    setRanges((r) => { const n = { ...r }; delete n[id]; return n })
    setSeed((s) => { const n = { ...s }; delete n[id]; return n })
  }
  const onBarChange = (id: string, next: Period) => setRanges((r) => ({ ...r, [id]: next }))

  // The active assigned entry = earliest-starting one that hasn't ended. Reads as
  // "current" (blue) even when today is just before it (Figma 4397-40124).
  const currentAssignedId = planIds
    .filter((id) => status[id] === 'assigned' && rangeFor(id).endDate >= today)
    .sort((a, b) => rangeFor(a).startDate.localeCompare(rangeFor(b).startDate))[0]

  const toneFor = (id: string): TimelineBarData['tone'] => {
    const st = status[id]
    const r = rangeFor(id)
    if (st === 'assigned') {
      if (r.endDate < today) return 'past'
      return id === currentAssignedId ? 'current' : 'nextAssigned'
    }
    // Proposed allocations always read purple (Figma 4774-51024); a scheduling
    // clash is surfaced by the overlap hatch + tooltip, not by the bar colour.
    return 'proposed'
  }

  // Plan-lane bars — one per plan person, at their recorded range.
  const planBars: TimelineBarData[] = planIds.map((id) => {
    const p = planPersonOf(id)
    const st = status[id]
    const r = rangeFor(id)
    return {
      id, startDate: r.startDate, endDate: r.endDate, label: p.name,
      tone: toneFor(id),
      badges: st === 'proposed' ? [{ label: 'PA', tone: 'gray' }] : undefined,
      conflicts: planConflicts(id),
      avatar: p.avatar, draggable: true,
    }
  })
  // Empty-state: a single dashed box spanning the allocation window, draggable to
  // reshape the period (which reshapes the gray band across candidates).
  const emptyBar: TimelineBarData = {
    id: 'alloc-empty', startDate: allocPeriod.startDate, endDate: allocPeriod.endDate,
    tone: 'empty', draggable: true,
  }
  // Seat time the plan bars leave uncovered — each gap draws a light-blue dashed
  // box in the plan lane (Figma 4774-50251), so a partial plan still shows the
  // rest of the seat window as open.
  const seatRest: Period[] = (() => {
    const rest: Period[] = []
    let cursor = projectPeriod.startDate
    for (const id of planSorted) {
      const r = rangeFor(id)
      const gapEnd = minISO(r.startDate, projectPeriod.endDate)
      if (gapEnd > cursor) rest.push({ startDate: cursor, endDate: gapEnd })
      cursor = maxISO(cursor, r.endDate)
    }
    if (cursor < projectPeriod.endDate) rest.push({ startDate: cursor, endDate: projectPeriod.endDate })
    return rest
  })()

  // Per-candidate availability vs the requested hours + period (drives badges,
  // conflict tinting and list order).
  const stats = useMemo(
    () => new Map(MODAL_CANDIDATES.map((c) => [c.id, candStats(c, allocPeriod, reqHours)])),
    [allocPeriod, reqHours],
  )
  const statsFor = (id: string): CandStats => stats.get(id)!

  // Candidate list — most available first. A person already in the plan stays
  // listed (and bookable again) as long as none of their slots cross the current
  // allocation window; a slot that crosses it hides them for that window.
  const q = query.toLowerCase()
  const listed = useMemo(
    () => MODAL_CANDIDATES
      .filter((c) => {
        if (!c.name.toLowerCase().includes(q)) return false
        const booked = planIds.some(
          (pid) => candIdOf(pid) === c.id && crosses(rangeFor(pid), allocPeriod),
        )
        return !booked
      })
      .sort((a, b) => candRank(statsFor(a.id), reqHours) - candRank(statsFor(b.id), reqHours)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, order, status, ranges, allocPeriod, stats, reqHours],
  )

  const CONTROLS_H = 44
  // Plan-lane height — the bar centres in this, with the day caps overlaid at top.
  // 96px matches the allocation-plan section in Figma.
  const PLAN_H = 96

  const selectedCand = selectedId ? CAND_MAP.get(selectedId) ?? null : null

  // ── Overlap guard (Figma 4682-41796) ─────────────────────────────────────────
  // A new person can't take a window that crosses someone already holding the
  // seat — allocations on one seat never overlap. When the allocation period
  // crosses any existing plan allocation, Propose/Assign are disabled and the
  // footer explains the way out: shrink/move the date range to a free slot, or
  // remove the crossing allocation.
  const crossesPlan = planIds.some((id) => crosses(rangeFor(id), allocPeriod))

  // ── Plan summary (left column of the allocation-plan section) ────────────────
  const PlanSummary = () => {
    if (!hasPlan) {
      return (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40" />
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground">No Allocation</p>
            <p className="text-xs text-muted-foreground">
              Since {fmtDate(allocPeriod.startDate)} · {weeksBetween(allocPeriod.startDate, allocPeriod.endDate)}w
            </p>
          </div>
        </div>
      )
    }
    const multi = planSorted.length > 1
    const names = planSorted.map((id) => planShortName(planPersonOf(id).name))
    const first = planSorted[0]
    const r0 = rangeFor(first)
    return (
      <div className="flex items-center gap-3">
        {multi ? (
          <div className="flex shrink-0 -space-x-2">
            {planSorted.slice(0, 3).map((id) => (
              // Neutral background ring only — separates the overlapping stack; no
              // status colour on the avatars themselves (Figma 4774-51024).
              <img key={id} src={planPersonOf(id).avatar} alt="" className="size-9 rounded-full object-cover ring-2 ring-background" />
            ))}
          </div>
        ) : (
          <img src={planPersonOf(first).avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-base font-medium text-foreground">
            {multi ? (
              names.map((n, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  {n}
                </span>
              ))
            ) : (
              planShortName(planPersonOf(first).name)
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {multi
              ? `Upcoming change ${fmtDate(rangeFor(planSorted[1]).startDate)}`
              : `${fmtDate(r0.startDate)} – ${fmtDate(r0.endDate)}`}
          </p>
        </div>
        {/* Expand/collapse only makes sense with a hand-off (2+ people); a single
            person is already fully named here, so no dropdown (Figma 4668-31373). */}
        {multi && (
          <button
            type="button"
            onClick={() => setPlanOpen((v) => !v)}
            aria-label={planOpen ? 'Collapse plan' : 'Expand plan'}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
          >
            {planOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
    )
  }

  // One expanded plan person — their own schedule, mirroring a candidate row.
  // Only rendered for a multi-person hand-off, so each row names its own person
  // in the left column (Figma 4751-177821).
  const PlanPersonRow = ({ id, showUser }: { id: string; showUser: boolean }) => {
    const p = planPersonOf(id)
    const cand = CAND_MAP.get(candIdOf(id))
    return (
      <div className="group relative flex items-stretch border-t border-border">
        <div className={cn(LEFT, 'flex items-center gap-3 px-6 py-3')}>
          {showUser && (
            <>
              <img src={p.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-base leading-[22px] text-foreground">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.role}</p>
              </div>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* The blue dashed box spans THIS person's own slot in the plan (not the
              whole allocation window), so it lines up with their bar in the summary
              above (Figma 4751-173774). */}
          <TimelineLane
            width={width} win={win} bars={planRowBars(id)} height={64}
            today={today} projectPeriod={projectPeriod} setPeriod={rangeFor(id)} projectEndDate={projectEndDate}
            allocBox conflict={cand ? statsFor(cand.id).conflictWeeks > 0 : false}
            laneClassName="bg-[#f9fafb] dark:bg-[#0f1729]"
          />
        </div>
        {/* Full-row hover highlight — same blue-100 @20% as the candidate rows. */}
        <div className="pointer-events-none absolute inset-0 bg-[#dbeafe]/20 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#1e3a8a]/20" />
        {/* Remove this person from the plan (on hover). */}
        <button
          type="button"
          onClick={() => setRemovePlanId(id)}
          title={`Remove ${p.name}`}
          className="absolute right-6 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-extended-hover group-hover:flex"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[calc(100vh-40px)] max-h-[1040px] w-[calc(100vw-40px)] max-w-[1880px] flex-col gap-0 overflow-hidden p-0">
        {/* Navbar */}
        <div className="flex h-[64px] flex-shrink-0 items-center gap-3 border-b border-border px-6">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            {seat.role} Seat
            {project && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm font-normal text-foreground">{project.client}</span>
              </>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-normal text-foreground">{fmtDate(seat.startDate)} – {fmtDate(seat.endDate)}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-normal text-foreground">{seat.hoursPerWeek}h <span className="text-muted-foreground">/week</span></span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-normal text-foreground">{seat.weeks} weeks</span>
            {!seat.billable && <span className={cn(PERSON_BADGE_PILL, PERSON_BADGE_STYLE.NB, 'ml-1')}>NB</span>}
          </DialogTitle>
        </div>

        {/* Body: candidate list. */}
        <div className="flex min-h-0 flex-1 flex-row gap-[10px] bg-muted">

          {/* Left column — scroll body + (conditional) selection footer. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
            <div className="scrollbar-panel relative min-h-0 flex-1 overflow-y-auto">

              {/* Pinned control — section label + month header + pan arrows. */}
              <div className="sticky top-0 z-30 flex items-center border-b border-border bg-muted" style={{ height: CONTROLS_H }}>
                <div className={cn(LEFT, 'px-6')}>
                  <span className="text-sm font-medium text-foreground">Allocation plan</span>
                </div>
                <div className="relative min-w-0 flex-1">
                  <div ref={ref} className="w-full pt-1"><TimelineMonths width={width} win={win} /></div>
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 text-primary">
                    <button type="button" onClick={shiftPrev} className="flex size-6 items-center justify-center rounded bg-muted hover:bg-accent"><ChevronLeft className="h-5 w-5" /></button>
                    <button type="button" onClick={shiftNext} className="flex size-6 items-center justify-center rounded bg-muted hover:bg-accent"><ChevronRight className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>

              {/* Allocation-plan summary row + timeline. The day caps overlay the top
                  of the lane (rather than sitting in their own row) so the summary
                  info and the bar stay vertically centred in the plan block. */}
              <div className="flex items-stretch border-b border-border">
                <div className={cn(LEFT, 'flex items-center px-6 py-3')}>
                  <div className="min-w-0 flex-1"><PlanSummary /></div>
                </div>
                <div className="relative min-w-0 flex-1">
                  {hasPlan ? (
                    <TimelineLane width={width} win={win} bars={planBars} height={PLAN_H} today={today} projectPeriod={projectPeriod} setPeriod={setPeriod} projectEndDate={projectEndDate} restPeriods={seatRest} onRestClick={setAllocPeriod} onChange={onBarChange} />
                  ) : (
                    <TimelineLane width={width} win={win} bars={[emptyBar]} height={PLAN_H} today={today} projectPeriod={projectPeriod} projectEndDate={projectEndDate} onChange={(_, next) => setAllocPeriod(next)} />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 top-0">
                    <TimelineMarkers capsOnly width={width} win={win} today={today} projectPeriod={projectPeriod} setPeriod={setPeriod} projectEndDate={projectEndDate} showSetCaps={false} height={20} />
                  </div>
                </div>
              </div>

              {/* Expanded plan — each person's own schedule. Only ever shown for a
                  multi-person hand-off; a single person needs no expandable view. */}
              {hasPlan && planOpen && planSorted.length > 1 && (
                <div className="border-b border-border">
                  {planSorted.map((id) => <PlanPersonRow key={id} id={id} showUser />)}
                </div>
              )}

              {/* Filter row — search + date range + hours. Sticks below the control. */}
              <div className="sticky z-20 flex items-center gap-3 border-b border-border bg-muted px-6 py-3" style={{ top: CONTROLS_H }}>
                <div className="relative w-[332px] shrink-0">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Candidates" className="h-9 pr-8" />
                  <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {/* The allocation period must stay inside the seat window, so
                      both fields disable days before the seat start / after the
                      seat end (Figma calendar constraint). */}
                  <DateField
                    iso={allocPeriod.startDate}
                    icon={false}
                    className="w-[100px]"
                    min={seat.startDate}
                    max={seat.endDate}
                    onChange={(iso) => setAllocPeriod((p) => ({ startDate: iso, endDate: iso > p.endDate ? iso : p.endDate }))}
                  />
                  <span className="text-muted-foreground">–</span>
                  <DateField
                    iso={allocPeriod.endDate}
                    icon={false}
                    className="w-[100px]"
                    min={seat.startDate}
                    max={seat.endDate}
                    onChange={(iso) => setAllocPeriod((p) => ({ startDate: iso < p.startDate ? iso : p.startDate, endDate: iso }))}
                  />
                </div>
                <span className="relative w-[72px] shrink-0">
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={reqHours}
                    onChange={(e) => setReqHours(Math.max(0, Number(e.target.value) || 0))}
                    className="h-9 pr-6 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">h</span>
                </span>
              </div>

              {/* Candidate marker strip + list, wrapped so the allocation-period edge
                  lines can run continuously down the whole timeline (not broken per row). */}
              <div className="relative">
              {/* Allocation-period edges — one full-height overlay across the marker
                  strip + every candidate row, so the gray guides read as a single line
                  from the day caps all the way down to the bottom of the list. */}
              {width > 0 && (() => {
                const { xForRaw } = makeScale(width, win)
                const xs = [allocPeriod.startDate, allocPeriod.endDate].map(xForRaw).filter((x) => x >= 0 && x <= width)
                return (
                  <div className="pointer-events-none absolute inset-y-0 z-10" style={{ left: 380, right: 0 }}>
                    {xs.map((x, i) => (
                      <div key={i} className="absolute inset-y-0 bg-[#9ca3af] dark:bg-[#64748b]" style={{ left: x - 0.5, width: 1 }} />
                    ))}
                  </div>
                )
              })()}

              {/* Candidate marker strip — allocation-period day caps + gray band. */}
              <div className="flex items-stretch">
                <div className={cn(LEFT, 'px-6')} />
                <div className="min-w-0 flex-1">
                  <TimelineMarkers width={width} win={win} today={today} projectPeriod={projectPeriod} setPeriod={setPeriod} projectEndDate={projectEndDate} showSeatCaps={false} showFlag={false} showTodayDot={false} />
                </div>
              </div>

              {/* Candidate list — click a row to select it (footer commits). */}
              {listed.map((c) => {
                const isSel = selectedId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId((prev) => (prev === c.id ? null : c.id))}
                    className={cn(
                      'group relative flex w-full cursor-pointer items-stretch border-b border-border text-left transition-colors',
                      isSel && 'bg-[#eef1ff]/70 dark:bg-[#18224e]/50',
                    )}
                  >
                    <div className={cn(LEFT, 'flex items-center px-6 py-3')}>
                      {/* Selection check — only shown once the row is selected;
                          then it takes the 24px slot and pushes the avatar right
                          by its width + 16px gap. Unselected rows have none, so
                          every avatar sits at the 24px left margin. */}
                      {isSel && (
                        <span className="mr-4 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <img src={c.avatar} alt="" className="mr-2.5 size-10 shrink-0 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base leading-[22px] text-foreground">{c.name}</span>
                          <UserBadges s={statsFor(c.id)} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.role}</p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <TimelineLane
                        width={width} win={win} bars={toRowBars(c.bars)} height={64}
                        today={today} projectPeriod={projectPeriod} setPeriod={setPeriod} projectEndDate={projectEndDate}
                        allocBox allocBoxFill={isSel} conflict={statsFor(c.id).conflictWeeks > 0}
                        laneClassName="bg-[#f9fafb] dark:bg-[#0f1729]"
                        tintClassName={isSel ? 'bg-[#eef1ff]/70 dark:bg-[#18224e]/50' : undefined}
                      />
                    </div>
                    {/* Full-row hover highlight — blue-100 (#DBEAFE) @20% across
                        the user column + timeline. */}
                    <div className="pointer-events-none absolute inset-0 bg-[#dbeafe]/20 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#1e3a8a]/20" />
                  </div>
                )
              })}
              {/* No-results state — search filtered every candidate out (Figma
                  4751-170961). Sits in the 380px candidate column; the timeline
                  grid + period edges keep running to its right. */}
              {listed.length === 0 && (
                <div className={cn(LEFT, 'flex flex-col items-center justify-center gap-6 px-6 py-24 text-center')}>
                  <div className="flex flex-col items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Search className="h-6 w-6" />
                    </span>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-lg font-medium text-foreground">No results found</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        No results found for your search.
                        <br />
                        Try adjusting your search terms.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Selection footer — the chosen person + Clear / Propose / Assign. */}
            {selectedCand && (
              <div className="flex flex-shrink-0 items-center gap-3 border-t border-border bg-[#F3F5FF] px-6 py-4">
                <img src={selectedCand.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                <span className="truncate text-base font-medium text-foreground">{selectedCand.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Clear
                </button>
                <span className="ml-auto flex items-center gap-3">
                  {crossesPlan ? (
                    // Overlap block: no valid action — the message explains the way
                    // out and a single active "Ok" just dismisses the selection.
                    <>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 shrink-0" />
                        To assign/propose a new person, adjust the date range or remove the current allocation
                      </span>
                      <Button variant="outline" onClick={() => setSelectedId(null)}>Ok</Button>
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => propose(selectedCand.id)}>Propose</Button>
                      <Button onClick={() => setConfirmCand(selectedCand)}>Assign</Button>
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Assign confirmation — "New Allocation" */}
      <NewAllocationDialog
        open={!!confirmCand}
        onOpenChange={(v) => { if (!v) setConfirmCand(null) }}
        candidate={confirmCand}
        period={confirmCand ? rangeFor(confirmCand.id) : projectPeriod}
        hoursPerWeek={reqHours}
        onPropose={() => { if (confirmCand) propose(confirmCand.id); setConfirmCand(null) }}
        onConfirm={() => { if (confirmCand) assign(confirmCand.id); setConfirmCand(null) }}
      />

      {/* Remove confirmation — "Delete Allocation" */}
      {(() => {
        if (!removePlanId) return null
        const p = planPersonOf(removePlanId)
        const r = rangeFor(removePlanId)
        return (
          <DeleteConfirmDialog
            open={!!removePlanId}
            onOpenChange={(v) => { if (!v) setRemovePlanId(null) }}
            title="Delete Allocation"
            fields={[
              { label: 'Employee', value: p.name },
              { label: 'Allocation role', value: p.role },
              { label: 'Start-End date', value: `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}` },
            ]}
            warning={new Date(r.startDate).getTime() < Date.now()
              ? 'Start date of the allocation is in past. Deleting this allocation may cause unexpected impact on the billing for past billing cycle.'
              : undefined}
            onConfirm={() => { remove(removePlanId); setRemovePlanId(null) }}
          />
        )
      })()}
    </Dialog>
  )
}
