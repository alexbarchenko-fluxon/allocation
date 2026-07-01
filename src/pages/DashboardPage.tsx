import { useState, useMemo } from 'react'
import {
  Search, ArrowDownAZ, ArrowUpAZ, X, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InputGroup } from '@/components/ui/input-group'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { AccountCard } from '@/components/dashboard/AccountCard'
import type { ContractType, AccountCardVariant } from '@/components/dashboard/AccountCard'
import { SeatCard } from '@/components/dashboard/SeatCard'
import type { SeatData } from '@/components/dashboard/SeatCard'
import { PERSON_MAP } from '@/mocks/people'

// ── Filter options ────────────────────────────────────────────────────────────

const SEAT_ROLE_OPTIONS = [
  { value: 'designer',        label: 'UX Designer'      },
  { value: 'eng_director',    label: 'Eng Director'     },
  { value: 'engineer',        label: 'Engineer'         },
  { value: 'product_manager', label: 'Product Manager'  },
  { value: 'program_manager', label: 'Program Manager'  },
  { value: 'qa',              label: 'Quality Assurance' },
  { value: 'tech_lead',       label: 'Tech Lead'        },
]

const SEAT_TYPE_OPTIONS = [
  { value: 'billable',     label: 'Billable'     },
  { value: 'non_billable', label: 'Non-billable' },
]

const SHOW_PROJECTS_OPTIONS = [
  { value: 'unallocated_seats',  label: 'Unallocated seats'  },
  { value: 'non_billable_seats', label: 'Non-billable seats' },
]

const CLIENT_OPTIONS = [
  { value: 'google',    label: 'Google'    },
  { value: 'stripe',    label: 'Stripe'    },
  { value: 'amazon',    label: 'Amazon'    },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'meta',      label: 'Meta'      },
  { value: 'apple',     label: 'Apple'     },
  { value: 'netflix',   label: 'Netflix'   },
]

// ── Seat helpers ──────────────────────────────────────────────────────────────

/** Shorthand for a filled seat. startDate only needed for future-scheduled seats. */
function s(personId: string, role: string, hoursPerWeek: number, startDate?: string, nonBillable?: boolean): SeatData {
  return { personId, role, hoursPerWeek, startDate, nonBillable }
}
/** Shorthand for an open / unassigned seat. startDate = when the role is needed from. */
function open(role: string, hoursPerWeek: number, startDate?: string): SeatData {
  return { personId: null, role, hoursPerWeek, startDate }
}

// ── Mock project row data ─────────────────────────────────────────────────────
// productSeats = Design + PM + TPM column (left)
// engSeats     = Engineering + QA column (right)
//
// People IDs reference src/mocks/people.ts:
//   Eng:  6-Madelyn  7-Charlie  8-Justin(PT)  9-Lucas  10-Olivia  11-Noah
//         12-Sofia   13-Ethan   14-Ava(PT)    15-Mason 16-Isabella 17-Logan(PT)
//         18-Mia     19-Liam(PT) 22-Charlotte 23-James
//   Design: 24-Ryan  25-Natalie  26-Daniel  27-Zoe  28-Kyle(PT)  29-Hailey
//           30-Aaron  31-Chloe
//   PM:   32-Ahmad  33-Kaiya  34-Brandon  35-Skylar  36-Morgan(PT)  37-Peyton
//         38-Taylor  39-Jordan
//   TPM:  40-Tatiana  41-Anika  42-Ashlynn  43-Casey  44-Riley(PT)  45-Drew
//   QA:   47-Makenna  48-Sam  49-Alex(PT)  50-Jordan

interface ProjectRow {
  id: string
  client: string
  name: string
  dates: string
  contractType: ContractType
  tagVariant: AccountCardVariant
  notesCount?: number
  productSeats: SeatData[]
  engSeats: SeatData[]
}

// Today = Mar 13 '26.  startDate is only set for seats that begin in the future.
// Seats already active (started before today) have no startDate — "Starts X/X" is hidden.
// A few seats on ongoing projects carry a future date to simulate expanded engagement.

