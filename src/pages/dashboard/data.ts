// ── Allocations prototype data ──────────────────────────────────────────────
// Self-contained mock data for the Allocations dashboard flow (board → seat
// details sidebar → allocation modal). Mirrors the Figma frames:
//   Dashboard  4122-37964
//   Sidebar    4108-31059
//   Modal      4078-25194
//
// Kept separate from src/mocks/allocations.ts (which powers the People page).

import allAvatars from '@/assets/avatars'

const av = (i: number) => allAvatars[i % allAvatars.length]

// ── Types ───────────────────────────────────────────────────────────────────

export type Dept = 'Product and Design' | 'Engineering'

/** Filter grouping for the Seat Role filter (Designer / Engineer / TPM). */
export type SeatRoleGroup = 'Designer' | 'Engineer' | 'TPM'

/**
 * Visual state of a seat card on the board.
 * `proposed` = a pending-approval candidate holds the seat's next allocation
 * (purple, PA badge) — derived from the allocations, never stored on a filled seat.
 */
export type SeatState = 'filled' | 'proposed' | 'upcoming' | 'overdue' | 'open'

/** Where an allocation sits relative to the seat lifecycle. */
export type AllocStatus = 'current' | 'upcoming' | 'proposed' | 'past'

/** Small trailing badge on avatars / allocation blocks. */
export type PersonBadge = 'TA' | 'NB' | 'PA'

/**
 * Canonical TA / NB / PA tag colours — single source of truth shared by the
 * seat card, seat-details panel and timeline pills. Matches Figma `project_tags`
 * (4482-30382): TA = green, NB = indigo, PA = purple.
 */
export const PERSON_BADGE_STYLE: Record<PersonBadge, string> = {
  TA: 'bg-[#f0fdf4] text-[#15803d] dark:bg-[#052e16] dark:text-[#4ade80]',
  NB: 'bg-[#e7ebff] text-[#0e35ff] dark:bg-[#1e2a5a] dark:text-[#6e86ff]',
  PA: 'bg-[#e9d5ff] text-[#6b21a8] dark:bg-[#6b21a8] dark:text-[#e9d5ff]',
}

/**
 * Canonical tag pill shape — pairs with {@link PERSON_BADGE_STYLE}. Matches
 * Figma `project_tags` (4482-30382): 2px radius, 8px/2px padding, 12px medium.
 */
export const PERSON_BADGE_PILL =
  'inline-flex shrink-0 items-center justify-center rounded-[2px] px-2 py-0.5 text-xs font-medium leading-4'

export interface DashPerson {
  id: string
  /** Full name — "Aisha Okafor" */
  name: string
  /** Abbreviated — "Aisha O." */
  short: string
  avatar: string
  /** Job title — "Data Analyst", "Senior Software Engineer" */
  role: string
  reportsTo?: string
  /** Availability hint shown in the modal candidate list. */
  availability?: { label: string; tone: 'ok' | 'warn' }
}

/** A person's existing commitment that clashes with a proposed allocation —
 * rendered as a compact one-line row under the proposed candidate. */
export interface AllocConflict {
  project: string
  hoursPerWeek: number
  startDate: string
  endDate: string
  badge?: PersonBadge
}

export interface SeatAllocation {
  id: string
  personId: string
  status: AllocStatus
  startDate: string   // "YYYY-MM-DD"
  endDate: string
  hoursPerWeek: number
  nonBillable?: boolean
  badge?: PersonBadge
  /** Timeline bar colour in the modal's Current Allocation lane. */
  blockTone?: 'primary' | 'neutral' | 'misalloc'
  /** "This allocation will not reduce availability" checkbox state. */
  keepsAvailability?: boolean
  /** Proposed allocations only — the candidate's overlapping commitments. */
  conflicts?: AllocConflict[]
}

/** A note on a seat, shown in the sidebar's Notes accordion. */
export interface SeatNote {
  author: string
  date: string
  body: string
  /** Highlighted / unread treatment (accent bg + dot). */
  isNew?: boolean
}

