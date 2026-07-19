import { useRef, useCallback } from 'react'
import { FlagTriangleRight } from 'lucide-react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { makeScale, addDaysISO, clampWin, TL_TODAY, type TLWindow } from './timeline-scale'
import { daysBetween, fmtDate } from './format'
import { PERSON_BADGE_PILL, PERSON_BADGE_STYLE, type PersonBadge } from './data'
import { AllocationTooltip, fmtTooltipDate, type AllocationTooltipRow } from '@/pages/PeoplePage'

export interface Period { startDate: string; endDate: string }

// ── Month header ──────────────────────────────────────────────────────────────

export function TimelineMonths({ width, win }: { width: number; win: TLWindow }) {
  const { xFor } = makeScale(width, win)
  return (
    <div className="relative h-5 w-full">
      {win.months.map((m) => (
        <span key={m.key} className="absolute top-0 text-xs text-muted-foreground" style={{ left: xFor(m.startISO) + 6 }}>
          {m.label}
        </span>
      ))}
    </div>
  )
}

// ── Marker strip — the top of a timeline section ────────────────────────────────
// A short lane-width band that seats the day-number labels, today dot and the
// project-ends flag chip, and carries the guide lines/bands down into the rows
// below it (Figma 4397-33476). Sits below the section title + filters; the extra
// height beneath the caps is the 24px gap before the first person row.

export function TimelineMarkers({
  width, win, today = TL_TODAY, projectPeriod, setPeriod, projectEndDate, showSeatCaps = true, showSetCaps = true, height = 28, capsOnly = false, showFlag = true, showTodayDot = true, laneClassName = 'bg-[#f9fafb] dark:bg-[#0f1729]',
}: {
  width: number; win: TLWindow
  today?: string
  projectPeriod?: Period; setPeriod?: Period; projectEndDate?: string
  /** Show the seat (blue) band's own start/end day caps. */
  showSeatCaps?: boolean
  /** Show the allocation (gray) band's own start/end day caps. */
  showSetCaps?: boolean
  /** Strip height — just tall enough for the day caps + flag chip. */
  height?: number
  /** Draw only the caps + flag (no grid/bands) — safe to overlay on a lane that
   *  already draws its own grid, so the caps don't cost their own row. */
  capsOnly?: boolean
  /** Show the project-ends flag chip. Off in the candidate strip so the flag/dot
   *  live only in the allocation-plan section. */
  showFlag?: boolean
  /** Show the today dot at the top of the strip. */
  showTodayDot?: boolean
  laneClassName?: string
}) {
  const { xForRaw } = makeScale(width, win)
  const dayOf = (iso: string) => iso.slice(8, 10)   // zero-padded: 01–09, 10–31
  const inView = (iso: string) => { const x = xForRaw(iso); return x >= 0 && x <= width }
  // Sit the number just to the right of its guide line (2px gap) and nudged down,
  // reading as an end-of-line date indicator rather than centred on the stroke.
  const dayLabel = (iso: string) =>
    inView(iso) && (
      <span
        key={`d-${iso}`}
        className="absolute top-[4px] text-[11px] font-medium leading-none text-muted-foreground"
        style={{ left: xForRaw(iso) + 2 }}
      >
        {dayOf(iso)}
      </span>
    )
  // Day-number caps — seat (blue) start/end and/or allocation (gray) start/end,
  // each gated by its own flag. The allocation caps show whenever there's a set
  // period (the default range sits right over the seat, so it still gets dates).
  // Deduped so a shared edge renders one label, not two stacked.
  const capDates = Array.from(new Set([
    ...(projectPeriod && showSeatCaps ? [projectPeriod.startDate, projectPeriod.endDate] : []),
    ...(setPeriod && showSetCaps ? [setPeriod.startDate, setPeriod.endDate] : []),
  ]))
  const todayX = xForRaw(today)
  return (
    <div className={cn('relative w-full overflow-hidden', capsOnly ? 'bg-transparent' : laneClassName)} style={{ height }}>
      {/* The strip draws the guide grid (today line, bands). In capsOnly mode the
          underlying lane already owns the grid, so skip it. */}
      {!capsOnly && <TimelineGrid width={width} win={win} today={today} projectPeriod={projectPeriod} setPeriod={setPeriod} projectEndDate={projectEndDate} />}
      {/* Today dot — rendered here (not via the grid) so it also shows over a
          capsOnly overlay, and can be suppressed independently of the today line. */}
      {showTodayDot && todayX >= 0 && todayX <= width && (
        <span
          className="absolute top-0 size-[5px] -translate-x-1/2 rounded-full bg-[color:var(--timeline-today)]"
          style={{ left: todayX }}
        />
      )}
      {/* Caps sit at the very top of the strip, over their guide lines. */}
      {capDates.map(dayLabel)}
      {showFlag && projectEndDate && inView(projectEndDate) && (
        <span
          className="absolute top-1 flex size-4 -translate-x-1/2 items-center justify-center rounded-md border border-[color:var(--timeline-project-end)] bg-background text-muted-foreground"
          style={{ left: xForRaw(projectEndDate) }}
          title="Project ends"
        >
          <FlagTriangleRight className="size-2.5" />
        </span>
      )}
    </div>
  )
}

