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

/** Visual state of a seat card on the board. */
export type SeatState = 'filled' | 'upcoming' | 'overdue' | 'open'

/** Where an allocation sits relative to the seat lifecycle. */
export type AllocStatus = 'current' | 'upcoming' | 'proposed'

/** Small trailing badge on avatars / allocation blocks. */
export type PersonBadge = 'TA' | 'NB' | 'PA'

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
  contractType: 'T&M' | 'Fixed'
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
  state: 'upcoming',
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
    // Current Allocation lane — exactly three bars: blue / grey / orange.
    {
      id: 'al-ethan',  personId: 'p-ethan', status: 'current', blockTone: 'primary',
      startDate: '2026-06-24', endDate: '2026-08-15', hoursPerWeek: 40,
    },
    {
      id: 'al-names',  personId: 'p-names', status: 'current', blockTone: 'neutral', badge: 'PA',
      startDate: '2026-08-15', endDate: '2026-10-12', hoursPerWeek: 20,
    },
    {
      id: 'al-priya',  personId: 'p-priya', status: 'proposed', blockTone: 'misalloc', badge: 'PA',
      startDate: '2026-10-12', endDate: '2026-11-10', hoursPerWeek: 20,
      keepsAvailability: false,
    },
    // Sidebar-only (not in the current lane).
    {
      id: 'al-aisha',  personId: 'p-aisha', status: 'upcoming',
      startDate: '2026-11-15', endDate: '2026-12-15', hoursPerWeek: 20,
      keepsAvailability: true,
    },
  ],
}

// ── Modal "New Allocations" candidate list (mirrors the Figma frame) ─────────
// Each candidate shows their own existing schedule as timeline bars.

export type CandidateTagTone = 'success' | 'dark' | 'orange' | 'neutral' | 'blue' | 'gray'
export interface CandidateTag { label: string; tone: CandidateTagTone }
export interface CandidateBar {
  id: string
  startDate: string
  endDate: string
  hours?: number
  label?: string
  tone: 'assigned' | 'misalloc' | 'unassigned' | 'ooo' | 'flag' | 'available' | 'proposed'
  badge?: string
  badgeTone?: 'dark' | 'blue' | 'orange' | 'neutral' | 'gray'
}
export type TechScope = 'fullstack' | 'frontend' | 'backend'
export interface ModalCandidate {
  id: string
  name: string
  avatar: string
  role: string
  scope: TechScope
  hoursLabel: string
  tags: CandidateTag[]
  bars: CandidateBar[]
}