export interface Seat {
  id: string
  /** Short role label on the card header: "Design", "Eng", "TPM" */
  role: string
  roleGroup: SeatRoleGroup
  dept: Dept
  hoursPerWeek: number
  weeks: number
  startDate: string
  endDate: string
  billable: boolean
  state: SeatState
  /** For overdue seats — "Overdue Xd". */
  overdueDays?: number
  /** For upcoming/open seats — "Starts M/D". */
  startsLabel?: string
  notesCount?: number
  notes?: SeatNote[]
  allocations: SeatAllocation[]
}

export interface DashProject {
  id: string
  client: string
  name: string
  dates: string
  /** Contract tag — omit to render the card without a tag. */
  contractType?: 'T&M' | 'Fixed'
  variant: 'default' | 'soon' | 'ending'
  notesCount?: number
  seats: Seat[]
}

// ── People (candidate pool + assigned) ───────────────────────────────────────

export const DASH_PEOPLE: DashPerson[] = [
  { id: 'p-ethan',  name: 'Ethan Thompson', short: 'Ethan T.', avatar: av(6),  role: 'Senior Software Engineer', reportsTo: 'Kenny Leung' },
  { id: 'p-priya',  name: 'Priya Patel',    short: 'Priya P.', avatar: av(0),  role: 'Data Analyst',            reportsTo: 'Kenny Leung' },
  { id: 'p-aisha',  name: 'Aisha Okafor',   short: 'Aisha O.', avatar: av(9),  role: 'Data Analyst',            reportsTo: 'Kenny Leung' },
  { id: 'p-maya',   name: 'Maya Palmer',    short: 'Maya P.',  avatar: av(1),  role: 'Senior Software Engineer', reportsTo: 'Dana Cross', availability: { label: 'Available in 2w', tone: 'ok' } },
  { id: 'p-sofia',  name: 'Sofia Rossi',    short: 'Sofia R.', avatar: av(2),  role: 'Senior Software Engineer', reportsTo: 'Dana Cross', availability: { label: '3w overlaps', tone: 'warn' } },
  { id: 'p-marcus', name: 'Marcus Jones',   short: 'Marcus J.', avatar: av(7), role: 'Backend Software Engineer', reportsTo: 'Dana Cross', availability: { label: 'Available now', tone: 'ok' } },
  { id: 'p-liam',   name: 'Liam Walsh',     short: 'Liam W.',  avatar: av(11), role: 'Full Stack Software Engineer', reportsTo: 'Dana Cross', availability: { label: 'Available in 1w', tone: 'ok' } },
  { id: 'p-nina',   name: 'Nina Berg',      short: 'Nina B.',  avatar: av(3),  role: 'Frontend Software Engineer', reportsTo: 'Dana Cross', availability: { label: '1w overlap', tone: 'warn' } },
  { id: 'p-names',  name: 'Nathan Salas',   short: 'Name S.',  avatar: av(5),  role: 'Senior Software Engineer', reportsTo: 'Dana Cross' },
]

export const DASH_PERSON_MAP: Map<string, DashPerson> = new Map(
  DASH_PEOPLE.map((p) => [p.id, p]),
)

// ── The "Design Seat" — the fully-populated seat behind the sidebar + modal ──
// Header: Design · 40h/week · 35 weeks · NB · Jun 24 '26 – Nov 10 '26

