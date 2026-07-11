import { useRef, useCallback } from 'react'
import { FlagTriangleRight } from 'lucide-react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { makeScale, addDaysISO, clampWin, type TLWindow } from './timeline-scale'
import { daysBetween, fmtDate, weeksBetween } from './format'

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

// ── Background layers: base (muted) + project band + set band + gridlines ──────
//   1. base            → muted (lane container)
//   2. project period  → slate-100 fill, indigo dashed side strokes
//   3. set period      → slate-100 fill, gray dashed side strokes

function TimelineGrid({
  width, win, projectPeriod, setPeriod,
}: { width: number; win: TLWindow; projectPeriod?: Period; setPeriod?: Period }) {
  const { xFor } = makeScale(width, win)
  const band = (p: Period, edge: string) => {
    const left = xFor(p.startDate)
    const w = Math.max(0, xFor(p.endDate) - left)
    if (w <= 0) return null
    return (
      <div
        className={cn('absolute inset-y-0 border-x border-dashed bg-[#f1f5f9] dark:bg-[#1e293b]', edge)}
        style={{ left, width: w }}
      />
    )
  }
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {projectPeriod && band(projectPeriod, 'border-[#0e35ff] dark:border-[#6e86ff]')}
      {setPeriod && band(setPeriod, 'border-[#9ca3af] dark:border-[#6b7280]')}
      {win.months.map((m) => (
        <div key={m.key} className="absolute inset-y-0 bg-[#e2e8f0] dark:bg-[#334155]" style={{ left: xFor(m.startISO), width: '0.5px' }} />
      ))}
    </div>
  )
}

// ── Bar tones ──────────────────────────────────────────────────────────────────

export type BarTone =
  | 'primary' | 'assigned' | 'neutral' | 'misalloc' | 'unassigned' | 'ooo' | 'flag'
  | 'available' | 'proposed'

const TONE: Record<string, string> = {
  primary: 'bg-timeline-assigned border border-primary text-timeline-assigned-fg',
  assigned: 'bg-timeline-assigned border border-[#9ca3af] text-timeline-assigned-fg',
  neutral: 'bg-[#e2e8f0] dark:bg-[#334155] border border-[#cbd5e1] dark:border-[#475569] text-foreground',
  misalloc: 'bg-timeline-misalloc border border-timeline-misalloc-stroke text-timeline-misalloc-fg',
  unassigned: 'bg-timeline-unassigned border border-timeline-unassigned-stroke text-timeline-unassigned-fg',
  // Has another project but is free for this allocation → clean white outline bar.
  available: 'bg-timeline-assigned border border-[#334155] dark:border-[#94a3b8] text-timeline-assigned-fg',
  // Proposed (pending approval) to another project → grey bar + grey PA pill (Figma 4319-23624).
  proposed: 'bg-[#e5e7eb] dark:bg-[#374151] border border-[#6b7280] dark:border-[#9ca3af] text-foreground',
}