const MOCK_ROWS: ProjectRow[] = [
  // ── r1 · Google REWS Discovery · starts Mar 16 (3 days away) · Product-only ──
  {
    id: 'r1', client: 'Google', name: 'Google REWS Discovery',
    dates: "Mar 16 '26 – Dec 31 '26", contractType: 'Fixed', tagVariant: 'default', notesCount: 3,
    productSeats: [
      s('person-24', 'UX', 40, '2026-03-16'),   // project hasn't started yet
      s('person-25', 'UX', 40, '2026-03-16'),
      s('person-26', 'UX', 40, '2026-03-16'),
    ],
    engSeats: [],
  },

  // ── r2 · Google Campus Planning 2026 · Jan 1 (running) · Mixed M ──────────
  {
    id: 'r2', client: 'Google', name: 'Google Campus Planning 2026',
    dates: "Jan 01 '26 – Jun 30 '26", contractType: 'Fixed', tagVariant: 'default', notesCount: 1,
    productSeats: [
      s('person-27', 'UX',  40),
      s('person-32', 'PM',  40),
      s('person-40', 'TPM', 40, undefined, true), // NB — internal coordination
      s('person-41', 'TPM', 40, '2026-04-01'),
    ],
    engSeats: [
      s('person-6',  'Eng', 40),
      s('person-9',  'Eng', 40),
    ],
  },

  // ── r3 · Google CICM II · Nov 17 (ending) · Large ─────────────────────────
  {
    id: 'r3', client: 'Google', name: 'Google CICM II',
    dates: "Nov 17 '25 – Mar 27 '26", contractType: 'Fixed', tagVariant: 'ending', notesCount: 4,
    productSeats: [
      s('person-29', 'UX',  40),
      s('person-31', 'UX',  40),
      s('person-33', 'PM',  40),
      s('person-42', 'TPM', 40, undefined, true), // NB
    ],
    engSeats: [
      s('person-7',  'Eng', 40),
      s('person-11', 'Eng', 40),
      s('person-12', 'Eng', 40),
      s('person-13', 'Eng', 40),
      open('Eng', 40),                            // open seats (no future date — needed now)
      open('Eng', 40),
    ],
  },

  // ── r4 · Stripe Nexus Platform v2 · Feb 1 (running) · Eng-heavy ───────────
  {
    id: 'r4', client: 'Stripe', name: 'Nexus Platform v2',
    dates: "Feb 01 '26 – Aug 31 '26", contractType: 'T&M', tagVariant: 'default',
    productSeats: [
      s('person-38', 'PM', 40),
    ],
    engSeats: [
      s('person-15', 'Eng', 40),
      s('person-16', 'Eng', 40, undefined, true), // NB — internal tooling work
      s('person-22', 'Eng', 40),
      s('person-20', 'Eng', 20, '2026-04-15'),
    ],
  },

  // ── r5 · Amazon Aurora Analytics · Starting Soon ──────────────────────────
  {
    id: 'r5', client: 'Amazon', name: 'Aurora Analytics',
    dates: "Jan 15 '26 – Jul 15 '26", contractType: 'Fixed', tagVariant: 'soon', notesCount: 2,
    productSeats: [
      s('person-28', 'UX', 20, '2026-04-15'),
      open('UX', 40, '2026-04-15'),
    ],
    engSeats: [
      s('person-17', 'Eng', 20, '2026-04-15'),
    ],
  },

  // ── r6 · Microsoft Meridian Commerce · Mar 1 (running) · Large Product ─────
  {
    id: 'r6', client: 'Microsoft', name: 'Meridian Commerce',
    dates: "Mar 01 '26 – Sep 01 '26", contractType: 'T&M', tagVariant: 'default', notesCount: 1,
    productSeats: [
      s('person-30', 'UX', 40),
      s('person-24', 'UX', 40),
      s('person-34', 'PM',     40),
      s('person-37', 'PM',     40, '2026-04-01'), // expansion
    ],
    engSeats: [
      s('person-21', 'Eng', 40),
      s('person-10', 'Eng', 40),
    ],
  },

  // ── r7 · Meta Quantum Hub · Dec 1 (running) · Eng-only ────────────────────
  {
    id: 'r7', client: 'Meta', name: 'Quantum Hub',
    dates: "Dec 01 '25 – Jun 30 '26", contractType: 'Fixed', tagVariant: 'default',
    productSeats: [],
    engSeats: [
      s('person-8',  'Eng', 20),
      s('person-14', 'Eng', 20),
      s('person-23', 'Eng', 40),
      open('Eng', 40, '2026-04-01'),              // open — needed from Apr 1
    ],
  },

  // ── r8 · Apple Stellar CRM · Starting Soon · Product-only ─────────────────
  {
    id: 'r8', client: 'Apple', name: 'Stellar CRM',
    dates: "Feb 15 '26 – Aug 15 '26", contractType: 'T&M', tagVariant: 'soon', notesCount: 2,
    productSeats: [
      s('person-25', 'UX', 40, '2026-05-01'),
      open('UX', 40, '2026-05-01'),
    ],
    engSeats: [],
  },

  // ── r9 · Netflix Vertex AI · Jan 1 (running) · Mixed M ────────────────────
  {
    id: 'r9', client: 'Netflix', name: 'Vertex AI Integration',
    dates: "Jan 01 '26 – Dec 31 '26", contractType: 'Fixed', tagVariant: 'default', notesCount: 3,
    productSeats: [
      s('person-29', 'UX',  40),
      s('person-36', 'PM',  20),
      s('person-43', 'TPM', 40, undefined, true), // NB
    ],
    engSeats: [
      s('person-18', 'Eng', 40),
      s('person-19', 'Eng', 20),
      s('person-47', 'QA',  40, undefined, true), // NB
      s('person-50', 'QA',  40, '2026-05-01'),
    ],
  },

  // ── r10 · Google Eclipse Design System · Starting Soon ────────────────────
  {
    id: 'r10', client: 'Google', name: 'Eclipse Design System',
    dates: "Mar 10 '26 – Sep 10 '26", contractType: 'T&M', tagVariant: 'soon', notesCount: 1,
    productSeats: [
      s('person-26', 'UX', 40, '2026-04-01'),
    ],
    engSeats: [
      s('person-16', 'Eng', 40, '2026-04-01'),
      open('Eng', 40, '2026-04-01'),
    ],
  },

  // ── r11 · Stripe Orion Mobile · Nov 1 (ending) · Large ────────────────────
  {
    id: 'r11', client: 'Stripe', name: 'Orion Mobile',
    dates: "Nov 01 '25 – May 01 '26", contractType: 'Fixed', tagVariant: 'ending', notesCount: 4,
    productSeats: [
      s('person-27', 'UX', 40),
      s('person-39', 'PM',     40),
    ],
    engSeats: [
      s('person-7',  'Eng', 40),
      s('person-11', 'Eng', 40),
      s('person-15', 'Eng', 40),
      s('person-48', 'QA',  40, undefined, true), // NB
      open('Eng', 40),
    ],
  },

  // ── r12 · Amazon Cascade Marketing · Apr 1 (future project) ───────────────
  {
    id: 'r12', client: 'Amazon', name: 'Cascade Marketing',
    dates: "Apr 01 '26 – Oct 01 '26", contractType: 'T&M', tagVariant: 'default',
    productSeats: [
      s('person-32', 'PM', 40, '2026-04-01'),
    ],
    engSeats: [
      s('person-17', 'Eng', 20, '2026-04-01'),
    ],
  },

  // ── r13 · Microsoft Titan ERP Migration · Feb 1 (running) · Mixed M ────────
  {
    id: 'r13', client: 'Microsoft', name: 'Titan ERP Migration',
    dates: "Feb 01 '26 – Nov 30 '26", contractType: 'Fixed', tagVariant: 'default',
    productSeats: [
      s('person-24', 'UX',  40),
      s('person-35', 'PM',  40),
      s('person-45', 'TPM', 40, undefined, true), // NB
    ],
    engSeats: [
      s('person-8',  'Eng', 20),
      s('person-10', 'Eng', 40),
      s('person-23', 'Eng', 40, '2026-05-01'),    // expansion
    ],
  },

  // ── r14 · Meta Nova Social Platform · Jan 20 (running) ────────────────────
  {
    id: 'r14', client: 'Meta', name: 'Nova Social Platform',
    dates: "Jan 20 '26 – Jul 20 '26", contractType: 'T&M', tagVariant: 'default',
    productSeats: [
      s('person-31', 'UX', 40),
      s('person-34', 'PM',     40),
    ],
    engSeats: [
      s('person-12', 'Eng', 40),
    ],
  },

  // ── r15 · Apple Zenith Cloud Ops · Mar 1 (running) · Eng-heavy ────────────
  {
    id: 'r15', client: 'Apple', name: 'Zenith Cloud Ops',
    dates: "Mar 01 '26 – Sep 30 '26", contractType: 'Fixed', tagVariant: 'default',
    productSeats: [
      s('person-32', 'PM', 40),
    ],
    engSeats: [
      s('person-6',  'Eng', 40, undefined, true), // NB — infrastructure work
      s('person-9',  'Eng', 40),
      open('Eng', 40, '2026-04-01'),
    ],
  },
]