export const DESIGN_SEAT: Seat = {
  id: 'seat-design-hero',
  role: 'Design',
  roleGroup: 'Designer',
  dept: 'Product and Design',
  hoursPerWeek: 40,
  weeks: 35,
  startDate: '2026-06-24',
  endDate: '2026-11-10',
  billable: false, // NB
  // Ethan is currently allocated (al-ethan below), so the board card reads as
  // filled — a seat can't show "Assign" while someone holds a current slot.
  state: 'filled',
  startsLabel: '6/24',
  notesCount: 3,
  notes: [
    {
      author: 'Skylar Dorwart', date: '20.03.2026', isNew: true,
      body: 'Mostly looking for PM and so only looking to hire designer and eng if we can pair designer and eng with PM. Also open to Eng - but similar to PM requirement wants Eng to be local and can come into office 5 days a week...',
    },
    {
      author: 'Skylar Dorwart', date: '20.03.2026',
      body: 'Need for a part-time infrastructure consultant (20 hours) 1-2 month engagement for pre-launch hardening. Focus: Kubernetes review, load testing, observability setup',
    },
    {
      author: 'Skylar Dorwart', date: '20.03.2026',
      body: 'Mostly looking for PM and so only looking to hire designer and eng if we can pair designer and eng with PM. Also open to Eng - but similar to PM requirement wants Eng to be local and can come into office 5 days a week...',
    },
  ],
  allocations: [
    // ── Allocation Plan ──────────────────────────────────────────────────────
    // Current — active right now (holds today).
    {
      id: 'al-ethan',  personId: 'p-ethan', status: 'current', blockTone: 'primary',
      startDate: '2026-06-24', endDate: '2026-08-15', hoursPerWeek: 40,
      keepsAvailability: false,
    },
    // Upcoming — next in the plan, tentative.
    {
      id: 'al-names',  personId: 'p-names', status: 'upcoming', badge: 'TA',
      startDate: '2026-08-15', endDate: '2026-10-12', hoursPerWeek: 20,
      keepsAvailability: true,
    },
    // ── Proposed — awaiting a decision, each with its overlapping commitments ──
    {
      id: 'al-priya',  personId: 'p-priya', status: 'proposed',
      startDate: '2026-10-12', endDate: '2026-11-10', hoursPerWeek: 20,
      keepsAvailability: false,
      conflicts: [
        { project: 'Meridian HQ',   hoursPerWeek: 32, startDate: '2026-01-06', endDate: '2026-04-18', badge: 'TA' },
        { project: 'Cobalt Bridge', hoursPerWeek: 12, startDate: '2026-05-05', endDate: '2026-08-15' },
      ],
    },
    {
      id: 'al-maya',   personId: 'p-maya', status: 'proposed',
      startDate: '2026-10-12', endDate: '2026-11-10', hoursPerWeek: 20,
      keepsAvailability: false,
      conflicts: [
        { project: 'Nova Platform', hoursPerWeek: 16, startDate: '2026-02-03', endDate: '2026-05-09', badge: 'NB' },
        { project: 'Citrine Labs',  hoursPerWeek: 24, startDate: '2026-03-10', endDate: '2026-06-20', badge: 'PA' },
      ],
    },
    // ── Past — already ended ─────────────────────────────────────────────────
    {
      id: 'al-past-aisha', personId: 'p-aisha', status: 'past',
      startDate: '2025-11-15', endDate: '2025-12-15', hoursPerWeek: 20,
    },
    {
      id: 'al-past-marcus', personId: 'p-marcus', status: 'past',
      startDate: '2025-08-01', endDate: '2025-11-01', hoursPerWeek: 40,
    },
    {
      id: 'al-past-liam', personId: 'p-liam', status: 'past',
      startDate: '2025-05-01', endDate: '2025-07-30', hoursPerWeek: 20,
    },
  ],
}

// ── Modal "New Allocations" candidate list (mirrors the Figma frame) ─────────
// Each candidate shows their own existing schedule as timeline bars.

export interface CandidateBar {
  id: string
  startDate: string
  endDate: string
  hours?: number
  label?: string
  tone: 'assigned' | 'misalloc' | 'unassigned' | 'ooo' | 'flag' | 'available' | 'proposed'
  /** Trailing pills. PA only ever rides a `proposed` (purple) bar; TA rides a green pill. */
  badges?: { label: string; tone?: 'dark' | 'blue' | 'orange' | 'green' | 'neutral' | 'gray' }[]
}
export type TechScope = 'fullstack' | 'frontend' | 'backend'
export interface ModalCandidate {
  id: string
  name: string
  avatar: string
  role: string
  scope: TechScope
  /**
   * Weekly contract hours — 20 (part-time) or 40 (full-time). Free hours are
   * computed against this per request: confirmed Nh projects reduce them; TA
   * (tentative) projects, PA (proposed) allocations and OOO do NOT.
   *
   * A candidate row shows at most three badges (Figma 4397-30884), driven by
   * the requested hours in the modal filter: the green "• Nh" free-hours pill
   * when the person can cover the request, otherwise ONLY the red "Nw conflict"
   * pill; plus a gray "OOO" pill when the schedule has an `ooo` bar.
   */
  capacity: number
  bars: CandidateBar[]
}

