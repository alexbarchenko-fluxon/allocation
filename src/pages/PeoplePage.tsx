import { useState, useMemo, useRef, useEffect, useTransition, Fragment } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  X, Search, ArrowDownAZ, ArrowUpAZ,
  Users, User, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, ChevronRight,
  Mail, BriefcaseBusiness, Dribbble, MapPin, Calendar, ExternalLink, TreePalm,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InputGroup } from '@/components/ui/input-group'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { SidePanelSection } from '@/components/ui/side-panel-section'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import LinkedInLogo from '@/assets/logos/logo-linkedin.svg?react'
import SlackLogo    from '@/assets/logos/logo-slack.svg?react'
import imgBadgeMilestones5        from '@/assets/badges/meta-badge-provider-milestones-5.png'
import imgBadgeWorkedOnProjects10 from '@/assets/badges/allox-badge-provider-worked-on-projects-10.png'
import imgBadgeYearsInCompany10   from '@/assets/badges/allox-badge-provider-years-in-company-10.png'
import imgBadgeInterview25        from '@/assets/badges/interview-25.png'
import imgBadgeQaOfficeHours      from '@/assets/badges/qa-office-hours-attendee.png'
import imgBadgeSlack20            from '@/assets/badges/slack-20.png'
import imgBadgeFirstnameMatch     from '@/assets/badges/user-factoid-badge-firstname-match.png'
import imgBadgeRighthand          from '@/assets/badges/user-factoid-badge-righthand.png'
import imgBadgeScrabblePro        from '@/assets/badges/user-factoid-badge-scrabble-pro.png'
import imgBadgeUniqueFirstname    from '@/assets/badges/user-factoid-badge-unique-firstname.png'

const BADGE_IMAGES: Record<string, string> = {
  'meta-badge-provider-milestones-5':           imgBadgeMilestones5,
  'allox-badge-provider-worked-on-projects-10': imgBadgeWorkedOnProjects10,
  'allox-badge-provider-years-in-company-10':   imgBadgeYearsInCompany10,
  'interview-25':                               imgBadgeInterview25,
  'qa-office-hours-attendee':                   imgBadgeQaOfficeHours,
  'slack-20':                                   imgBadgeSlack20,
  'user-factoid-badge-firstname-match':         imgBadgeFirstnameMatch,
  'user-factoid-badge-righthand':               imgBadgeRighthand,
  'user-factoid-badge-scrabble-pro':            imgBadgeScrabblePro,
  'user-factoid-badge-unique-firstname':        imgBadgeUniqueFirstname,
}
import { MOCK_PEOPLE, PERSON_MAP, MANAGER_MAP, DIRECT_REPORTS_MAP, type Person } from '@/mocks/people'
import { PROJECT_MAP } from '@/mocks/projects'
import { ALLOCS_BY_PERSON, type Allocation } from '@/mocks/allocations'
import { cn } from '@/lib/utils'

// ── Filter option sets (derived once from mock data) ──────────────────────────

const ALL_DIVISIONS = [...new Set(MOCK_PEOPLE.map((p) => p.division))].sort()
const ALL_TEAMS     = [...new Set(MOCK_PEOPLE.map((p) => p.team))].sort()
const ALL_LOCATIONS = [...new Set(MOCK_PEOPLE.map((p) => p.location))].sort()

// ── Timeline helpers ──────────────────────────────────────────────────────────

export type ZoomLevel = 'week' | 'month' | 'quarter'

// Ordered most-zoomed-in → most-zoomed-out so ZoomOut steps right (week→month→quarter)
const ZOOM_LEVELS: ZoomLevel[] = ['quarter', 'month', 'week']

/** Column width (px) per zoom level. */
const ZOOM_CONFIG: Record<ZoomLevel, { colWidth: number }> = {
  week:    { colWidth: 124 },
  month:   { colWidth: 160 },
  quarter: { colWidth: 200 },
}

/** Fixed bounds — start matches allocation data; end is always 6 months ahead. */
const GANTT_START = new Date('2024-03-01')
const GANTT_END   = (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d })()

/** First day of the quarter containing `date`. */
function quarterOf(date: Date): Date {
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)
}

/** Total columns needed to span the full GANTT range at a given zoom. */
function computeColCount(zoom: ZoomLevel): number {
  const msSpan = GANTT_END.getTime() - GANTT_START.getTime()
  if (zoom === 'week') return Math.ceil(msSpan / (7 * 86_400_000)) + 2
  if (zoom === 'month') return (
    (GANTT_END.getFullYear() - GANTT_START.getFullYear()) * 12 +
    (GANTT_END.getMonth()    - GANTT_START.getMonth()) + 2
  )
  // quarter — count from start of quarter containing GANTT_START
  const base = quarterOf(GANTT_START)
  const end  = quarterOf(GANTT_END)
  return (end.getFullYear() - base.getFullYear()) * 4 +
    Math.floor(end.getMonth() / 3) - Math.floor(base.getMonth() / 3) + 2
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}



/** Build the full array of column start-dates for the current zoom. */
function buildColumns(zoom: ZoomLevel): Date[] {
  const colCount = computeColCount(zoom)
  if (zoom === 'week') {
    return Array.from({ length: colCount }, (_, i) => addDays(GANTT_START, i * 7))
  }
  if (zoom === 'month') {
    return Array.from({ length: colCount }, (_, i) =>
      new Date(GANTT_START.getFullYear(), GANTT_START.getMonth() + i, 1))
  }
  // quarter — columns start from the beginning of the quarter containing GANTT_START
  const base = quarterOf(GANTT_START)
  return Array.from({ length: colCount }, (_, i) =>
    new Date(base.getFullYear(), base.getMonth() + i * 3, 1))
}

/**
 * Column header label — uppercase, left-edge anchored.
 * week    → "FEB 23"   (month abbr + zero-padded day)
 * month   → "FEB '26"
 * quarter → "Q2 '24"
 */
function colLabel(date: Date, zoom: ZoomLevel): string {
  if (zoom === 'quarter') {
    const q  = Math.floor(date.getMonth() / 3) + 1
    const yr = String(date.getFullYear()).slice(-2)
    return `Q${q} '${yr}`
  }
  const mon = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  if (zoom === 'month') {
    const yr = String(date.getFullYear()).slice(-2)
    return `${mon} '${yr}`
  }
  // week
  return `${mon} ${String(date.getDate()).padStart(2, '0')}`
}

/** Pixel offset of today from the left edge of GANTT_START. Always in range. */
function todayOffset(zoom: ZoomLevel): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dateToX(today, GANTT_START, zoom)
}

/**
 * Converts a date to its pixel x-offset from viewStart.
 * Quarter zoom normalises viewStart to the start of its containing quarter.
 */
function dateToX(date: Date, viewStart: Date, zoom: ZoomLevel): number {
  const { colWidth } = ZOOM_CONFIG[zoom]
  if (zoom === 'week') {
    return ((date.getTime() - viewStart.getTime()) / (7 * 86_400_000)) * colWidth
  }
  if (zoom === 'month') {
    const mDiff =
      (date.getFullYear() - viewStart.getFullYear()) * 12 +
      (date.getMonth() - viewStart.getMonth())
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    return (mDiff + (date.getDate() - 1) / daysInMonth) * colWidth
  }
  // quarter — normalise viewStart to its quarter boundary
  const base  = quarterOf(viewStart)
  const qDiff = (date.getFullYear() - base.getFullYear()) * 4
              + Math.floor(date.getMonth() / 3) - Math.floor(base.getMonth() / 3)
  const qS    = quarterOf(date)
  const qE    = new Date(qS.getFullYear(), qS.getMonth() + 3, 1)
  return (qDiff + (date.getTime() - qS.getTime()) / (qE.getTime() - qS.getTime())) * colWidth
}