// ── Background layers: base + project/set bands + gridlines + guide lines ──────
//   1. base            → muted (lane container)
//   2. project period  → slate-100 fill only (seat span — no edge strokes)
//   3. set period       → slate-100 fill only (only if distinct; its edge guides
//                         are drawn once by the modal as a full-height overlay)
//   4. today line       → purple-700 marker (Figma 4397-33476)
//   5. project-ends line → gray-300 marker at the project end date

/** Today marker — line + (optional) dot as a single element, so the dot always
 *  tracks the line. Rendered at the given x within the lane/strip. */
function TodayMarker({ x, withDot }: { x: number; withDot?: boolean }) {
  return (
    <div className="absolute inset-y-0" style={{ left: x - 1, width: 2 }}>
      <div className="h-full w-full bg-[color:var(--timeline-today)]" />
      {withDot && (
        <span className="absolute left-1/2 top-0 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--timeline-today)]" />
      )}
    </div>
  )
}

function TimelineGrid({
  width, win, projectPeriod, setPeriod, projectEndDate, today = TL_TODAY, todayDot = false, hideSetBand = false,
}: { width: number; win: TLWindow; projectPeriod?: Period; setPeriod?: Period; projectEndDate?: string; today?: string; todayDot?: boolean; hideSetBand?: boolean }) {
  const { xFor, xForRaw } = makeScale(width, win)
  const band = (p: Period) => {
    const left = xFor(p.startDate)
    const w = Math.max(0, xFor(p.endDate) - left)
    if (w <= 0) return null
    return (
      <div
        // Seat + allocation range fill — slate-100 (#f1f5f9) per Figma 4397-33476.
        // A row's status tint sits above this as its own translucent layer, so the
        // whole row still reads as its status colour (see TimelineLane `tintClassName`).
        // Both spans are fill-only: the seat window draws no edge lines at all, and
        // the allocation window's gray edge guides are drawn once by the modal as a
        // full-height overlay across the whole candidate section.
        className="absolute inset-y-0 bg-[#f1f5f9] dark:bg-[#1e293b]"
        style={{ left, width: w }}
      />
    )
  }
  // Vertical guide line clamped to the visible window.
  const vLine = (dateISO: string, className: string, w = 1) => {
    const x = xForRaw(dateISO)
    if (x < 0 || x > width) return null
    return <div className={cn('absolute inset-y-0', className)} style={{ left: x - w / 2, width: w }} />
  }
  // A "set" band that coincides with the seat band adds no information — skip it.
  const setDistinct =
    setPeriod && (!projectPeriod || setPeriod.startDate !== projectPeriod.startDate || setPeriod.endDate !== projectPeriod.endDate)
  const todayX = xForRaw(today)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Today marker sits behind the seat/allocation bands so band edges read on top. */}
      {todayX >= 0 && todayX <= width && <TodayMarker x={todayX} withDot={todayDot} />}
      {projectPeriod && band(projectPeriod)}
      {!hideSetBand && setDistinct && band(setPeriod!)}
      {win.months.map((m) => (
        <div key={m.key} className="absolute inset-y-0 bg-[#e2e8f0] dark:bg-[#334155]" style={{ left: xFor(m.startISO), width: '0.5px' }} />
      ))}
      {projectEndDate && vLine(projectEndDate, 'bg-[color:var(--timeline-project-end)]', 1)}
    </div>
  )
}

// ── Bar tones ──────────────────────────────────────────────────────────────────