export const MODAL_CANDIDATES: ModalCandidate[] = [
  {
    id: 'c-maya-r', name: 'Maya R.', avatar: av(7), role: 'Software Engineer', scope: 'fullstack',
    // Part-time 20h contract, no commitments.
    capacity: 20, bars: [],
  },
  {
    id: 'c-aisha-n', name: 'Aisha N.', avatar: av(9), role: 'Software Engineer', scope: 'frontend',
    // Confirmed 20h project + a tentative (TA) 20h project. Only the confirmed one
    // reduces availability, so 20h stays free.
    capacity: 40,
    bars: [
      { id: 'b1', startDate: '2026-08-01', endDate: '2026-09-15', hours: 20, label: 'Atlas Migration', tone: 'assigned' },
      { id: 'b2', startDate: '2026-08-20', endDate: '2026-10-05', hours: 20, label: 'Orion Billing', tone: 'assigned', badges: [{ label: 'TA', tone: 'green' }] },
    ],
  },
  {
    id: 'c-james-t', name: 'James T.', avatar: av(2), role: 'Software Engineer', scope: 'backend',
    capacity: 40,
    // PA → grey (proposed) bar, never orange.
    bars: [{ id: 'b1', startDate: '2026-09-01', endDate: '2026-10-15', hours: 20, label: 'Orion Billing', tone: 'proposed', badges: [{ label: 'PA', tone: 'gray' }] }],
  },
  {
    id: 'c-sofia-l', name: 'Sofia L.', avatar: av(1), role: 'Software Engineer', scope: 'fullstack',
    // Only a TA (tentative) project → fully available.
    capacity: 40,
    // TA lives on the project bar (alongside NB), not next to the name.
    bars: [{ id: 'b1', startDate: '2026-08-01', endDate: '2026-09-20', hours: 40, label: 'Beacon Redesign', tone: 'available', badges: [{ label: 'NB', tone: 'blue' }, { label: 'TA', tone: 'green' }] }],
  },
  {
    id: 'c-priya-k', name: 'Priya K.', avatar: av(0), role: 'Software Engineer', scope: 'frontend',
    // OOO across the seat's opening week (Jun 24–30) → shows the gray "OOO" tag by
    // the name, yet still fully available (OOO doesn't reduce hours).
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-06-24', endDate: '2026-06-30', tone: 'ooo' }],
  },
  {
    id: 'c-carlos-m', name: 'Carlos M.', avatar: av(24), role: 'Software Engineer', scope: 'backend',
    // OOO + a TA (tentative) project → neither reduces availability → fully free.
    capacity: 40,
    bars: [
      { id: 'b1', startDate: '2026-07-06', endDate: '2026-07-11', tone: 'ooo' },
      { id: 'b2', startDate: '2026-10-01', endDate: '2026-11-15', hours: 40, label: 'Nimbus Platform', tone: 'available', badges: [{ label: 'NB', tone: 'blue' }, { label: 'TA', tone: 'green' }] },
    ],
  },
  {
    id: 'c-noah-b', name: 'Noah B.', avatar: av(11), role: 'Software Engineer', scope: 'fullstack',
    // Rolling-off project covers only the first ~2 weeks of the range → free after.
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-06-01', endDate: '2026-06-26', label: 'Helios CRM', tone: 'available' }],
  },
  {
    id: 'c-elena-v', name: 'Elena V.', avatar: av(3), role: 'Software Engineer', scope: 'frontend',
    // Start day falls inside the range (flag bar); otherwise fully available.
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-07-04', endDate: '2026-07-04', label: 'Start Day at Fluxon · Jul 4 ‘25', tone: 'flag' }],
  },
  {
    id: 'c-ravi-p', name: 'Ravi P.', avatar: av(45), role: 'Software Engineer', scope: 'backend',
    capacity: 40,
    // A light confirmed 10h project → 30h free (white outline bar).
    bars: [{ id: 'b1', startDate: '2026-08-10', endDate: '2026-09-25', hours: 10, label: 'Meridian API', tone: 'available' }],
  },
  {
    id: 'c-tara-s', name: 'Tara S.', avatar: av(46), role: 'Software Engineer', scope: 'fullstack',
    // Proposed (PA) to another project doesn't reduce availability → fully free.
    capacity: 40,
    // Proposed (pending approval) to another project → muted grey bar + grey PA pill.
    bars: [{ id: 'b1', startDate: '2026-09-05', endDate: '2026-10-20', hours: 20, label: 'Quartz Analytics', tone: 'proposed', badges: [{ label: 'PA', tone: 'gray' }] }],
  },
  {
    id: 'c-omar-h', name: 'Omar H.', avatar: av(30), role: 'Software Engineer', scope: 'frontend',
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-06-10', endDate: '2026-08-05', hours: 20, label: 'Falcon Checkout', tone: 'available' }],
  },
  {
    id: 'c-lena-k', name: 'Lena K.', avatar: av(13), role: 'Software Engineer', scope: 'backend',
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-09-10', endDate: '2026-11-20', hours: 40, label: 'Solstice Data Lake', tone: 'proposed', badges: [{ label: 'PA', tone: 'gray' }] }],
  },
  {
    id: 'c-victor-s', name: 'Victor S.', avatar: av(35), role: 'Software Engineer', scope: 'fullstack',
    // Rolling-off project covers only the first ~2 weeks of the range → free after.
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-06-01', endDate: '2026-06-20', label: 'Vertex Mobile', tone: 'available' }],
  },
  {
    id: 'c-grace-l', name: 'Grace L.', avatar: av(16), role: 'Software Engineer', scope: 'frontend',
    // Part-time 20h contract, no commitments.
    capacity: 20, bars: [],
  },
  {
    id: 'c-david-m', name: 'David M.', avatar: av(40), role: 'Software Engineer', scope: 'backend',
    // Only a TA (tentative) project → fully available.
    capacity: 40,
    // TA lives on the project bar, not next to the name.
    bars: [{ id: 'b1', startDate: '2026-08-15', endDate: '2026-10-05', hours: 20, label: 'Pioneer Portal', tone: 'available', badges: [{ label: 'TA', tone: 'green' }] }],
  },
  {
    id: 'c-hana-t', name: 'Hana T.', avatar: av(17), role: 'Software Engineer', scope: 'fullstack',
    // OOO + a confirmed 20h project → 20h still free, fits the 20h request.
    capacity: 40,
    bars: [
      { id: 'b1', startDate: '2026-08-01', endDate: '2026-08-06', tone: 'ooo' },
      { id: 'b2', startDate: '2026-09-20', endDate: '2026-11-25', hours: 20, label: 'Cobalt Search', tone: 'available', badges: [{ label: 'NB', tone: 'blue' }] },
    ],
  },
  {
    id: 'c-diego-r', name: 'Diego R.', avatar: av(28), role: 'Software Engineer', scope: 'backend',
    // Only OOO in the range → still fully available.
    capacity: 40,
    // Extended time-off — a longer hatched OOO span (~5 weeks).
    bars: [{ id: 'b1', startDate: '2026-08-10', endDate: '2026-09-14', tone: 'ooo' }],
  },
  {
    id: 'c-peter-w', name: 'Peter W.', avatar: av(44), role: 'Software Engineer', scope: 'frontend',
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-06-24', endDate: '2026-11-10', hours: 40, label: 'Zephyr Payments', tone: 'proposed', badges: [{ label: 'PA', tone: 'gray' }] }],
  },
  {
    id: 'c-arlene-m', name: 'Arlene M.', avatar: av(20), role: 'Software Engineer', scope: 'fullstack',
    // Conflict state: a confirmed 30h project leaves only 10h free — below the
    // default 20h request → only the red "Nw conflict" badge (no hours pill).
    capacity: 40,
    bars: [{ id: 'b1', startDate: '2026-07-15', endDate: '2026-10-30', hours: 30, label: 'Datalog', tone: 'available' }],
  },
]