const BADGE_TONE: Record<string, string> = {
  dark: 'bg-[#111827] text-white',
  blue: 'bg-[#e7ebff] text-[#0e35ff]',
  orange: 'bg-[#fed7aa] text-[#c2410c]',
  neutral: 'bg-badge-neutral text-badge-neutral-fg',
  // Muted grey pill used on the "Proposed" bar (Figma: #d1d5db bg, #111827 text).
  gray: 'bg-[#d1d5db] text-[#111827] dark:bg-[#4b5563] dark:text-white',
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

const FLAG_W = 212

/** Minimum rendered width so a bar's content never squishes / truncates. */
function minBarWidth(bar: TimelineBarData): number {
  if (bar.tone === 'flag') return FLAG_W
  if (bar.tone === 'ooo') return 22
  const chars = (bar.hours != null ? String(bar.hours).length + 3 : 0) + (bar.label?.length ?? 0)
  let w = 20 + chars * 6.6
  if (bar.avatar) w += 22
  w += (bar.badges?.length ?? 0) * 34
  return Math.min(Math.round(w), 420)
}

// ── Bar hover tooltip (Figma 4093-16182): dark card, uppercase labels + values ──

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
      <div className="flex gap-4">
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

  // Single-commitment variant.
  const isOOO = bar.tone === 'ooo'
  const weeks = weeksBetween(bar.startDate, bar.endDate)
  return (
    <div className="flex gap-4">
      <TipCol label={isOOO ? 'Type' : 'Project'}>
        <span className="text-xs font-medium leading-[17px] text-white">
          {isOOO ? 'Time-Off' : bar.label ?? 'Allocation'}
        </span>
      </TipCol>
      <TipCol label="Start-end">
        <span className="whitespace-nowrap text-xs leading-[17px] text-white">
          {fmtDate(bar.startDate)} – {fmtDate(bar.endDate)}
        </span>
        <span className="whitespace-nowrap text-xs leading-[17px] text-[#c9cede]">
          {bar.hours != null && `${bar.hours}h/week · `}{weeks} {weeks === 1 ? 'week' : 'weeks'}
        </span>
      </TipCol>
    </div>
  )
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
      <TooltipContent side="top" sideOffset={6} className="overflow-visible rounded-[4px] border-0 bg-[#1f2639] p-3 text-white shadow-md">
        <BarTooltip bar={bar} />
        <TooltipPrimitive.Arrow width={12} height={6} className="fill-[#1f2639]" />
      </TooltipContent>
    </Tooltip>
  )

  if (bar.tone === 'flag') {
    // Fill fades grey → transparent to the right; stroke is an orange gradient that
    // fades with it (padding-box fill + border-box stroke, transparent border). Figma 4319-23633.
    return (
      <div
        className={cn(
          'absolute flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[4px] border border-transparent px-2 text-xs text-foreground',
          '[background:linear-gradient(to_right,#e5e7eb,#e5e7eb00)_padding-box,linear-gradient(to_right,#fdba74,#fdba7400)_border-box]',
          'dark:[background:linear-gradient(to_right,#334155,#33415500)_padding-box,linear-gradient(to_right,#fb923c,#fb923c00)_border-box]',
        )}
        style={{ left, top }}
      >
        <FlagTriangleRight className="h-4 w-4 shrink-0 text-badge-warning-fg" />
        {bar.label}
      </div>
    )
  }

  if (bar.tone === 'ooo') {
    return withTip(
      <div
        className="absolute rounded border border-[color:var(--timeline-misalloc-ooo)]"
        style={{
          left, width: barWidth, top, height: BAR_H,
          backgroundImage: 'repeating-linear-gradient(45deg, var(--timeline-misalloc-ooo) 0 4px, transparent 4px 8px)',
          backgroundColor: 'var(--timeline-misalloc-bg)',
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
        {bar.hours != null && <span className="font-medium">{bar.hours}h</span>}
        {bar.hours != null && bar.label && <span className="text-muted-foreground"> · </span>}
        {bar.label}
      </span>
      {bar.badges?.map((b) => (
        <span key={b.label} className={cn('shrink-0 rounded-full px-1.5 text-[10px] font-medium leading-4', BADGE_TONE[b.tone ?? 'neutral'])}>{b.label}</span>
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

// ── A lane — three background layers + a set of bars ───────────────────────────

export function TimelineLane({
  width, win, bars, height, projectPeriod, setPeriod, onChange, laneClassName = 'bg-[#f8fafc] dark:bg-[#0f1729]',
}: {
  width: number
  win: TLWindow
  bars: TimelineBarData[]
  height?: number
  projectPeriod?: Period
  setPeriod?: Period
  onChange?: (id: string, next: Period) => void
  laneClassName?: string
}) {
  const { placed, rowOf, rows } = width > 0 ? layout(bars, width, win) : { placed: [], rowOf: new Map(), rows: 1 }
  const H = height ?? Math.max(60, rows * ROW_STEP + 12)
  const topFor = (id: string) => (rows === 1 ? (H - BAR_H) / 2 : 8 + (rowOf.get(id) ?? 0) * ROW_STEP)
  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('relative w-full overflow-hidden', laneClassName)} style={{ height: H }}>
        <TimelineGrid width={width} win={win} projectPeriod={projectPeriod} setPeriod={setPeriod} />
        {placed.map((p) => (
          <Bar key={p.bar.id} bar={p.bar} width={width} win={win} left={p.left} barWidth={p.width} top={topFor(p.bar.id)} onChange={onChange} />
        ))}
      </div>
    </TooltipProvider>
  )
}