// Maps filter option values → seat role labels used in the data
const ROLE_FILTER_TO_LABEL: Record<string, string> = {
  designer:        'UX',
  engineer:        'Eng',
  product_manager: 'PM',
  program_manager: 'TPM',
  qa:              'QA',
  eng_director:    'Eng Director',
  tech_lead:       'Tech Lead',
}

// ── Dashboard Seat Side Panel ─────────────────────────────────────────────────

const PANEL_EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)'
const PANEL_DURATION = '0.35s'

function DashboardSeatSidePanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <div
      className="overflow-hidden flex-shrink-0 h-full"
      style={{
        width:      isOpen ? 420 : 0,
        marginLeft: isOpen ? 0 : -10,
        transition: `width ${PANEL_DURATION} ${PANEL_EASING}, margin-left ${PANEL_DURATION} ${PANEL_EASING}`,
      }}
    >
      <div className="w-[420px] h-full">
        <div className="w-[420px] h-full bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="flex-shrink-0 relative flex items-center gap-[10px] h-[52px] px-5 border-b border-border">
            <span className="text-base font-semibold text-foreground leading-none">
              Seat details
            </span>
            <Button
              variant="ghost"
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-70"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [search,        setSearch]        = useState('')
  const [seatRole,      setSeatRole]      = useState<string[]>([])
  const [seatType,      setSeatType]      = useState<string[]>([])
  const [showProjects,  setShowProjects]  = useState<string[]>([])
  const [client,        setClient]        = useState<string[]>([])
  const [sortDir,       setSortDir]       = useState<'asc' | 'desc'>('asc')
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  const hasActiveFilters =
    search.trim().length > 0 || seatRole.length > 0 || seatType.length > 0 ||
    showProjects.length > 0  || client.length > 0

  const filteredRows = useMemo(() => {
    let rows = [...MOCK_ROWS]

    // Search — project name or client (case-insensitive)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(q) || r.client.toLowerCase().includes(q),
      )
    }

    // Client
    if (client.length > 0) {
      rows = rows.filter((r) => client.includes(r.client.toLowerCase()))
    }

    // Seat role — row must contain at least one seat whose role matches any selected value
    if (seatRole.length > 0) {
      const labels = seatRole.map((v) => ROLE_FILTER_TO_LABEL[v]).filter(Boolean)
      rows = rows.filter((r) =>
        [...r.productSeats, ...r.engSeats].some((seat) => labels.includes(seat.role)),
      )
    }

    // Seat type — billable / non-billable (OR within, AND with rest)
    if (seatType.length > 0) {
      rows = rows.filter((r) => {
        const all = [...r.productSeats, ...r.engSeats]
        return seatType.some((t) =>
          t === 'non_billable' ? all.some((seat) => seat.nonBillable)
                               : all.some((seat) => !seat.nonBillable),
        )
      })
    }

    // Show projects with
    if (showProjects.length > 0) {
      rows = rows.filter((r) => {
        const all = [...r.productSeats, ...r.engSeats]
        return showProjects.some((p) =>
          p === 'unallocated_seats'  ? all.some((seat) => seat.personId === null)
        : p === 'non_billable_seats' ? all.some((seat) => seat.nonBillable)
        : false,
        )
      })
    }

    // Sort by project name
    rows.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [search, client, seatRole, seatType, showProjects, sortDir])

  const totalProductSeats = filteredRows.reduce((n, r) => n + r.productSeats.length, 0)
  const totalEngSeats     = filteredRows.reduce((n, r) => n + r.engSeats.length, 0)

  return (
    <div className="h-full p-[10px] pt-[60px] flex gap-[10px] overflow-x-auto">
      <div className="bg-background border border-border rounded-lg shadow-sm flex-1 h-full flex flex-col min-w-0 overflow-hidden">

        {/* ── Page title ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center px-5 pt-5 pb-4 border-b border-border">
          <h1 className="text-base font-semibold leading-none text-foreground">Dashboard</h1>
        </div>

        {/* ── Search + Filters ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex h-14 border-b border-border">
          <div className="w-[320px] flex-shrink-0 border-r border-border flex items-center px-3">
            <InputGroup
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              wrapperClassName="h-9"
              rightElement={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex-1 flex items-center px-3 gap-2 min-w-0">
            <FilterMultiSelect label="Seat Role"          options={SEAT_ROLE_OPTIONS}     value={seatRole}     onChange={setSeatRole}     />
            <FilterMultiSelect label="Seat type"          options={SEAT_TYPE_OPTIONS}     value={seatType}     onChange={setSeatType}     />
            <FilterMultiSelect label="Show projects with" options={SHOW_PROJECTS_OPTIONS} value={showProjects} onChange={setShowProjects} />
            <FilterMultiSelect label="Client"             options={CLIENT_OPTIONS}        value={client}       onChange={setClient}       />
            {hasActiveFilters && (
              <button
                type="button"
                className="ml-1 text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                onClick={() => { setSearch(''); setSeatRole([]); setSeatType([]); setShowProjects([]); setClient([]) }}
              >
                Reset all
              </button>
            )}
          </div>
        </div>

        {/*
         * ── Scrollable body ───────────────────────────────────────────────────
         * The column-labels row lives INSIDE this container as a sticky header.
         */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-minimal">

          {/* ── Sticky column-labels row ──────────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex h-10 border-b border-border bg-background">
            <div className="w-[320px] flex-shrink-0 border-r border-border flex items-center justify-between px-2">
              <Badge
                variant="secondary"
                className="gap-1 px-2 py-0.5 rounded-full border-transparent text-xs font-medium text-muted-foreground"
              >
                <Building2 className="h-3 w-3" />
                {filteredRows.length}
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
            <div className="flex flex-1 min-w-0">
              <div className="flex-1 border-r border-border flex items-center px-4 gap-2">
                <span className="text-xs font-semibold text-foreground leading-4">Product and Design</span>
                <span className="text-xs text-muted-foreground">| {totalProductSeats} Seats</span>
              </div>
              <div className="flex-1 flex items-center px-4 gap-2">
                <span className="text-xs font-semibold text-foreground leading-4">Engineering</span>
                <span className="text-xs text-muted-foreground">| {totalEngSeats} Seats</span>
              </div>
            </div>
          </div>

          {/* ── Project rows ─────────────────────────────────────────────────── */}
          {filteredRows.map((row) => (
            <div key={row.id} className="flex border-b border-border">

              {/* Left: account card */}
              <div className="w-[320px] flex-shrink-0 border-r border-border">
                <AccountCard
                  client={row.client}
                  name={row.name}
                  dates={row.dates}
                  contractType={row.contractType}
                  variant={row.tagVariant}
                  notesCount={row.notesCount}
                />
              </div>

              {/* Right: two seat columns */}
              <div className="flex flex-1 min-w-0 bg-sidebar">

                {/* Product and Design */}
                <div className="flex-1 border-r border-border p-3 grid grid-cols-2 xl:grid-cols-3 gap-2 content-start min-h-[60px]">
                  {row.productSeats.map((seat, i) => (
                    <SeatCard
                      key={i}
                      person={seat.personId ? (PERSON_MAP.get(seat.personId) ?? null) : null}
                      role={seat.role}
                      hoursPerWeek={seat.hoursPerWeek}
                      startDate={seat.startDate}
                      nonBillable={seat.nonBillable}
                      onClick={() => setSidePanelOpen(true)}
                    />
                  ))}
                </div>

                {/* Engineering */}
                <div className="flex-1 p-3 grid grid-cols-2 xl:grid-cols-3 gap-2 content-start min-h-[60px]">
                  {row.engSeats.map((seat, i) => (
                    <SeatCard
                      key={i}
                      person={seat.personId ? (PERSON_MAP.get(seat.personId) ?? null) : null}
                      role={seat.role}
                      hoursPerWeek={seat.hoursPerWeek}
                      startDate={seat.startDate}
                      nonBillable={seat.nonBillable}
                      onClick={() => setSidePanelOpen(true)}
                    />
                  ))}
                </div>

              </div>
            </div>
          ))}

        </div>
      </div>

      <DashboardSeatSidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
      />
    </div>
  )
}