export type BarTone =
  | 'primary' | 'assigned' | 'neutral' | 'misalloc' | 'unassigned' | 'ooo' | 'flag'
  | 'available' | 'proposed'
  // Current-Allocation lane tones (Figma 4397-40124) — styled by time + status.
  | 'current' | 'nextAssigned' | 'currentConflict' | 'past'
  // The empty allocation window in the plan lane — a draggable dashed box that
  // represents (and edits) the allocation period before anyone is booked.
  | 'empty'

const TONE: Record<string, string> = {
  // Current allocation whose period holds today, or the active/assigned one → blue fill.
  primary: 'bg-[rgba(14,53,255,0.1)] dark:bg-[rgba(110,134,255,0.16)] border border-[#0e35ff] dark:border-[#6e86ff] text-foreground',
  current: 'bg-[rgba(14,53,255,0.1)] dark:bg-[rgba(110,134,255,0.16)] border border-[#0e35ff] dark:border-[#6e86ff] text-foreground',
  // Future assigned allocation ("next up") → soft indigo fill, solid blue edge.
  nextAssigned: 'bg-[#eef2ff] dark:bg-[#1e2a5a] border border-[#0e35ff] dark:border-[#6e86ff] text-foreground',
  // A confirmed allocation on another project → white/neutral outline.
  assigned: 'bg-white dark:bg-[#1e293b] border border-[#9ca3af] dark:border-[#6b7280] text-foreground',
  // Elapsed allocation (already ended) → muted grey.
  past: 'bg-[#f3f4f6] dark:bg-[#1f2937] border border-[#6b7280] text-muted-foreground',
  neutral: 'bg-[#e2e8f0] dark:bg-[#334155] border border-[#cbd5e1] dark:border-[#475569] text-foreground',
  // Tentative / over-allocated → orange fill, orange-300 edge, dark text.
  misalloc: 'bg-[#ffedd5] dark:bg-[#7c2d12] border border-[#fdba74] dark:border-[#ea580c] text-[#111827] dark:text-[#ffedd5]',
  // Proposed for the current period but not yet confirmed (conflict) → orange dashed.
  currentConflict: 'bg-[#ffedd5] dark:bg-[#7c2d12] border border-dashed border-[#fdba74] dark:border-[#ea580c] text-[#111827] dark:text-[#ffedd5]',
  // Time conflict / no project → red fill, dark-orange edge, dark text.
  unassigned: 'bg-[#fee2e2] dark:bg-[#7f1d1d] border border-[#c2410c] dark:border-[#f87171] text-[#111827] dark:text-[#fee2e2]',
  // Normal project allocation (Figma 4774-52121): white fill, solid gray-200 (#e5e7eb) border.
  available: 'bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] text-[#111827] dark:text-foreground',
  // Proposed / pending approval → purple-100 fill, purple-400 dashed edge + purple-200 PA pill (Figma 4774-51024).
  proposed: 'bg-[#f3e8ff] dark:bg-[#3b0764] border border-dashed border-[#c084fc] dark:border-[#a855f7] text-[#111827] dark:text-[#f3e8ff]',
  // Empty allocation window — transparent fill, 0.5px dashed blue-400 box, matching
  // the allocation box drawn across the candidate rows.
  empty: 'bg-transparent border-[0.5px] border-dashed border-[#60a5fa] dark:border-[#3b82f6] text-transparent',
}

const BADGE_TONE: Record<string, string> = {
  dark: 'bg-[#111827] text-white',
  blue: 'bg-[#ecfeff] text-[#0891b2]',
  orange: 'bg-[#fed7aa] text-[#c2410c]',
  // TA (tentative) pill — green (Figma: #dcfce7 bg, #15803d text).
  green: 'bg-[#dcfce7] text-[#15803d] dark:bg-[#14532d] dark:text-[#bbf7d0]',
  neutral: 'bg-badge-neutral text-badge-neutral-fg',
  // PA (pending approval) pill — purple (Figma 4397-44739: #f3e8ff bg, #6b21a8 text).
  gray: 'bg-[#f3e8ff] text-[#6b21a8] dark:bg-[#6b21a8] dark:text-[#f3e8ff]',
}

export interface BarBadge { label: string; tone?: keyof typeof BADGE_TONE }

/** An existing commitment this bar overlaps — powers the multi-conflict tooltip. */
export interface BarConflict {
  label: string
  startDate: string
  endDate: string
  /** Parenthetical marker after the dates, e.g. "TA" / "PA". */
  note?: string
}