// (TimelineGrid removed — dates header and body rows are rendered inline in PeoplePage
//  so they can be placed in separate DOM layers: fixed header vs. scrollable body)

// ── Allocation block types & colors (matching Figma tokens) ──────────────────

export type BlockType = 'allocation' | 'misallocation' | 'unassigned' | 'ooo'

export interface OooInterval {
  /** Clamped to the containing slot's bounds — used for pixel positioning. */
  start: Date
  end: Date
  /** Original OOO alloc dates — shown in the TIME OFF tooltip. */
  origStart: Date
  origEnd: Date
}

export interface RenderSlot {
  start: Date
  end: Date
  totalHours: number
  projectNames: string[]
  blockType: BlockType
  allocs: Allocation[]
  hasNonBillable: boolean
  /** OOO periods that fall (partially or fully) within this slot. */
  oooIntervals: OooInterval[]
}

export function fmtTooltipDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const day   = String(d.getDate()).padStart(2, '0')
  const year  = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
}

// Block colours reference CSS custom properties (Figma: 4. Custom / allocation-timeline)
// so they automatically switch between light and dark themes.
function oooStripe(color: string): string {
  return `linear-gradient(135deg, ${color} 25%, transparent 25%, transparent 50%, ${color} 50%, ${color} 75%, transparent 75%, transparent 100%)`
}

export const BLOCK_COLORS: Record<BlockType, { bg: string; border: string; fg: string; oooPattern: string }> = {
  allocation:    { bg: 'var(--timeline-assigned-bg)',   border: 'var(--timeline-assigned-stroke)',   fg: 'var(--timeline-assigned-fg)',   oooPattern: oooStripe('var(--timeline-assigned-ooo)')   },
  misallocation: { bg: 'var(--timeline-misalloc-bg)',   border: 'var(--timeline-misalloc-stroke)',   fg: 'var(--timeline-misalloc-fg)',   oooPattern: oooStripe('var(--timeline-misalloc-ooo)')   },
  unassigned:    { bg: 'var(--timeline-unassigned-bg)', border: 'var(--timeline-unassigned-stroke)', fg: 'var(--timeline-unassigned-fg)', oooPattern: oooStripe('var(--timeline-unassigned-ooo)') },
  ooo:           { bg: 'transparent',                   border: 'none',                              fg: 'var(--timeline-assigned-fg)',   oooPattern: oooStripe('var(--timeline-assigned-ooo)')   },
}

// Full range covered by mock data (matches allocations.ts RANGE_END: today + 6 months)
const ALLOC_RANGE_END = new Date('2026-10-01')

/**
 * Builds render slots for one person's timeline:
 *  1. Groups overlapping project allocs into allocation/misallocation blocks.
 *  2. Fills EVERY gap — past and future — from person start to ALLOC_RANGE_END
 *     with unassigned (0h "No projects") blocks.
 *  3. Attaches OOO periods as sub-intervals on the blocks they overlap, so the
 *     stripe is always rendered inside a real block (never floating in empty space).
 */
function buildRenderSlots(
  personAllocs: Allocation[],
  capacity: number,
  _today: Date,
  personStartDate: string,
): RenderSlot[] {
  const projectAllocs = personAllocs.filter(a => a.type !== 'ooo')
  const oooAllocs     = personAllocs.filter(a => a.type === 'ooo')

  // ── 1. Group overlapping project allocs ──────────────────────────────────
  const sorted = [...projectAllocs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )

  type Group = { start: Date; end: Date; allocs: Allocation[] }
  const groups: Group[] = []
  for (const alloc of sorted) {
    const s = new Date(alloc.startDate)
    const e = new Date(alloc.endDate)
    const hit = groups.find(g => g.start < e && g.end > s)
    if (!hit) {
      groups.push({ start: s, end: e, allocs: [alloc] })
    } else {
      hit.allocs.push(alloc)
      if (s < hit.start) hit.start = s
      if (e > hit.end)   hit.end   = e
    }
  }

  const slots: RenderSlot[] = groups.map(g => {
    const totalHours     = g.allocs.reduce((sum, a) => sum + a.hoursPerWeek, 0)
    const projectNames   = g.allocs.map(a => PROJECT_MAP.get(a.projectId)?.name ?? a.projectId)
    const hasNonBillable = g.allocs.some(a => a.nonBillable)
    const blockType: BlockType = totalHours === capacity ? 'allocation' : 'misallocation'
    return { start: g.start, end: g.end, totalHours, projectNames, blockType, allocs: g.allocs, hasNonBillable, oooIntervals: [] }
  })

  // ── 2. Fill ALL gaps with unassigned blocks (past AND future) ────────────
  // Start from the later of person's hire date or the gantt's data origin.
  const gapStart = new Date(
    Math.max(new Date(personStartDate).getTime(), GANTT_START.getTime()),
  )
  const sortedByStart = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime())
  let cursor = new Date(gapStart)

  const gapSlots: RenderSlot[] = []
  for (const s of sortedByStart) {
    if (s.start > cursor) {
      gapSlots.push({
        start:          new Date(cursor),
        end:            new Date(s.start),
        totalHours:     0,
        projectNames:   ['No projects'],
        blockType:      'unassigned',
        allocs:         [],
        hasNonBillable: false,
        oooIntervals:   [],
      })
    }
    if (s.end > cursor) cursor = new Date(s.end)
  }
  // Tail gap after the last project
  if (cursor < ALLOC_RANGE_END) {
    gapSlots.push({
      start:          new Date(cursor),
      end:            new Date(ALLOC_RANGE_END),
      totalHours:     0,
      projectNames:   ['No projects'],
      blockType:      'unassigned',
      allocs:         [],
      hasNonBillable: false,
      oooIntervals:   [],
    })
  }

  const allSlots = [...slots, ...gapSlots]

  // ── 3. Merge overlapping OOO allocs, then attach as sub-intervals ────────
  // Sort → sweep to union overlapping/adjacent ranges so no stripe ever overlaps.
  const sortedOoo = [...oooAllocs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )
  const mergedOoo: { start: Date; end: Date }[] = []
  for (const ooo of sortedOoo) {
    const s = new Date(ooo.startDate)
    const e = new Date(ooo.endDate)
    const last = mergedOoo[mergedOoo.length - 1]
    if (last && s <= last.end) {
      if (e > last.end) last.end = e   // extend
    } else {
      mergedOoo.push({ start: s, end: e })
    }
  }

  for (const ooo of mergedOoo) {
    const origStart = ooo.start
    const origEnd   = ooo.end
    for (const slot of allSlots) {
      const overlapStart = origStart > slot.start ? origStart : slot.start
      const overlapEnd   = origEnd   < slot.end   ? origEnd   : slot.end
      if (overlapStart < overlapEnd) {
        slot.oooIntervals.push({ start: overlapStart, end: overlapEnd, origStart, origEnd })
      }
    }
  }

  return allSlots
}

// ── Timeline block components ─────────────────────────────────────────────────

export interface AllocationBlockProps {
  blockType: BlockType
  totalHours: number
  projectNames: string[]
  hasNonBillable?: boolean
  /** Display width in px — in production this is set by the Gantt layout engine. */
  width?: number
}

/**
 * A single Gantt allocation bar.
 * For Storybook / testing: renders with `position:relative` and a configurable
 * fixed width — in production it is placed absolutely inside a row div.
 */