/** Candidate pool for the modal's "New Allocations" search list. */
export const DESIGN_SEAT_CANDIDATES: string[] = [
  'p-maya', 'p-marcus', 'p-sofia', 'p-liam', 'p-nina',
]

// ── Board projects ────────────────────────────────────────────────────────────
// A handful of realistic rows so the board reads like the Figma dashboard.
// The hero Design Seat lives on the first project's Product column.

// Spread each seat's window off the 1st so the modal timeline reads as real
// dates. Days are derived from the seat id (stable across renders, no jitter).
function seatDates(id: string): Pick<Seat, 'startDate' | 'endDate'> {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const pad = (n: number) => String(n).padStart(2, '0')
  const startDay = 2 + (h % 25)          // 02–26
  // Unsigned shift: `h >> 5` would go negative when h's high bit is set, and a
  // negative `% 26` yields a negative day → invalid ISO dates ("2026-11--13").
  const endDay = 2 + ((h >>> 5) % 26)    // 02–27
  return { startDate: `2026-06-${pad(startDay)}`, endDate: `2026-11-${pad(endDay)}` }
}

function filled(id: string, role: string, group: SeatRoleGroup, dept: Dept, personId: string, opts?: Partial<Seat>): Seat {
  const dates = seatDates(id)
  return {
    id, role, roleGroup: group, dept, hoursPerWeek: 40, weeks: 20,
    ...dates, billable: true,
    state: 'filled',
    allocations: [{ id: `${id}-a`, personId, status: 'current', ...dates, hoursPerWeek: 40 }],
    ...opts,
  }
}