export interface TimelineBarData {
  id: string
  startDate: string
  endDate: string
  label?: string
  hours?: number
  /** Multiple projects merged into one row-bar (Figma 4774-52144): rendered as
   *  "20h Allox · 20h Spark". Takes precedence over `hours`/`label` when present.
   *  Per-segment dates (when known) power the tooltip's per-project rows. */
  segments?: { hours?: number; label: string; startDate?: string; endDate?: string }[]
  tone: BarTone
  /** Trailing pills (e.g. NB, TA, PA). PA only ever appears on a `proposed` (grey) bar. */
  badges?: BarBadge[]
  /** Overlapping commitments — when present, the tooltip lists them as conflicts. */
  conflicts?: BarConflict[]
  avatar?: string
  draggable?: boolean
}

const BAR_H = 28
const ROW_STEP = 34

// Start-day marker is a compact 28px chip (Figma 4597-31334); its label lives in
// the hover tooltip, so it no longer needs room for inline text.
const FLAG_W = 28

/** Minimum rendered width so a bar's content never squishes / truncates. */
function minBarWidth(bar: TimelineBarData): number {
  if (bar.tone === 'flag') return FLAG_W
  if (bar.tone === 'ooo') return 22
  const chars = bar.segments
    ? bar.segments.reduce((n, s) => n + (s.hours != null ? String(s.hours).length + 2 : 0) + s.label.length + 3, 0)
    : (bar.hours != null ? String(bar.hours).length + 3 : 0) + (bar.label?.length ?? 0)
  let w = 20 + chars * 6.6
  if (bar.avatar) w += 22
  w += (bar.badges?.length ?? 0) * 34
  return Math.min(Math.round(w), 420)
}

// ── Bar hover tooltip ───────────────────────────────────────────────────────────
// Conflict variant (Figma 4093-16182): dark card, uppercase labels + values.
// Single-commitment + OOO variants reuse the People page tooltip cards so both
// timelines present allocations identically (ACCOUNT / WORKING / CONTRACT / DATES).

/** Shared dark-card tone — matches the People page allocation tooltip. */
const TIP_CARD = '#1e2939'

function TipCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.08px] text-[#999]">{label}</span>
      {children}
    </div>
  )
}

/** Whole weeks two periods overlap (0 when they don't intersect). */
function overlapWeeks(a: Period, b: Period): number {
  const start = Math.max(new Date(a.startDate).getTime(), new Date(b.startDate).getTime())
  const end = Math.min(new Date(a.endDate).getTime(), new Date(b.endDate).getTime())
  if (end <= start) return 0
  return Math.max(1, Math.round((end - start) / (7 * 86_400_000)))
}

function BarTooltip({ bar }: { bar: TimelineBarData }) {
  // Multi-conflict variant (Figma 4093-16182) — only the overlapping commitments.
  const conflicts = (bar.conflicts ?? [])
    .map((c) => ({ ...c, weeks: overlapWeeks(bar, c) }))
    .filter((c) => c.weeks > 0)

  if (conflicts.length > 0) {
    return (
      <div className="flex gap-4 rounded-lg p-3 text-white shadow-xl" style={{ backgroundColor: TIP_CARD }}>
        <TipCol label="Conflict with">
          {conflicts.map((c, i) => (
            <span key={i} className="whitespace-nowrap text-xs font-medium leading-[17px] text-white">{c.label}</span>
          ))}
        </TipCol>
        <TipCol label="Start-end">
          {conflicts.map((c, i) => (
            <span key={i} className="whitespace-nowrap text-xs leading-[17px] text-white">
              {fmtDate(c.startDate)} – {fmtDate(c.endDate)}{c.note ? ` (${c.note})` : ''}
            </span>
          ))}
        </TipCol>
        <TipCol label="Overlapping">
          {conflicts.map((c, i) => (
            <span key={i} className="whitespace-nowrap text-xs leading-[17px] text-white">
              {c.weeks} {c.weeks === 1 ? 'week' : 'weeks'}
            </span>
          ))}
        </TipCol>
      </div>
    )
  }

  // Time-off variant — mirrors the People page TIME OFF card.
  if (bar.tone === 'ooo') {
    return (
      <div className="rounded-lg px-3 py-2.5 shadow-xl" style={{ backgroundColor: TIP_CARD }}>
        <p className="mb-1 text-[10px] font-semibold tracking-wider text-white/50">TIME OFF</p>
        <p className="whitespace-nowrap text-[13px] text-white">
          {fmtTooltipDate(bar.startDate)} – {fmtTooltipDate(bar.endDate)}
        </p>
      </div>
    )
  }

  // Single-commitment variant — the People page allocation table (one row per
  // project; merged multi-project bars contribute a row per segment).
  const nonBillable = bar.badges?.some((b) => b.label === 'NB')
  const rows: AllocationTooltipRow[] = bar.segments
    ? bar.segments.map((s) => ({
        projectName: s.label || 'Allocation',
        hoursPerWeek: s.hours,
        startDate: s.startDate ?? bar.startDate,
        endDate: s.endDate ?? bar.endDate,
        nonBillable,
      }))
    : [{
        projectName: bar.label ?? 'Allocation',
        hoursPerWeek: bar.hours,
        startDate: bar.startDate,
        endDate: bar.endDate,
        nonBillable,
      }]
  return <AllocationTooltip allocs={rows} />
}