export const MODAL_CANDIDATES: ModalCandidate[] = [
  {
    id: 'c-maya-r', name: 'Maya R.', avatar: av(7), role: 'Software Engineer', scope: 'fullstack',
    hoursLabel: '20/20h', tags: [], bars: [],
  },
  {
    id: 'c-aisha-n', name: 'Aisha N.', avatar: av(9), role: 'Software Engineer', scope: 'frontend',
    hoursLabel: '20/40h', tags: [],
    bars: [{ id: 'b1', startDate: '2026-08-01', endDate: '2026-09-15', hours: 20, label: 'Project Name', tone: 'misalloc' }],
  },
  {
    id: 'c-james-t', name: 'James T.', avatar: av(2), role: 'Software Engineer', scope: 'backend',
    hoursLabel: '40/40h', tags: [{ label: 'PA', tone: 'gray' }],
    bars: [{ id: 'b1', startDate: '2026-09-01', endDate: '2026-10-15', hours: 20, label: 'Project Name', tone: 'misalloc', badge: 'PA', badgeTone: 'gray' }],
  },
  {
    id: 'c-sofia-l', name: 'Sofia L.', avatar: av(1), role: 'Software Engineer', scope: 'fullstack',
    hoursLabel: '20/40h', tags: [{ label: 'TA', tone: 'orange' }],
    bars: [{ id: 'b1', startDate: '2026-08-01', endDate: '2026-09-20', hours: 40, label: 'Project Name', tone: 'misalloc', badge: 'NB', badgeTone: 'blue' }],
  },
  {
    id: 'c-priya-k', name: 'Priya K.', avatar: av(0), role: 'Software Engineer', scope: 'frontend',
    hoursLabel: '20/40h', tags: [{ label: 'OOO', tone: 'orange' }],
    bars: [{ id: 'b1', startDate: '2026-07-06', endDate: '2026-07-11', tone: 'ooo' }],
  },
  {
    id: 'c-carlos-m', name: 'Carlos M.', avatar: av(24), role: 'Software Engineer', scope: 'backend',
    hoursLabel: '20/40h', tags: [{ label: 'TA', tone: 'orange' }, { label: 'OOO', tone: 'orange' }],
    bars: [
      { id: 'b1', startDate: '2026-07-06', endDate: '2026-07-11', tone: 'ooo' },
      { id: 'b2', startDate: '2026-10-01', endDate: '2026-11-15', hours: 40, label: 'Project Name', tone: 'misalloc', badge: 'NB', badgeTone: 'blue' },
    ],
  },
  {
    id: 'c-noah-b', name: 'Noah B.', avatar: av(11), role: 'Software Engineer', scope: 'fullstack',
    hoursLabel: '20/40h', tags: [{ label: 'Available in 2w', tone: 'success' }],
    bars: [{ id: 'b1', startDate: '2026-06-01', endDate: '2026-06-26', label: 'Project Name', tone: 'unassigned' }],
  },
  {
    id: 'c-elena-v', name: 'Elena V.', avatar: av(3), role: 'Software Engineer', scope: 'frontend',
    hoursLabel: '20/40h', tags: [{ label: 'New Joiner', tone: 'neutral' }],
    bars: [{ id: 'b1', startDate: '2026-07-04', endDate: '2026-07-04', label: 'Start Day at Fluxon · Jul 4 ‘25', tone: 'flag' }],
  },
  {
    id: 'c-ravi-p', name: 'Ravi P.', avatar: av(45), role: 'Software Engineer', scope: 'backend',
    hoursLabel: '20/40h', tags: [],
    // Has another project but is available for this allocation → white outline bar.
    bars: [{ id: 'b1', startDate: '2026-08-10', endDate: '2026-09-25', hours: 20, label: 'Project Name', tone: 'available' }],
  },
  {
    id: 'c-tara-s', name: 'Tara S.', avatar: av(46), role: 'Software Engineer', scope: 'fullstack',
    hoursLabel: '20/40h', tags: [{ label: 'PA', tone: 'gray' }],
    // Proposed (pending approval) to another project → muted grey bar + grey PA pill.
    bars: [{ id: 'b1', startDate: '2026-09-05', endDate: '2026-10-20', hours: 20, label: 'Project Name', tone: 'proposed', badge: 'PA', badgeTone: 'gray' }],
  },
  {
    id: 'c-omar-h', name: 'Omar H.', avatar: av(30), role: 'Software Engineer', scope: 'frontend',
    hoursLabel: '20/40h', tags: [],
    bars: [{ id: 'b1', startDate: '2026-06-10', endDate: '2026-08-05', hours: 20, label: 'Project Name', tone: 'misalloc' }],
  },
  {
    id: 'c-lena-k', name: 'Lena K.', avatar: av(13), role: 'Software Engineer', scope: 'backend',
    hoursLabel: '40/40h', tags: [{ label: 'PA', tone: 'gray' }],
    bars: [{ id: 'b1', startDate: '2026-09-10', endDate: '2026-11-20', hours: 40, label: 'Project Name', tone: 'misalloc', badge: 'PA', badgeTone: 'gray' }],
  },
  {
    id: 'c-victor-s', name: 'Victor S.', avatar: av(35), role: 'Software Engineer', scope: 'fullstack',
    hoursLabel: '20/40h', tags: [{ label: 'Available in 2w', tone: 'success' }],
    bars: [{ id: 'b1', startDate: '2026-06-01', endDate: '2026-06-20', label: 'Project Name', tone: 'unassigned' }],
  },
  {
    id: 'c-grace-l', name: 'Grace L.', avatar: av(16), role: 'Software Engineer', scope: 'frontend',
    hoursLabel: '20/20h', tags: [], bars: [],
  },
  {
    id: 'c-david-m', name: 'David M.', avatar: av(40), role: 'Software Engineer', scope: 'backend',
    hoursLabel: '20/40h', tags: [{ label: 'TA', tone: 'orange' }],
    bars: [{ id: 'b1', startDate: '2026-08-15', endDate: '2026-10-05', hours: 20, label: 'Project Name', tone: 'misalloc' }],
  },
  {
    id: 'c-hana-t', name: 'Hana T.', avatar: av(17), role: 'Software Engineer', scope: 'fullstack',
    hoursLabel: '20/40h', tags: [{ label: 'OOO', tone: 'orange' }],
    bars: [
      { id: 'b1', startDate: '2026-08-01', endDate: '2026-08-06', tone: 'ooo' },
      { id: 'b2', startDate: '2026-09-20', endDate: '2026-11-25', hours: 40, label: 'Project Name', tone: 'misalloc', badge: 'NB', badgeTone: 'blue' },
    ],
  },
  {
    id: 'c-peter-w', name: 'Peter W.', avatar: av(44), role: 'Software Engineer', scope: 'frontend',
    hoursLabel: '40/40h', tags: [{ label: 'PA', tone: 'gray' }],
    bars: [{ id: 'b1', startDate: '2026-06-24', endDate: '2026-11-10', hours: 40, label: 'Project Name', tone: 'misalloc', badge: 'PA', badgeTone: 'gray' }],
  },
]