function assign(id: string, role: string, group: SeatRoleGroup, dept: Dept, state: 'upcoming' | 'overdue' | 'open', opts?: Partial<Seat>): Seat {
  return {
    id, role, roleGroup: group, dept, hoursPerWeek: 20, weeks: 20,
    ...seatDates(id), billable: true,
    state, allocations: [],
    ...opts,
  }
}

// A seat whose next (and only) allocation is pending approval — no current
// holder. Reads as a purple, PA-badged "proposed" card; still an open opening
// until the proposal is approved (state left `open`; the card derives `proposed`
// from the allocation).
function proposed(id: string, role: string, group: SeatRoleGroup, dept: Dept, personId: string, opts?: Partial<Seat>): Seat {
  const dates = seatDates(id)
  return {
    id, role, roleGroup: group, dept, hoursPerWeek: 20, weeks: 20,
    ...dates, billable: true,
    state: 'open',
    allocations: [{ id: `${id}-a`, personId, status: 'proposed', ...dates, hoursPerWeek: 20 }],
    ...opts,
  }
}

export const DASH_PROJECTS: DashProject[] = [
  {
    id: 'pr-google-campus', client: 'Google', name: 'Google Campus Planning 2025',
    dates: "Aug 01 – Nov 02 '25", contractType: 'T&M', variant: 'default', notesCount: 2,
    seats: [
      DESIGN_SEAT,
      proposed('s-gc-p1b', 'TPM', 'TPM', 'Product and Design', 'p-priya', { startsLabel: '7/12' }),
      assign('s-gc-p2', 'TPM', 'TPM', 'Product and Design', 'overdue', { overdueDays: 7, hoursPerWeek: 20 }),
      assign('s-gc-p3', 'TPM', 'TPM', 'Product and Design', 'overdue', { overdueDays: 7, hoursPerWeek: 20 }),
      assign('s-gc-e1', 'Eng', 'Engineer', 'Engineering', 'overdue', { overdueDays: 7, hoursPerWeek: 20 }),
      assign('s-gc-e2', 'Eng', 'Engineer', 'Engineering', 'upcoming', { hoursPerWeek: 20, startsLabel: '7/12' }),
      filled('s-gc-e3', 'Eng', 'Engineer', 'Engineering', 'p-aisha', { startsLabel: '7/12' }),
    ],
  },
  {
    id: 'pr-google-campus-2', client: 'Google', name: 'Google Campus Planning 2025',
    dates: "Aug 01 – Nov 02 '25", contractType: 'T&M', variant: 'soon', notesCount: 2,
    seats: [
      assign('s-g2-p1', 'TPM', 'TPM', 'Product and Design', 'upcoming', { hoursPerWeek: 20 }),
      filled('s-g2-p2', 'TPM', 'TPM', 'Product and Design', 'p-marcus', { startsLabel: '7/12' }),
      filled('s-g2-e1', 'Eng', 'Engineer', 'Engineering', 'p-liam', { startsLabel: '7/12' }),
      filled('s-g2-e2', 'Eng', 'Engineer', 'Engineering', 'p-sofia', { startsLabel: '7/12' }),
      filled('s-g2-e3', 'Eng', 'Engineer', 'Engineering', 'p-nina', { startsLabel: '7/12' }),
    ],
  },
  {
    id: 'pr-google-campus-3', client: 'Google', name: 'Google Campus Planning 2025',
    dates: "Aug 01 – Nov 02 '25", variant: 'default', notesCount: 2,
    seats: [
      filled('s-g3-p1', 'Design', 'Designer', 'Product and Design', 'p-priya', { startsLabel: '7/12' }),
      filled('s-g3-e1', 'Eng', 'Engineer', 'Engineering', 'p-aisha', { startsLabel: '7/12' }),
      filled('s-g3-e2', 'Eng', 'Engineer', 'Engineering', 'p-marcus', { startsLabel: '7/12' }),
    ],
  },
  {
    id: 'pr-google-campus-4', client: 'Google', name: 'Google Campus Planning 2025',
    dates: "Aug 01 – Nov 02 '25", contractType: 'T&M', variant: 'default',
    seats: [
      filled('s-g4-p1', 'Design', 'Designer', 'Product and Design', 'p-maya', { startsLabel: '7/12' }),
      assign('s-g4-p2', 'TPM', 'TPM', 'Product and Design', 'upcoming', { hoursPerWeek: 20 }),
      assign('s-g4-e1', 'Eng', 'Engineer', 'Engineering', 'upcoming', { hoursPerWeek: 20 }),
    ],
  },
]