// ── A single bar (filled / ooo hatch / flag marker) ────────────────────────────
// Geometry (left/width/top) is computed by the lane so it can pack/hide bars;
// the bar only renders + handles drag.

function Bar({
  bar, width, win, left, barWidth, top, onChange,
}: { bar: TimelineBarData; width: number; win: TLWindow; left: number; barWidth: number; top: number; onChange?: (id: string, next: Period) => void }) {
  const { daysForPx } = makeScale(width, win)

  const drag = useRef<{ mode: 'move' | 'l' | 'r'; startX: number; s: string; e: string } | null>(null)
  const onPointerDown = useCallback((mode: 'move' | 'l' | 'r') => (ev: React.PointerEvent) => {
    if (!bar.draggable || !onChange) return
    ev.preventDefault(); ev.stopPropagation()
    ;(ev.target as HTMLElement).setPointerCapture(ev.pointerId)
    drag.current = { mode, startX: ev.clientX, s: bar.startDate, e: bar.endDate }
  }, [bar.draggable, bar.startDate, bar.endDate, onChange])
  const onPointerMove = useCallback((ev: React.PointerEvent) => {
    const d = drag.current
    if (!d || !onChange) return
    const delta = daysForPx(ev.clientX - d.startX)
    if (delta === 0) return
    const span = daysBetween(d.s, d.e)
    if (d.mode === 'move') {
      let s = addDaysISO(d.s, delta); if (s < win.startISO) s = win.startISO
      const e = clampWin(addDaysISO(s, span), win); s = addDaysISO(e, -span)
      onChange(bar.id, { startDate: clampWin(s, win), endDate: e })
    } else if (d.mode === 'l') {
      let s = clampWin(addDaysISO(d.s, delta), win); if (daysBetween(s, d.e) < 7) s = addDaysISO(d.e, -7)
      onChange(bar.id, { startDate: s, endDate: d.e })
    } else {
      let e = clampWin(addDaysISO(d.e, delta), win); if (daysBetween(d.s, e) < 7) e = addDaysISO(d.s, 7)
      onChange(bar.id, { startDate: d.s, endDate: e })
    }
  }, [bar.id, daysForPx, onChange, win])
  const onPointerUp = useCallback((ev: React.PointerEvent) => {
    drag.current = null
    ;(ev.target as HTMLElement).releasePointerCapture?.(ev.pointerId)
  }, [])

  // Wrap a bar element in a hover tooltip (dark card + downward caret).
  const withTip = (inner: React.ReactNode) => (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="overflow-visible border-0 bg-transparent p-0 shadow-none">
        <BarTooltip bar={bar} />
        <TooltipPrimitive.Arrow width={12} height={6} className="fill-[#1e2939]" />
      </TooltipContent>
    </Tooltip>
  )

  if (bar.tone === 'flag') {
    // Start-day marker (Figma 4597-31334): a 28px chip with a dashed blue LEFT edge
    // sitting on the start date, an indigo→transparent gradient fill, and a centred
    // blue flag. The label (title · date) is shown only on hover, in a dark card
    // that opens to the right with a left-pointing caret.
    const [flagTitle, flagDate] = (bar.label ?? '').split(' · ')
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute flex items-center justify-center border-l border-dashed border-[#0e35ff] bg-gradient-to-r from-[#e0e7ff] to-[rgba(224,231,255,0)] dark:border-[#6e86ff] dark:from-[rgba(110,134,255,0.16)]"
            style={{ left, top, width: FLAG_W, height: BAR_H }}
          >
            <FlagTriangleRight className="h-4 w-4 text-[#0e35ff] dark:text-[#6e86ff]" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={6} className="overflow-visible border-0 bg-transparent p-0 shadow-none">
          <div className="flex flex-col gap-1 rounded-[4px] p-3" style={{ backgroundColor: TIP_CARD }}>
            <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.08px] text-[#999]">{flagTitle}</span>
            {flagDate && <span className="text-xs leading-4 text-white">{flagDate}</span>}
          </div>
          <TooltipPrimitive.Arrow width={12} height={6} className="fill-[#1e2939]" />
        </TooltipContent>
      </Tooltip>
    )
  }

  if (bar.tone === 'empty') {
    // Empty allocation window — a dashed box the planner drags/resizes to reshape
    // the allocation period (which drives the gray band across the candidate rows).
    return (
      <div
        className={cn('absolute rounded-[2px]', TONE.empty, onChange ? 'cursor-grab active:cursor-grabbing' : '')}
        style={{ left, width: barWidth, top, height: BAR_H }}
        onPointerDown={onPointerDown('move')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {onChange && (
          <>
            <span className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize" onPointerDown={onPointerDown('l')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
            <span className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize" onPointerDown={onPointerDown('r')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          </>
        )}
      </div>
    )
  }

  if (bar.tone === 'ooo') {
    // Time-off (Figma 4397-44749): neutral grey diagonal hatch (gray-300, ~5px stripes
    // at 45°) over transparent gaps, wrapped in a dashed grey border. No orange.
    return withTip(
      <div
        className="absolute rounded border border-dashed border-[color:var(--timeline-assigned-ooo)]"
        style={{
          left, width: barWidth, top, height: BAR_H,
          backgroundImage: 'repeating-linear-gradient(45deg, var(--timeline-assigned-ooo) 0 5px, transparent 5px 8.3px)',
        }}
      />
    )
  }

  return withTip(
    <div
      className={cn('absolute flex h-7 items-center gap-1.5 rounded px-2 text-xs', TONE[bar.tone], bar.draggable ? 'cursor-grab active:cursor-grabbing' : '')}
      style={{ left, width: barWidth, top }}
      onPointerDown={onPointerDown('move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {bar.avatar && <img src={bar.avatar} alt="" className="size-4 shrink-0 rounded-full object-cover" />}
      <span className="min-w-0 flex-1 truncate">
        {bar.segments ? (
          // Merged multi-project bar: "20h Allox · 20h Spark" (Figma 4774-52144).
          bar.segments.map((s, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted-foreground"> · </span>}
              {s.hours != null && <span className="font-medium">{s.hours}h </span>}
              <span className="text-muted-foreground">{s.label}</span>
            </span>
          ))
        ) : (
          <>
            {bar.hours != null && <span className="font-medium">{bar.hours}h</span>}
            {bar.hours != null && bar.label && <span className="text-muted-foreground"> · </span>}
            {bar.label}
          </>
        )}
      </span>
      {bar.badges?.map((b) => (
        <span key={b.label} className={cn(PERSON_BADGE_PILL, PERSON_BADGE_STYLE[b.label as PersonBadge] ?? BADGE_TONE[b.tone ?? 'neutral'])}>{b.label}</span>
      ))}
      {bar.draggable && onChange && (
        <>
          <span className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize" onPointerDown={onPointerDown('l')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
          <span className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize" onPointerDown={onPointerDown('r')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
        </>
      )}
    </div>
  )
}

interface Placed { bar: TimelineBarData; left: number; width: number; extent: number }

/**
 * Compute each bar's pixel geometry anchored to its true dates (unclamped),
 * drop bars fully outside the window, then greedily pack by rendered extent so
 * bars that would collide drop to a lower layer instead of squishing.
 */
function layout(bars: TimelineBarData[], width: number, win: TLWindow) {
  const { xForRaw } = makeScale(width, win)
  const placed: Placed[] = bars
    .map((bar) => {
      const left = xForRaw(bar.startDate)
      const raw = bar.tone === 'flag' ? FLAG_W : xForRaw(bar.endDate) - left
      const w = Math.max(raw, minBarWidth(bar))
      return { bar, left, width: w, extent: w }
    })
    .filter((p) => p.left + p.extent > 0 && p.left < width) // keep only what's visible

  const sorted = [...placed].sort((a, b) => a.left - b.left)
  const rowEnds: number[] = []
  const rowOf = new Map<string, number>()
  for (const p of sorted) {
    let r = rowEnds.findIndex((end) => end <= p.left + 0.5)
    if (r === -1) { r = rowEnds.length; rowEnds.push(p.left + p.extent) }
    else rowEnds[r] = p.left + p.extent
    rowOf.set(p.bar.id, r)
  }
  return { placed, rowOf, rows: Math.max(1, rowEnds.length) }
}

/** How many rows the lane will pack `bars` into at this width — lets a caller
 *  size a row to its stacked-bar count (1 row vs. 2 overlapping bars). */
export function laneRows(bars: TimelineBarData[], width: number, win: TLWindow): number {
  if (width <= 0) return 1
  return layout(bars, width, win).rows
}

// ── A lane — three background layers + a set of bars ───────────────────────────

export function TimelineLane({
  width, win, bars, height, today = TL_TODAY, projectPeriod, setPeriod, projectEndDate, onChange, laneClassName = 'bg-[#f9fafb] dark:bg-[#0f1729]', tintClassName, restPeriods, onRestClick, allocBox = false, allocBoxFill = false, conflict = false,
}: {
  width: number
  win: TLWindow
  bars: TimelineBarData[]
  height?: number
  today?: string
  projectPeriod?: Period
  setPeriod?: Period
  projectEndDate?: string
  onChange?: (id: string, next: Period) => void
  laneClassName?: string
  /** Translucent status tint drawn above the grid/bands but below the bars, so a
   *  highlighted row reads as its status colour edge-to-edge (bands still ghost). */
  tintClassName?: string
  /** Still-unfilled spans of the seat window (Figma 4774-50251) — each one draws
   *  a bar-height light-blue dashed box, so the remainder of the seat period the
   *  plan bars don't cover reads as open seat time. */
  restPeriods?: Period[]
  /** Makes the rest boxes clickable — clicking an open spot retargets the
   *  allocation period to it (the candidate-list filter + gray band follow). */
  onRestClick?: (p: Period) => void
  /** Draw the allocation window as a blue dashed box, with a hatched box over every
   *  spot a commitment overlaps it (the person's schedule clash with this seat). */
  allocBox?: boolean
  /** Fill the allocation-window box with blue-200 (#BFDBFE) @30% — the selected
   *  candidate row. */
  allocBoxFill?: boolean
  /** Colour the overlap hatch red instead of blue — the candidate is over-allocated
   *  ("Nw overlaps" conflict badge) rather than merely busy. */
  conflict?: boolean
}) {
  const { placed, rowOf, rows } = width > 0 ? layout(bars, width, win) : { placed: [], rowOf: new Map(), rows: 1 }
  const H = height ?? Math.max(60, rows * ROW_STEP + 12)
  const topFor = (id: string) => (rows === 1 ? (H - BAR_H) / 2 : 8 + (rowOf.get(id) ?? 0) * ROW_STEP)

  // Allocation-window overlay (candidate rows): a blue dashed box spanning the seat's
  // allocation window, plus a hatched box wherever a commitment falls inside it.
  const overlay = allocBox && setPeriod && width > 0 ? (() => {
    const { xForRaw } = makeScale(width, win)
    const clampX = (x: number) => Math.max(0, Math.min(width, x))
    const boxL = clampX(xForRaw(setPeriod.startDate))
    const boxR = clampX(xForRaw(setPeriod.endDate))
    const bandTop = rows === 1 ? (H - BAR_H) / 2 : 8
    const bandH = rows === 1 ? BAR_H : (rows - 1) * ROW_STEP + BAR_H
    // Hatch stripe colour: default blue-200 (#BFDBFE) @30%, conflict red-400
    // (#F87171) @30% — transparent gaps so the project bar shows through.
    const hatchStripe = conflict ? 'rgba(248,113,113,0.3)' : 'rgba(191,219,254,0.3)'
    // Overlap is measured on RENDERED geometry, not raw dates: a bar whose width
    // is inflated to fit its label (minBarWidth) can poke into the window even
    // when its dates end before it — that visual slice still reads as taken.
    const overlaps = placed
      .filter((p) => p.bar.tone !== 'flag' && p.bar.tone !== 'ooo')
      .map((p) => {
        const s = Math.max(clampX(p.left), boxL)
        const e = Math.min(clampX(p.left + p.width), boxR)
        return { id: p.bar.id, left: s, width: e - s, top: topFor(p.bar.id) }
      })
      .filter((o) => o.width > 0)
    return { boxL, boxR, bandTop, bandH, hatchStripe, overlaps }
  })() : null

  // Seat-remainder boxes — the spans of the seat window the plan bars leave
  // uncovered, drawn at bar height like the bar they sit beside.
  const rests = restPeriods && width > 0 ? (() => {
    const { xForRaw } = makeScale(width, win)
    const clampX = (x: number) => Math.max(0, Math.min(width, x))
    const top = rows === 1 ? (H - BAR_H) / 2 : 8
    return restPeriods
      .map((p) => {
        const l = clampX(xForRaw(p.startDate))
        return { key: `${p.startDate}~${p.endDate}`, left: l, width: clampX(xForRaw(p.endDate)) - l, top, period: p }
      })
      .filter((r) => r.width > 0)
  })() : null

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('relative w-full overflow-hidden', laneClassName)} style={{ height: H }}>
        <TimelineGrid width={width} win={win} today={today} projectPeriod={projectPeriod} setPeriod={setPeriod} projectEndDate={projectEndDate} hideSetBand={allocBox} />
        {tintClassName && <div className={cn('pointer-events-none absolute inset-0', tintClassName)} />}
        {/* Seat-remainder boxes — blue-200 @30% fill inside a 0.5px dashed
            blue-400 box (Figma 4774-50251), marking still-open seat time. Below
            the bars so a plan bar's solid edge always wins a shared boundary. */}
        {rests?.map((r) => (
          <div
            key={r.key}
            className={cn(
              'absolute rounded-[2px] border-[0.5px] border-dashed border-[#60a5fa] bg-[#bfdbfe]/30 dark:border-[#3b82f6]',
              onRestClick ? 'cursor-pointer hover:bg-[#bfdbfe]/50' : 'pointer-events-none',
            )}
            style={{ left: r.left, width: r.width, top: r.top, height: BAR_H }}
            onClick={onRestClick ? () => onRestClick(r.period) : undefined}
          />
        ))}
        {/* Selected-row fill inside the allocation-window box — below the bars so
            labels stay crisp; the dashed border is drawn separately on top. */}
        {overlay && allocBoxFill && (
          <div
            className="pointer-events-none absolute rounded-[2px] bg-[#bfdbfe]/30"
            style={{ left: overlay.boxL, width: overlay.boxR - overlay.boxL, top: overlay.bandTop, height: overlay.bandH }}
          />
        )}
        {placed.map((p) => (
          <Bar key={p.bar.id} bar={p.bar} width={width} win={win} left={p.left} barWidth={p.width} top={topFor(p.bar.id)} onChange={onChange} />
        ))}
        {/* Overlap hatch — right-inclined 135° stripes (matches the People-page OOO
            pattern) over transparent gaps, drawn above the bar so the in-window slice
            reads as a clash while the bar + label stay visible. */}
        {overlay?.overlaps.map((o) => (
          <div
            key={`ov-${o.id}`}
            className="pointer-events-none absolute rounded-[2px]"
            style={{
              left: o.left, width: o.width, top: o.top, height: BAR_H,
              backgroundImage: `linear-gradient(135deg, ${overlay.hatchStripe} 25%, transparent 25%, transparent 50%, ${overlay.hatchStripe} 50%, ${overlay.hatchStripe} 75%, transparent 75%, transparent 100%)`,
              backgroundSize: '11.31px 11.31px',
            }}
          />
        ))}
        {/* Allocation-window box — 0.5px dashed blue-400 (#60a5fa), no fill, drawn on
            top so it always reads at the full allocation-period width even where a
            project bar sits inside it (Figma 4774-52975). */}
        {overlay && (
          <div
            className="pointer-events-none absolute rounded-[2px] border-[0.5px] border-dashed border-[#60a5fa] dark:border-[#3b82f6]"
            style={{ left: overlay.boxL, width: overlay.boxR - overlay.boxL, top: overlay.bandTop, height: overlay.bandH }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