export function AllocationBlock({
  blockType,
  totalHours,
  projectNames,
  hasNonBillable = false,
  width = 240,
}: AllocationBlockProps) {
  const c = BLOCK_COLORS[blockType]

  return (
    <div className="relative h-[32px]" style={{ width }}>
      <div
        className="absolute inset-0 rounded"
        style={{
          backgroundColor: c.bg,
          border:          `1px solid ${c.border}`,
          boxShadow:       '0 1px 2px 0 rgba(0,0,0,0.05)',
        }}
      />
      <div className="absolute inset-0 flex items-center gap-2 px-3 overflow-hidden">
        <span className="shrink-0 text-[12px] font-semibold leading-4" style={{ color: c.fg }}>
          {totalHours}h
        </span>
        {hasNonBillable && (
          <span className="shrink-0 inline-flex items-center justify-center rounded-sm bg-accent text-accent-foreground px-1.5 py-0.5 text-xs font-medium leading-4">
            NB
          </span>
        )}
        <div className="min-w-0 flex items-center overflow-hidden" style={{ color: c.fg }}>
          {projectNames.map((name, ni) => (
            <Fragment key={ni}>
              {ni > 0 && (
                <span className="shrink-0 text-[12px] leading-4 opacity-30 mx-2">|</span>
              )}
              <span className="text-[12px] font-normal leading-4 truncate">{name}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface AllocationTooltipRow {
  projectName:  string
  hoursPerWeek: number
  startDate:    string
  endDate:      string
  nonBillable?: boolean
}

/**
 * Dark tooltip card shown on hover over a Gantt allocation block.
 * Can be rendered standalone (outside a Tooltip) for Storybook review.
 */
export function AllocationTooltip({ allocs }: { allocs: AllocationTooltipRow[] }) {
  return (
    <div className="rounded-lg overflow-hidden shadow-xl" style={{ backgroundColor: '#1e2939', minWidth: 320 }}>
      <div
        className="grid px-4 text-white"
        style={{ gridTemplateColumns: '1fr 56px 56px auto' }}
      >
        <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50 pr-4">ACCOUNT</span>
        <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50 text-right pr-4">WORKING</span>
        <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50 text-right pr-4">CONTRACT</span>
        <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50">DATES</span>
        {allocs.map((a, ai) => (
          <Fragment key={ai}>
            <span className="py-2 text-[13px] font-medium truncate pr-4 border-t border-white/10">
              {a.projectName}
              {a.nonBillable && (
                <span className="ml-1.5 text-xs font-medium bg-badge-blue border border-badge-blue-stroke text-badge-blue-fg rounded-sm px-1.5 py-0.5 align-middle">NB</span>
              )}
            </span>
            <span className="py-2 text-[13px] text-right text-white/80 border-t border-white/10 pr-4">{a.hoursPerWeek}h</span>
            <span className="py-2 text-[13px] text-right text-white/80 border-t border-white/10 pr-4">{a.hoursPerWeek}h</span>
            <span className="py-2 text-[13px] text-white/80 whitespace-nowrap border-t border-white/10">
              {fmtTooltipDate(a.startDate)} – {fmtTooltipDate(a.endDate)}
            </span>
          </Fragment>
        ))}
      </div>
      <div className="h-2" />
    </div>
  )
}

// ── People list item ──────────────────────────────────────────────────────────

export function PeopleListItem({
  person,
  onClick,
  isSelected,
}: {
  person: Person
  onClick?: () => void
  isSelected?: boolean
}) {
  return (
    // bg-background is explicit so the row is always opaque — prevents
    // canvas allocation blocks from bleeding through when scrolled.
    <div
      className={cn(
        'h-[72px] flex items-center gap-2 px-4 border-b border-r border-border cursor-pointer group',
        isSelected ? 'bg-extended-hover' : 'bg-background hover:bg-extended-hover',
      )}
      onClick={onClick}
    >
      <ChevronRight className="hidden h-3 w-3 text-muted-foreground/50 shrink-0 group-hover:text-muted-foreground transition-colors" />
      <img
        src={person.avatar}
        alt={person.name}
        className="h-8 w-8 rounded-full shrink-0 bg-muted"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium text-foreground leading-5 truncate">
            {person.name}
          </p>
          {person.employmentType === 'PT' && (
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground border border-border rounded px-1 leading-4">
              PT
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-4 truncate">
          {person.jobTitle}
        </p>
      </div>
    </div>
  )
}

// ── Person details side panel ─────────────────────────────────────────────────

const PANEL_EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)'
const PANEL_DURATION = '0.35s'
const PANEL_FADE_MS  = 300

interface PersonDetailsSidePanelProps {
  person: Person | null
  isOpen: boolean
  onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "2026-01-01" → "Jan 01 '26" */
function fmtAllocDate(s: string): string {
  const d   = new Date(s + 'T00:00:00')
  const mon = d.toLocaleDateString('en-US', { month: 'short' })
  const day = String(d.getDate()).padStart(2, '0')
  const yr  = String(d.getFullYear()).slice(-2)
  return `${mon} ${day} '${yr}`
}

/** Derive an email address from a person's full name. */
function emailFromName(name: string): string {
  const parts = name.toLowerCase().replace(/[^a-z ]/g, '').split(' ')
  return `${parts[0]}.${parts[parts.length - 1]}@fluxon.com`
}

/** Map location to a holiday calendar label. */
function holidaysLabel(location: string): string {
  if (location.includes('UK') || location.includes('London') || location.includes('Dublin'))
    return 'British 🇬🇧'
  if (location.includes('USA') || location.includes('New York'))
    return 'American 🇺🇸'
  if (location.includes('PL') || location.includes('Warsaw'))
    return 'Polish 🇵🇱'
  if (location.includes('DE') || location.includes('Berlin'))
    return 'German 🇩🇪'
  if (location.includes('NL') || location.includes('Amsterdam'))
    return 'Dutch 🇳🇱'
  if (location.includes('IE'))
    return 'Irish 🇮🇪'
  return '—'
}

/** A single row in the allocation date list. */
export interface AllocRowData {
  id: string
  startDate: string
  endDate: string
  hoursPerWeek: number
  nonBillable: boolean
}

/** A project group (title + 1-n date rows). */
export interface AllocGroup {
  projectId: string
  projectName: string
  rows: AllocRowData[]
}

function buildAllocGroups(allocs: Allocation[]): AllocGroup[] {
  const map = new Map<string, AllocGroup>()
  for (const a of allocs) {
    if (!map.has(a.projectId)) {
      map.set(a.projectId, {
        projectId:   a.projectId,
        projectName: PROJECT_MAP.get(a.projectId)?.name ?? a.projectId,
        rows:        [],
      })
    }
    map.get(a.projectId)!.rows.push({
      id:           a.id,
      startDate:    a.startDate,
      endDate:      a.endDate,
      hoursPerWeek: a.hoursPerWeek,
      nonBillable:  a.nonBillable ?? false,
    })
  }
  for (const g of map.values()) {
    g.rows.sort((a, b) => b.startDate.localeCompare(a.startDate))
  }
  return [...map.values()]
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** One allocation row: date range | [NB badge] | hours */
export function AllocRow({
  row,
  capacity,
}: {
  row: AllocRowData
  capacity: number
}) {
  return (
    <div className="flex items-center gap-[10px] h-5">
      <p className="flex-1 min-w-0 text-xs text-foreground opacity-50 leading-none truncate">
        {fmtAllocDate(row.startDate)} – {fmtAllocDate(row.endDate)}
      </p>
      {row.nonBillable && (
        <span className="shrink-0 inline-flex items-center justify-center rounded-sm bg-badge-blue border border-badge-blue-stroke text-badge-blue-fg px-1.5 py-0.5 text-xs font-medium leading-4">
          NB
        </span>
      )}
      <p className="shrink-0 text-xs text-foreground opacity-50 leading-none w-[46px] text-right">
        {row.hoursPerWeek}/{capacity}h
      </p>
    </div>
  )
}

/** One project group: title row + allocation rows */
export function AllocGroupBlock({
  group,
  capacity,
}: {
  group: AllocGroup
  capacity: number
}) {
  return (
    <div className="flex flex-col gap-1">
      {/* Title */}
      <div className="flex items-center gap-1 h-8">
        <p className="min-w-0 text-sm font-medium text-foreground leading-5 truncate">
          {group.projectName}
        </p>
        <button
          type="button"
          aria-label={`Open ${group.projectName}`}
          className="shrink-0 flex items-center justify-center h-5 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
      {/* Date rows */}
      <div className="flex flex-col gap-2">
        {group.rows.map((row) => (
          <AllocRow key={row.id} row={row} capacity={capacity} />
        ))}
      </div>
    </div>
  )
}

/** Profile field row: icon + label (w-140) + value. */
export function SummaryRenderer({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-3 text-sm text-muted-foreground leading-5">
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          const lines = block.split('\n')
          const heading = lines[0].replace('## ', '')
          const rest = lines.slice(1)
          const intro = rest.filter(l => l.trim() && !l.startsWith('- ')).join(' ')
          const bullets = rest.filter(l => l.startsWith('- ')).map(l => l.slice(2))
          return (
            <div key={i}>
              <p className="font-semibold text-foreground mb-1">{heading}</p>
              {intro && <p className="mb-1">{intro}</p>}
              {bullets.length > 0 && (
                <ul className="list-disc pl-4 space-y-0.5">
                  {bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}
            </div>
          )
        }
        return <p key={i}>{block}</p>
      })}
    </div>
  )
}

export function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 h-8">
      <div className="flex items-center gap-2 w-[140px] shrink-0 opacity-50">
        <Icon className="h-4 w-4 shrink-0 text-foreground" />
        <span className="text-sm font-medium text-foreground leading-5 truncate">
          {label}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex items-center">
        {value}
      </div>
    </div>
  )
}

/**
 * Overlapping avatar stack — matches Figma "Team" value variant.
 * Shows up to `maxVisible` circular 24px avatars with 8px overlap, then
 * an "N people" count label. Hovering shows all names in a tooltip.
 */
export function AvatarStack({ people, maxVisible = 6 }: { people: Person[]; maxVisible?: number }) {
  const shown = people.slice(0, maxVisible)
  return (
    <div className="flex items-center gap-1.5">
      {/* Overlapping circles — individual tooltip per avatar */}
      <div className="flex isolate items-center pr-2 shrink-0">
        {shown.map((p, i) => (
          <Tooltip key={p.id}>
            <TooltipTrigger asChild>
              <img
                src={p.avatar}
                alt={p.name}
                className="h-6 w-6 rounded-full overflow-hidden object-cover shrink-0 -mr-2 ring-2 ring-background cursor-default"
                style={{ zIndex: shown.length - i }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">{p.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <span className="text-sm font-medium text-foreground leading-5">
        {shown.length} {shown.length === 1 ? 'person' : 'people'}
      </span>
    </div>
  )
}

// ── Main panel component ──────────────────────────────────────────────────────

export function PersonDetailsSidePanel({ person, isOpen, onClose }: PersonDetailsSidePanelProps) {
  const navigate = useNavigate()
  const [displayedPerson, setDisplayedPerson] = useState<Person | null>(person)
  const [contentVisible,  setContentVisible]  = useState(false)
  const [isSwitching,     setIsSwitching]     = useState(false)
  const wasOpen  = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!isOpen) {
      setContentVisible(false)
      setIsSwitching(false)
      wasOpen.current = false
      return
    }

    if (!wasOpen.current) {
      setIsSwitching(false)
      setDisplayedPerson(person)
      setContentVisible(true)
      wasOpen.current = true
      return
    }

    // Panel already open: cross-fade to new person
    setIsSwitching(true)
    setContentVisible(false)
    timerRef.current = setTimeout(() => {
      setDisplayedPerson(person)
      setContentVisible(true)
    }, PANEL_FADE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [person?.id, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const { currentGroups, pastGroups, capacity, manager, directReports } = useMemo(() => {
    if (!displayedPerson) {
      return { currentGroups: [], pastGroups: [], capacity: 40, manager: null, directReports: [] }
    }
    const cap    = displayedPerson.employmentType === 'PT' ? 20 : 40
    const allocs = (ALLOCS_BY_PERSON.get(displayedPerson.id) ?? [])
      .filter((a) => a.type === 'project')
    const current = allocs.filter((a) => new Date(a.endDate + 'T00:00:00') >= today)
    const past    = allocs.filter((a) => new Date(a.endDate + 'T00:00:00') <  today)

    // Manager — not shown for Exec team members
    const managerId = displayedPerson.team !== 'Exec'
      ? MANAGER_MAP[displayedPerson.id]
      : undefined
    const mgr = managerId ? (PERSON_MAP.get(managerId) ?? null) : null

    // Direct reports
    const reportIds = DIRECT_REPORTS_MAP.get(displayedPerson.id) ?? []
    const reports   = reportIds.map((id) => PERSON_MAP.get(id)).filter(Boolean) as Person[]

    return {
      currentGroups: buildAllocGroups(current),
      pastGroups:    buildAllocGroups(past),
      capacity:      cap,
      manager:       mgr,
      directReports: reports,
    }
  }, [displayedPerson, today])

  const fadeDuration = isSwitching ? `${PANEL_FADE_MS}ms` : '450ms'
  const fadeDelay    = isSwitching ? '0ms' : '200ms'

  return (
    <TooltipProvider delayDuration={400}>
    {/*
     * Outer wrapper handles the slide: width 0 ↔ 420px pushes the main panel.
     * marginLeft cancels the parent gap-[10px] when closed.
     */}
    <div
      className="overflow-hidden flex-shrink-0 h-full"
      style={{
        width:      isOpen ? 420 : 0,
        marginLeft: isOpen ? 0 : -10,
        transition: `width ${PANEL_DURATION} ${PANEL_EASING}, margin-left ${PANEL_DURATION} ${PANEL_EASING}`,
      }}
    >
      <div className="w-[420px] h-full">
        <div className="h-full bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 relative flex items-center gap-1 px-5 pt-3 pb-2 border-b border-border">
            <span className="text-base font-semibold text-foreground leading-none">
              Person details
            </span>
            <Button
              variant="ghost"
              onClick={() => navigate(`/people/profile/${displayedPerson?.id ?? ''}`)}
              className="h-8 w-8 p-0 opacity-70"
              aria-label="Open profile page"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-70"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ── Scrollable content — fades in/out on person switch ───────── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              opacity:    contentVisible ? 1 : 0,
              transition: `opacity ${fadeDuration} ${PANEL_EASING} ${fadeDelay}`,
            }}
          >
            {displayedPerson && (
              <>

                {/* ── Section 1: Profile ─────────────────────────────────── */}
                <div className="p-5 flex flex-col gap-4">

                  {/* Hero row: avatar + name + job + social */}
                  <div className="flex items-start gap-4">
                    <img
                      src={displayedPerson.avatar}
                      alt={displayedPerson.name}
                      className="h-14 w-14 rounded-full bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-xl text-foreground leading-7 truncate">
                        {displayedPerson.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground leading-5 truncate">
                          {displayedPerson.jobTitle}
                        </p>
                      </div>
                    </div>
                    {/* Social buttons — match Figma node 195:11743 states */}
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <button
                        type="button"
                        aria-label="LinkedIn"
                        className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background shadow-xs hover:bg-[#e7ebff] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(163,163,163,0.5)] transition-colors"
                      >
                        <LinkedInLogo className="block shrink-0 h-9 w-9" />
                      </button>
                      <button
                        type="button"
                        aria-label="Slack"
                        className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background shadow-xs hover:bg-[#e7ebff] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(163,163,163,0.5)] transition-colors"
                      >
                        <SlackLogo className="block shrink-0 h-9 w-9" />
                      </button>
                    </div>
                  </div>

                  {/* Field rows */}
                  <div className="flex flex-col gap-1">
                    <ProfileField
                      icon={Mail}
                      label="Mail"
                      value={
                        <a
                          href={`mailto:${emailFromName(displayedPerson.name)}`}
                          className="text-sm font-medium text-primary leading-5 truncate hover:underline"
                        >
                          {emailFromName(displayedPerson.name)}
                        </a>
                      }
                    />
                    <ProfileField
                      icon={Dribbble}
                      label="Team"
                      value={
                        <span className="text-sm font-medium text-foreground leading-5">
                          {displayedPerson.team}
                        </span>
                      }
                    />
                    <ProfileField
                      icon={BriefcaseBusiness}
                      label="Status"
                      value={
                        <span className="text-sm font-medium text-foreground leading-5">
                          {displayedPerson.employmentType === 'PT' ? 'Part Time' : 'Full Time'}
                        </span>
                      }
                    />
                    <ProfileField
                      icon={MapPin}
                      label="Location"
                      value={
                        <span className="text-sm font-medium text-foreground leading-5">
                          {displayedPerson.location}
                        </span>
                      }
                    />
                    <ProfileField
                      icon={TreePalm}
                      label="Holidays"
                      value={
                        <span className="text-sm font-medium text-foreground leading-5">
                          {holidaysLabel(displayedPerson.location)}
                        </span>
                      }
                    />
                    <ProfileField
                      icon={Calendar}
                      label="Start date"
                      value={
                        <span className="text-sm font-medium text-foreground leading-5">
                          {fmtAllocDate(displayedPerson.startDate)}
                        </span>
                      }
                    />
                    <ProfileField
                      icon={User}
                      label="Manager"
                      value={
                        manager ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img
                              src={manager.avatar}
                              alt={manager.name}
                              className="h-6 w-6 rounded-full shrink-0 bg-muted"
                            />
                            <span className="text-sm font-medium text-foreground leading-5 truncate">
                              {manager.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-foreground opacity-50 leading-5">
                            —
                          </span>
                        )
                      }
                    />
                    {directReports.length > 0 && (
                      <ProfileField
                        icon={Users}
                        label="Direct team"
                        value={<AvatarStack people={directReports} />}
                      />
                    )}
                  </div>
                </div>

                {/* ── Section 2: Currently working on ───────────────────── */}
                <SidePanelSection title="Currently working on" defaultOpen>
                  {currentGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground pb-2">
                      No active allocations
                    </p>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {currentGroups.map((group) => (
                        <AllocGroupBlock
                          key={group.projectId}
                          group={group}
                          capacity={capacity}
                        />
                      ))}
                    </div>
                  )}
                </SidePanelSection>

                {/* ── Section 3: Past allocations ───────────────────────── */}
                <SidePanelSection
                  title={`Past allocations (${pastGroups.length})`}
                  defaultOpen={false}
                >
                  {pastGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground pb-2">
                      No past allocations
                    </p>
                  ) : (
                    <div className="flex flex-col">
                      {pastGroups.map((group, i) => (
                        <Fragment key={group.projectId}>
                          {i > 0 && <div className="h-px bg-border my-4" />}
                          <AllocGroupBlock group={group} capacity={capacity} />
                        </Fragment>
                      ))}
                    </div>
                  )}
                </SidePanelSection>

                {/* ── Section 4: Summary ────────────────────────────────── */}
                <SidePanelSection title="Summary" defaultOpen={false}>
                  <div className="pb-2">
                    <SummaryRenderer text={displayedPerson.summary} />
                  </div>
                </SidePanelSection>

                {/* ── Section 5: Badges ─────────────────────────────────── */}
                <SidePanelSection title="Badges" defaultOpen={false}>
                  <div className="flex flex-wrap gap-3 pb-2">
                    {displayedPerson.badges.map((id) => {
                      const src = BADGE_IMAGES[id]
                      return src ? (
                        <img key={id} src={src} alt={id} className="size-10 object-cover" />
                      ) : null
                    })}
                  </div>
                </SidePanelSection>

                {/* ── Section 6: Skills ─────────────────────────────────── */}
                <SidePanelSection title="Skills" defaultOpen={false}>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {displayedPerson.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="px-3 py-1.5">{skill}</Badge>
                    ))}
                  </div>
                </SidePanelSection>

                {/* ── Section 7: Growth Goals ───────────────────────────── */}
                <SidePanelSection title="Growth Goals" defaultOpen={false}>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {displayedPerson.growthGoals.map((goal) => (
                      <Badge key={goal} variant="outline" className="px-3 py-1.5">{goal}</Badge>
                    ))}
                  </div>
                </SidePanelSection>

                {/* ── Section 8: Interests and Hobbies ─────────────────── */}
                <SidePanelSection title="Interests and Hobbies" defaultOpen={false}>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {displayedPerson.hobbies.map((hobby) => (
                      <Badge key={hobby} variant="outline" className="px-3 py-1.5">{hobby}</Badge>
                    ))}
                  </div>
                </SidePanelSection>

              </>
            )}
          </div>

        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}

// ── People page ───────────────────────────────────────────────────────────────

export default function PeoplePage() {
  // ── URL-synced state (survives profile-page navigation) ──────────────────
  const [searchParams, setSearchParams] = useSearchParams()

  const search       = searchParams.get('q') ?? ''
  // Multi-value filters use getAll() so values with commas (e.g. "Amsterdam, NL") are safe.
  const division     = searchParams.getAll('div')
  const team         = searchParams.getAll('team')
  const availability = searchParams.getAll('avail')
  const location     = searchParams.getAll('loc')
  const sortDir      = (searchParams.get('sort') ?? 'asc') as 'asc' | 'desc'

  // Each setter replaces the current history entry to keep Back clean.
  // Multi-value filters append one entry per value so commas in values are preserved.
  const sp = (fn: (p: URLSearchParams) => void) =>
    setSearchParams(prev => { const n = new URLSearchParams(prev); fn(n); return n }, { replace: true })

  const setSearch = (v: string) => sp(p => v ? p.set('q', v) : p.delete('q'))

  const setMulti = (key: string) => (v: string[]) =>
    sp(p => { p.delete(key); v.forEach(item => p.append(key, item)) })

  const setDivision     = setMulti('div')
  const setTeam         = setMulti('team')
  const setAvailability = setMulti('avail')
  const setLocation     = setMulti('loc')
  const setSortDir      = (fn: (d: 'asc' | 'desc') => 'asc' | 'desc') =>
    sp(p => { const next = fn((p.get('sort') ?? 'asc') as 'asc' | 'desc'); next === 'asc' ? p.delete('sort') : p.set('sort', next) })

  // ── Side panel state ─────────────────────────────────────────────────────
  const panelPersonId  = searchParams.get('panel')
  const selectedPerson = panelPersonId ? (PERSON_MAP.get(panelPersonId) ?? null) : null
  const sidePanelOpen  = selectedPerson !== null

  const handlePersonClick = (person: Person) => sp(p => p.set('panel', person.id))
  const handleClosePanel  = ()               => sp(p => p.delete('panel'))

  // ── Timeline state ───────────────────────────────────────────────────────
  const [zoom, setZoom] = useState<ZoomLevel>('week')

  const zoomIdx    = ZOOM_LEVELS.indexOf(zoom)
  const canZoomIn  = zoomIdx < ZOOM_LEVELS.length - 1
  const canZoomOut = zoomIdx > 0

  const { colWidth }  = ZOOM_CONFIG[zoom]
  const colCount      = useMemo(() => computeColCount(zoom), [zoom])
  const columns       = useMemo(() => buildColumns(zoom), [zoom])
  const todayX        = useMemo(() => todayOffset(zoom), [zoom])
  const totalWidth    = colCount * colWidth

  // ── Refs for scroll sync (dates header ↔ timeline body) ──────────────────
  const datesHeaderRef  = useRef<HTMLDivElement>(null)
  const timelineBodyRef = useRef<HTMLDivElement>(null)

  const [todayInView,  setTodayInView]  = useState(true)
  // labelVersion increments after each navigation/zoom settle to trigger a
  // single non-blocking re-render that repositions labels at the new scroll.
  const [labelVersion, setLabelVersion] = useState(0)
  const [, startTransition] = useTransition()

  // Scroll position stored in a ref — never causes re-renders on scroll.
  const timelineScrollRef = useRef(0)

  // Convenience: hide labels instantly via a CSS class (zero React re-render).
  const hideLabelsDom = () => timelineBodyRef.current?.classList.add('labels-out')

  function checkTodayInView(scrollLeft: number) {
    const el = timelineBodyRef.current
    if (!el || todayX === null) return
    setTodayInView(scrollLeft <= todayX && todayX <= scrollLeft + el.clientWidth)
  }

  // Sync dates header + todayInView on scroll (fires during programmatic smooth scroll too).
  // Does NOT update timelineScrollRef — that happens only on discrete navigation settle.
  function handleTimelineScroll(e: React.UIEvent<HTMLDivElement>) {
    const sl = e.currentTarget.scrollLeft
    if (datesHeaderRef.current) datesHeaderRef.current.scrollLeft = sl
    checkTodayInView(sl)
  }

  // Block horizontal wheel/trackpad scroll — only arrow buttons navigate horizontally.
  // Non-passive so preventDefault() is honoured (React's synthetic onWheel is passive).
  useEffect(() => {
    const el = timelineBodyRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > 0) e.preventDefault()
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Navigate left/right one viewport width with a label fade.
   * Fade-out: instant DOM class toggle (zero React re-render).
   * Fade-in: single non-blocking startTransition re-render after scroll settles.
   */
  function navigate(dir: 'left' | 'right') {
    const el = timelineBodyRef.current
    if (!el) return

    hideLabelsDom() // instant, no re-render

    setTimeout(() => {
      const delta = dir === 'right' ? el.clientWidth : -el.clientWidth
      el.scrollBy({ left: delta, behavior: 'smooth' })
      // dates header syncs via handleTimelineScroll during the animation

      const settle = () => {
        timelineScrollRef.current = el.scrollLeft
        startTransition(() => setLabelVersion(v => v + 1)) // non-blocking reposition
      }

      if ('onscrollend' in el) {
        el.addEventListener('scrollend', settle, { once: true })
      } else {
        setTimeout(settle, 420)
      }
    }, 150)
  }

  /** Imperatively jump to today and update the scroll ref. */
  function scrollToToday(withFade = false) {
    const el = timelineBodyRef.current
    if (!el) return

    const doScroll = () => {
      const x  = todayOffset(zoom)
      const sl = Math.max(0, x - Math.floor(el.clientWidth * 0.25))
      el.scrollLeft = sl
      if (datesHeaderRef.current) datesHeaderRef.current.scrollLeft = sl
      setTodayInView(true)
      timelineScrollRef.current = sl
    }

    if (withFade) {
      hideLabelsDom()
      setTimeout(() => {
        doScroll()
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            startTransition(() => setLabelVersion(v => v + 1))
          )
        )
      }, 150)
    } else {
      doScroll()
    }
  }

  // On zoom change: hide labels instantly, reposition, then fade back in.
  useEffect(() => {
    hideLabelsDom()
    requestAnimationFrame(() => {
      scrollToToday()
      requestAnimationFrame(() => startTransition(() => setLabelVersion(v => v + 1)))
    })
  }, [zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  // After each navigation/zoom settle, React has committed new label positions.
  // Remove the CSS hide-class here so the labels fade in via CSS transition.
  // requestAnimationFrame ensures the browser has painted the hidden state first.
  useEffect(() => {
    if (labelVersion === 0) return // initial mount — labels start visible
    requestAnimationFrame(() => {
      timelineBodyRef.current?.classList.remove('labels-out')
    })
  }, [labelVersion])

  // ── Filtered + sorted people ─────────────────────────────────────────────
  const people = useMemo(() => {
    let list = MOCK_PEOPLE
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.jobTitle.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q),
      )
    }
    if (division.length     > 0) list = list.filter((p) => division.includes(p.division))
    if (team.length         > 0) list = list.filter((p) => team.includes(p.team))
    if (availability.length > 0) list = list.filter((p) => availability.includes(p.employmentType))
    if (location.length     > 0) list = list.filter((p) => location.includes(p.location))
    return [...list].sort((a, b) => {
      const c = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? c : -c
    })
  }, [search, division, team, availability, location, sortDir])

  // ── Per-person render slots (memoized — recomputed only when people change) ──
  // buildRenderSlots is pure and zoom-independent, so we keep results stable
  // across labelsVisible / scroll-position re-renders.
  const allPersonSlots = useMemo(() => {
    const todayMemo = new Date(); todayMemo.setHours(0, 0, 0, 0)
    return people.map(person => {
      const personAllocs = ALLOCS_BY_PERSON.get(person.id) ?? []
      const capacity     = person.employmentType === 'PT' ? 20 : 40
      return buildRenderSlots(personAllocs, capacity, todayMemo, person.startDate)
    })
  }, [people])

  // ── Vertical scrollbar width measurement ──────────────────────────────────
  // The body container's V-scrollbar consumes horizontal pixels, making the
  // canvas viewport narrower than the fixed dates header above it.  At max
  // horizontal scroll this creates a column misalignment equal to the gutter
  // width.  We measure the gutter after each render that might add/remove the
  // scrollbar (people count change) and expose it as a spacer appended to the
  // dates header inner div so both containers share the same max scrollLeft.
  const [vScrollbarWidth, setVScrollbarWidth] = useState(0)
  useEffect(() => {
    const el = timelineBodyRef.current
    if (!el) return
    setVScrollbarWidth(el.offsetWidth - el.clientWidth)
  }, [people.length])

  return (
    <div className="h-full p-[10px] pt-[60px] flex gap-[10px] overflow-x-auto">
      <div className="bg-background border border-border rounded-lg shadow-sm flex-1 h-full flex flex-col min-w-0 overflow-hidden">

        {/* ── Fixed header layer 1: page title ── */}
        <div className="flex-shrink-0 flex items-center px-5 pt-5 pb-4 border-b border-border">
          <h1 className="text-base font-semibold leading-none text-foreground">People</h1>
        </div>

        {/* ── Fixed header layer 2: Search (left) | Filters + Nav (right) ── */}
        <div className="flex-shrink-0 flex h-14 border-b border-border">

          {/* Search */}
          <div className="w-[320px] flex-shrink-0 border-r border-border flex items-center px-3">
            <InputGroup
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="h-9"
              rightElement={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Filters + zoom/nav */}
          <div className="flex-1 flex items-center justify-between px-3 min-w-0">
            <div className="flex items-center gap-2">

              <FilterMultiSelect
                label="Division"
                options={ALL_DIVISIONS.map((d) => ({ value: d, label: d }))}
                value={division}
                onChange={setDivision}
              />

              <FilterMultiSelect
                label="Team"
                options={ALL_TEAMS.map((t) => ({ value: t, label: t }))}
                value={team}
                onChange={setTeam}
              />

              <FilterMultiSelect
                label="Availability"
                options={[
                  { value: 'FTE', label: 'Full-time (FTE)' },
                  { value: 'PT',  label: 'Part-time (PT)'  },
                ]}
                value={availability}
                onChange={setAvailability}
              />

              <FilterMultiSelect
                label="Location"
                options={ALL_LOCATIONS.map((l) => ({ value: l, label: l }))}
                value={location}
                onChange={setLocation}
              />

              {(division.length > 0 || team.length > 0 || availability.length > 0 || location.length > 0) && (
                <button
                  type="button"
                  className="ml-1 text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                  onClick={() => { setDivision([]); setTeam([]); setAvailability([]); setLocation([]) }}
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Zoom + navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  disabled={!canZoomOut}
                  onClick={() => setZoom(ZOOM_LEVELS[zoomIdx - 1])}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  disabled={!canZoomIn}
                  onClick={() => setZoom(ZOOM_LEVELS[zoomIdx + 1])}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Period nav */}
              <div className="flex h-9 rounded-md border border-input overflow-hidden">
                <Button
                  variant="ghost"
                  className="h-full w-9 rounded-none p-0"
                  aria-label="Previous period"
                  onClick={() => navigate('left')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className={`h-full rounded-none px-2 text-xs font-medium ${todayInView ? 'text-muted-foreground' : 'text-primary hover:text-primary'}`}
                  onClick={() => scrollToToday(true)}
                >
                  {zoom === 'week' ? 'Current week' : zoom === 'month' ? 'Current month' : 'Current Q'}
                </Button>
                <Button
                  variant="ghost"
                  className="h-full w-9 rounded-none p-0"
                  aria-label="Next period"
                  onClick={() => navigate('right')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Fixed header layer 3: Sort/Count (left) | Dates columns (right) ── */}
        <div className="flex-shrink-0 flex h-10 border-b border-border bg-background">

          {/* Count + sort */}
          <div className="w-[320px] flex-shrink-0 border-r border-border flex items-center justify-between px-2">
            <Badge
              variant="secondary"
              className="gap-1 px-2 py-0.5 rounded-full border-transparent text-xs font-medium text-muted-foreground"
            >
              <Users className="h-3 w-3" />
              {people.length}
            </Badge>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              aria-label={sortDir === 'asc' ? 'Sort Z to A' : 'Sort A to Z'}
            >
              {sortDir === 'asc'
                ? <ArrowDownAZ className="h-4 w-4" />
                : <ArrowUpAZ   className="h-4 w-4" />}
            </Button>
          </div>

          {/*
           * Dates header — overflow-x-hidden (no visible scrollbar here).
           * scrollLeft is kept in sync with timelineBodyRef via handleTimelineScroll.
           */}
          <div ref={datesHeaderRef} className="flex-1 overflow-hidden">
            {/* vScrollbarWidth spacer lets this div scroll as far as the canvas
                whose viewport is narrowed by the vertical scrollbar gutter. */}
            <div className="flex h-10" style={{ width: totalWidth + vScrollbarWidth }}>
              {columns.map((date, i) => {
                const isToday =
                  todayX !== null &&
                  todayX >= i * colWidth &&
                  todayX < (i + 1) * colWidth

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'flex-shrink-0 flex items-center justify-start',
                      'border-r border-border pl-2',
                      'text-[11px] font-normal tracking-wide leading-4 select-none',
                      isToday ? 'text-primary' : 'text-foreground opacity-50',
                    )}
                    style={{ width: colWidth }}
                  >
                    {colLabel(date, zoom)}
                  </div>
                )
              })}
              {/* Scrollbar-gutter spacer — matches the vertical scrollbar width
                  of the canvas so both containers share the same max scrollLeft */}
              {vScrollbarWidth > 0 && (
                <div className="flex-shrink-0" style={{ width: vScrollbarWidth }} />
              )}
            </div>
          </div>
        </div>

        {/*
         * ── Scrollable body ──────────────────────────────────────────────────
         * Single overflow:auto container handles BOTH vertical and horizontal
         * scroll so there is only ever one vertical scrollbar and one horizontal
         * scrollbar.  The left "People" column uses position:sticky left-0 so it
         * behaves like a frozen first column — it never moves horizontally while
         * the allocation canvas to its right scrolls freely in both directions.
         */}
        <div
          ref={timelineBodyRef}
          className="flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-minimal"
          onScroll={handleTimelineScroll}
        >

          {/* Frozen left column — sticks to left edge on horizontal scroll.
              No border-r here (it would scroll away); each row carries its own
              border-r so the separator is always visible for all visible rows. */}
          <div className="sticky left-0 z-20 w-[320px] flex-shrink-0 bg-background">
            {people.map((person) => (
              <PeopleListItem
                key={person.id}
                person={person}
                isSelected={selectedPerson?.id === person.id}
                onClick={() => handlePersonClick(person)}
              />
            ))}
            {people.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground border-r border-border">
                No people match the current filters.
              </div>
            )}
          </div>

          {/* Allocation canvas — scrolls with the container */}
          <div className="relative flex-shrink-0" style={{ width: totalWidth }}>

            {/* Today vertical indicator */}
            {todayX !== null && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-primary/70 z-30 pointer-events-none"
                style={{ left: todayX - 1 }}
              />
            )}

            {/* One row per person */}
            {people.map((person, personIdx) => {
              const slots = allPersonSlots[personIdx]

              return (
                <div
                  key={person.id}
                  className="relative flex h-[72px] border-b border-border overflow-hidden"
                  style={{ backgroundColor: selectedPerson?.id === person.id ? 'var(--extended-hover)' : 'var(--timeline-row-bg)' }}
                >
                  {/* Column grid lines */}
                  {columns.map((_date, j) => (
                    <div
                      key={j}
                      className="flex-shrink-0 h-full border-r border-border/40"
                      style={{ width: colWidth }}
                    />
                  ))}

                  {/* Allocation blocks — absolutely positioned over the grid */}
                  <TooltipProvider delayDuration={300}>
                  {slots.map((slot, si) => {
                    const left  = dateToX(slot.start, GANTT_START, zoom)
                    const right = dateToX(slot.end,   GANTT_START, zoom)
                    if (right <= 0 || left >= totalWidth) return null

                    const clampedLeft  = Math.max(0, left)
                    const clampedRight = Math.min(totalWidth, right)
                    const width        = clampedRight - clampedLeft
                    if (width < 3) return null

                    const c = BLOCK_COLORS[slot.blockType]

                    // OOO is now a sub-interval on each block — handled below after bgDiv

                    // Project block (Allocation / Misallocation / Unassigned)
                    const hasTooltip = slot.allocs.length > 0
                    const blockLeft  = clampedLeft + 2
                    const blockRight = blockLeft + (width - 4)

                    // Floating label: anchored to the visible left edge (viewport or block start,
                    // whichever is further right), clipped at the block's right edge via CSS `right`.
                    // Label is a SIBLING to the block background, so it is NOT clipped by the block's
                    // own bounds — only by the row's overflow and the block's right edge via `right`.
                    const viewLeft   = timelineScrollRef.current
                    const labelLeft  = Math.max(blockLeft + 12, viewLeft + 6)
                    const labelRight = totalWidth - blockRight + 6
                    const showLabel  = blockRight - 4 - labelLeft > 8

                    // Colored block background — tooltip trigger only, no overflow clipping needed
                    const bgDiv = (
                      <div
                        className="absolute top-[20px] h-[32px] rounded cursor-default"
                        style={{
                          left:            blockLeft,
                          width:           width - 4,
                          backgroundColor: c.bg,
                          border:          `1px solid ${c.border}`,
                          boxShadow:       '0 1px 2px 0 rgba(0,0,0,0.05)',
                        }}
                      />
                    )

                    // Floating label — sibling to block, clipped by row overflow + CSS right.
                    // Opacity is controlled by the .labels-out / .allocation-label CSS classes
                    // to avoid triggering a React re-render on hide.
                    const labelEl = showLabel && (
                      <div
                        className="allocation-label absolute top-[20px] h-[32px] flex items-center gap-2 pointer-events-none overflow-hidden z-10"
                        style={{
                          left:  labelLeft,
                          right: labelRight,
                        }}
                      >
                        <span
                          className="shrink-0 text-[12px] font-semibold leading-4"
                          style={{ color: c.fg }}
                        >
                          {slot.totalHours}h
                        </span>
                        {slot.hasNonBillable && (
                          <span className="shrink-0 inline-flex items-center justify-center rounded-sm bg-accent text-accent-foreground px-1.5 py-0.5 text-xs font-medium leading-4">
                            NB
                          </span>
                        )}
                        {slot.blockType !== 'unassigned' && zoom !== 'quarter' && (
                          <div className="min-w-0 flex items-center overflow-hidden" style={{ color: c.fg }}>
                            {slot.projectNames.map((name, ni) => (
                              <Fragment key={ni}>
                                {ni > 0 && (
                                  <span className="shrink-0 text-[12px] leading-4 opacity-30 mx-2">|</span>
                                )}
                                <span className="text-[12px] font-normal leading-4 truncate">{name}</span>
                              </Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    )

                    const tooltipContent = (
                      <TooltipContent
                        side="top"
                        align="start"
                        alignOffset={2}
                        sideOffset={6}
                        collisionPadding={{
                          left:   311,
                          right:  sidePanelOpen ? 420 : 10,
                          top:    4,
                          bottom: 4,
                        }}
                        className="p-0 bg-transparent border-0 shadow-none"
                      >
                        <div className="rounded-lg overflow-hidden shadow-xl" style={{ backgroundColor: '#1e2939', minWidth: 320 }}>
                          {/* Single grid spanning header + all data rows so every column
                              shares the same computed width — fixes misalignment caused
                              by independent `auto` column sizing per-row. */}
                          <div
                            className="grid px-4 text-white"
                            style={{ gridTemplateColumns: '1fr 56px 56px auto' }}
                          >
                            {/* Header cells */}
                            <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50 pr-4">ACCOUNT</span>
                            <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50 text-right pr-4">WORKING</span>
                            <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50 text-right pr-4">CONTRACT</span>
                            <span className="pt-3 pb-2 text-[10px] font-semibold tracking-wider opacity-50">DATES</span>
                            {/* Data cells — 4 per allocation, all in the same grid */}
                            {slot.allocs.map((a, ai) => {
                              const projName = PROJECT_MAP.get(a.projectId)?.name ?? a.projectId
                              return (
                                <Fragment key={ai}>
                                  <span className="py-2 text-[13px] font-medium truncate pr-4 border-t border-white/10">
                                    {projName}
                                    {a.nonBillable && <span className="ml-1.5 text-xs font-medium bg-badge-blue border border-badge-blue-stroke text-badge-blue-fg rounded-sm px-1.5 py-0.5 align-middle">NB</span>}
                                  </span>
                                  <span className="py-2 text-[13px] text-right text-white/80 border-t border-white/10 pr-4">{a.hoursPerWeek}h</span>
                                  <span className="py-2 text-[13px] text-right text-white/80 border-t border-white/10 pr-4">{a.hoursPerWeek}h</span>
                                  <span className="py-2 text-[13px] text-white/80 whitespace-nowrap border-t border-white/10">
                                    {fmtTooltipDate(a.startDate)} – {fmtTooltipDate(a.endDate)}
                                  </span>
                                </Fragment>
                              )
                            })}
                          </div>
                          <div className="h-2" />
                        </div>
                      </TooltipContent>
                    )

                    // OOO stripe overlays — SVG <pattern> for perfectly uniform diagonal stripes.
                    // Using SVG inline (not data URL) so CSS variables resolve correctly for
                    // the stroke color, giving automatic light/dark mode switching.
                    const oooOverlays = slot.oooIntervals.map((ooo, oi) => {
                      const oooAbsLeft  = dateToX(ooo.start, GANTT_START, zoom)
                      const oooAbsRight = dateToX(ooo.end,   GANTT_START, zoom)
                      const oooLeft  = Math.max(blockLeft, oooAbsLeft)
                      const oooRight = Math.min(blockLeft + (width - 4), oooAbsRight)
                      if (oooRight - oooLeft < 2) return null
                      const oooDiv = (
                        <div
                          className="absolute cursor-default rounded"
                          style={{
                            top:    20 + 4,
                            height: 32 - 8,
                            left:   oooLeft,
                            width:  oooRight - oooLeft,
                            backgroundImage: BLOCK_COLORS[slot.blockType].oooPattern,
                            backgroundSize:  '11.31px 11.31px',
                            opacity:         0.5,
                          }}
                        />
                      )
                      return (
                        <Tooltip key={`ooo-${si}-${oi}`}>
                          <TooltipTrigger asChild>{oooDiv}</TooltipTrigger>
                          <TooltipContent
                            side="top"
                            sideOffset={6}
                            collisionPadding={{ left: 311, right: sidePanelOpen ? 420 : 10, top: 4, bottom: 4 }}
                            className="p-0 bg-transparent border-0 shadow-none"
                          >
                            <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: '#1e2939' }}>
                              <p className="text-[10px] font-semibold tracking-wider text-white/50 mb-1">TIME OFF</p>
                              <p className="text-[13px] text-white whitespace-nowrap">
                                {fmtTooltipDate(ooo.origStart.toISOString().slice(0, 10))} – {fmtTooltipDate(ooo.origEnd.toISOString().slice(0, 10))}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })

                    return (
                      <Fragment key={`slot-${si}`}>
                        {hasTooltip ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{bgDiv}</TooltipTrigger>
                            {tooltipContent}
                          </Tooltip>
                        ) : bgDiv}
                        {oooOverlays}
                        {labelEl}
                      </Fragment>
                    )
                  })}
                  </TooltipProvider>
                </div>
              )
            })}
          </div>

        </div>
      </div>

      <PersonDetailsSidePanel
        person={selectedPerson}
        isOpen={sidePanelOpen}
        onClose={handleClosePanel}
      />
    </div>
  )
}