// ── Rollups for the sticky column headers ("| N Openings") ──────────────────

// ── Demo suggestion lists for the Project + Client search fields ─────────────
// Longer than the actual board rows so the dropdown has enough items to scroll.
// The real board entries lead each list so selecting them filters correctly.

export const DEMO_PROJECT_NAMES: string[] = [
  'Google Campus Planning 2025',
  'Nexus Platform v2',
  'Aurora Analytics',
  'Meridian Commerce',
  'Quantum Hub',
  'Stellar CRM',
  'Vertex AI Integration',
  'Eclipse Design System',
  'Orion Mobile',
  'Cascade Marketing',
  'Titan ERP Migration',
  'Nova Social Platform',
]

export const DEMO_CLIENTS: string[] = [
  'Google', 'Stripe', 'Amazon', 'Microsoft', 'Meta', 'Apple',
  'Netflix', 'Airbnb', 'Uber', 'Spotify', 'Shopify', 'Nvidia',
]

/** Abbreviated role label for the compact seat cards: Design → Des, etc. */
const SHORT_ROLE: Record<string, string> = {
  Design: 'Des',
  Designer: 'Des',
  Engineer: 'Eng',
  Engineering: 'Eng',
  Product: 'PM',
}
export function shortRole(role: string): string {
  return SHORT_ROLE[role] ?? role
}

export function openingsFor(projects: DashProject[], dept: Dept): number {
  return projects.reduce(
    (n, p) => n + p.seats.filter((s) => s.dept === dept && s.state !== 'filled').length,
    0,
  )
}

/** Openings that start soon — unfilled seats with a scheduled upcoming start. */
export function startingSoonFor(projects: DashProject[], dept: Dept): number {
  return projects.reduce(
    (n, p) => n + p.seats.filter((s) => s.dept === dept && s.state === 'upcoming').length,
    0,
  )
}