// Maps each prototype candidate to a real `MOCK_PEOPLE` id so the profile
// side panel can resolve manager / direct reports / allocations. All engineers
// (person-6…person-23). Prototype-only; names in the panel are the real person's.
export const CANDIDATE_PERSON_MAP: Record<string, string> = {
  'c-maya-r':   'person-6',
  'c-aisha-n':  'person-7',
  'c-james-t':  'person-23',
  'c-sofia-l':  'person-12',
  'c-priya-k':  'person-10',
  'c-carlos-m': 'person-9',
  'c-noah-b':   'person-11',
  'c-elena-v':  'person-14',
  'c-ravi-p':   'person-15',
  'c-tara-s':   'person-16',
  'c-omar-h':   'person-18',
  'c-lena-k':   'person-19',
  'c-victor-s': 'person-20',
  'c-grace-l':  'person-22',
  'c-david-m':  'person-13',
  'c-hana-t':   'person-17',
  'c-peter-w':  'person-21',
}

/** Candidate pool for the modal's "New Allocations" search list. */
export const DESIGN_SEAT_CANDIDATES: string[] = [
  'p-maya', 'p-marcus', 'p-sofia', 'p-liam', 'p-nina',
]

// ── Board projects ────────────────────────────────────────────────────────────
// A handful of realistic rows so the board reads like the Figma dashboard.
// The hero Design Seat lives on the first project's Product column.

function filled(id: string, role: string, group: SeatRoleGroup, dept: Dept, personId: string, opts?: Partial<Seat>): Seat {
  return {
    id, role, roleGroup: group, dept, hoursPerWeek: 40, weeks: 20,
    startDate: '2026-06-01', endDate: '2026-11-01', billable: true,
    state: 'filled',
    allocations: [{ id: `${id}-a`, personId, status: 'current', startDate: '2026-06-01', endDate: '2026-11-01', hoursPerWeek: 40 }],
    ...opts,
  }
}

function assign(id: string, role: string, group: SeatRoleGroup, dept: Dept, state: 'upcoming' | 'overdue' | 'open', opts?: Partial<Seat>): Seat {
  return {
    id, role, roleGroup: group, dept, hoursPerWeek: 20, weeks: 20,
    startDate: '2026-06-01', endDate: '2026-11-01', billable: true,
    state, allocations: [],
    ...opts,
  }
}

export const DASH_PROJECTS: DashProject[] = [
  {
    id: 'pr-google-campus', client: 'Google', name: 'Google Campus Planning 2025',
    dates: "Aug 01 – Nov 02 '25", contractType: 'T&M', variant: 'default', notesCount: 2,
    seats: [
      DESIGN_SEAT,
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
    dates: "Aug 01 – Nov 02 '25", contractType: 'Fixed', variant: 'default', notesCount: 2,
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
