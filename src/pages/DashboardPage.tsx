import { useState, useMemo, useCallback } from 'react'
import { Search, Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup } from '@/components/ui/input-group'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { AccountCard } from '@/components/dashboard/AccountCard'
import { SeatCard } from '@/components/dashboard/SeatCard'
import { SeatDetailsPanel } from '@/pages/dashboard/SeatDetailsPanel'
import { AllocationModal } from '@/pages/dashboard/AllocationModal'
import {
  DASH_PROJECTS, DASH_PERSON_MAP, openingsFor, startingSoonFor, shortRole,
  DEMO_PROJECT_NAMES, DEMO_CLIENTS,
  type Seat, type SeatState, type DashProject, type SeatAllocation, type Dept,
} from '@/pages/dashboard/data'
import { cn } from '@/lib/utils'

// ── Filter options ─────────────────────────────────────────────────────────────

const SEAT_ROLE_OPTIONS = [
  { value: 'Designer', label: 'Designer' },
  { value: 'Engineer', label: 'Engineer' },
  { value: 'TPM',      label: 'TPM' },
]
const SEAT_TYPE_OPTIONS = [
  { value: 'billable',     label: 'Billable' },
  { value: 'non_billable', label: 'Non-billable' },
]
const ALLOCATION_OPTIONS = [
  { value: 'overdue',  label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'proposed', label: 'Proposed' },
]
const CLIENT_OPTIONS = DEMO_CLIENTS.map((c) => ({ value: c, label: c }))

const DEPTS: Dept[] = ['Product and Design', 'Engineering']

// ── Seat display helpers ─────────────────────────────────────────────────────

/**
 * The state a seat card actually renders as, after resolving its allocations.
 * A current holder always wins (→ `filled`); with no current holder, a
 * pending-approval candidate reads as `proposed` (purple, PA badge). Otherwise
 * the seat falls back to its stored state (upcoming / overdue / open).
 * Single source of truth for both {@link seatDisplay} and the board filter.
 */
function seatDisplayState(seat: Seat): SeatState {
  const current = seat.allocations.some((a) => a.status === 'current')
  const proposed = !current && seat.allocations.some((a) => a.status === 'proposed')
  return current ? 'filled' : proposed ? 'proposed' : seat.state
}

/** Resolve the person + badges + labels a seat card should render. */
function seatDisplay(seat: Seat) {
  const current = seat.allocations.find((a) => a.status === 'current')
  // With no current holder, a pending-approval candidate makes the seat read as
  // "proposed" (purple, PA badge). A current allocation always wins — a filled
  // seat can't simultaneously be an "Assign" card or a proposed card.
  const proposed = !current ? seat.allocations.find((a) => a.status === 'proposed') : undefined
  const active = current ?? proposed
  const person = active ? DASH_PERSON_MAP.get(active.personId) ?? null : null
  const state = seatDisplayState(seat)
  const badges = active
    ? [
        ...(state === 'proposed' ? (['PA'] as const) : []),
        ...(current?.badge ? [current.badge] : []),
        ...(!seat.billable ? (['NB'] as const) : []),
      ]
    : (!seat.billable ? (['NB'] as const) : [])
  // Filled + proposed show "allocated/total" hours; empty seats show the ask.
  const hoursLabel = active
    ? `${active.hoursPerWeek}/${seat.hoursPerWeek}h`
    : `${seat.hoursPerWeek}h`
  const metaLabel = state === 'overdue'
    ? `Overdue ${seat.overdueDays ?? 0}d`
    : seat.startsLabel
      ? `Starts ${seat.startsLabel}`
      : undefined
  return { state, person, badges: [...badges] as SeatAllocation['badge'][], hoursLabel, metaLabel }
}

// ── Project search field ───────────────────────────────────────────────────────

/**
 * Project search bar. On focus it surfaces up to 6 project suggestions
 * (filtered live by the typed text); clients have their own filter dropdown.
 */
function SearchField({
  value, onChange, onSelect, options,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (name: string) => void
  options: string[]
}) {
  const [open, setOpen] = useState(false)
  const q = value.trim().toLowerCase()
  const projects = (q ? options.filter((n) => n.toLowerCase().includes(q)) : options).slice(0, 6)

  return (
    <div className="relative w-[272px]">
      <InputGroup
        placeholder="Search"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        wrapperClassName="h-9"
        leftElement={<Search className="h-4 w-4" />}
      />
      {open && projects.length > 0 && (
        <div className="scrollbar-minimal absolute left-0 top-[calc(100%+4px)] z-20 max-h-[264px] w-full min-w-[224px] overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {projects.map((n) => (
            <div
              key={n}
              className="cursor-pointer truncate rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
              onMouseDown={() => { onSelect(n); setOpen(false) }}
            >
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [client, setClient] = useState<string[]>([])
  const [seatRole, setSeatRole] = useState<string[]>([])
  const [seatType, setSeatType] = useState<string[]>([])
  const [allocation, setAllocation] = useState<string[]>([])
  // "Show all projects seats" — reveals every seat on matching projects instead
  // of only the seats matching the active seat filters.
  const [showAllSeats, setShowAllSeats] = useState(false)

  // ── Flow state ─────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<{ projectId: string; seatId: string } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  // Working copy of a seat's allocations, keyed by seat id (mutated by the flow).
  const [allocOverride, setAllocOverride] = useState<Record<string, SeatAllocation[]>>({})
  // Seats removed via the sidebar's Delete Seat confirmation.
  const [deletedSeats, setDeletedSeats] = useState<Set<string>>(new Set())

  const allocsFor = useCallback(
    (seat: Seat) => allocOverride[seat.id] ?? seat.allocations,
    [allocOverride],
  )

  const seatFilterActive = seatRole.length > 0 || seatType.length > 0 || allocation.length > 0
  const hasAnyFilter = !!search.trim() || client.length > 0 || seatFilterActive
  // "Show all" only has meaning while a seat filter narrows the rows.
  const showAll = showAllSeats && seatFilterActive

  const seatMatches = useCallback(
    (seat: Seat): boolean => {
      if (seatRole.length && !seatRole.includes(seat.roleGroup)) return false
      if (seatType.length && !seatType.some((t) => (t === 'billable' ? seat.billable : !seat.billable))) return false
      // Match on the seat's *rendered* state, not on the raw allocations: a seat
      // that merely contains a proposed allocation but shows a current holder
      // renders as "filled", so it must not surface under the Proposed filter.
      if (allocation.length && !allocation.includes(seatDisplayState({ ...seat, allocations: allocsFor(seat) }))) return false
      return true
    },
    [seatRole, seatType, allocation, allocsFor],
  )

  const rows = useMemo(() => {
    let projects = [...DASH_PROJECTS]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      projects = projects.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (client.length) {
      projects = projects.filter((p) => client.includes(p.client))
    }

    const result = projects
      .map((p) => {
        const live = p.seats.filter((s) => !deletedSeats.has(s.id))
        const matching = live.filter(seatMatches)
        // With a seat filter active, show only matching seats — unless the user
        // toggled "show all projects seats", which reveals every seat.
        const seats = seatFilterActive && !showAll ? matching : live
        return { project: p, seats, matchCount: matching.length }
      })
      .filter((r) => (seatFilterActive ? r.matchCount > 0 : true))

    result.sort((a, b) => a.project.name.localeCompare(b.project.name))
    return result
  }, [search, client, seatMatches, seatFilterActive, showAll, deletedSeats])

  const visibleProjects = rows.map((r) => r.project)
  const seatsByDept = (seats: Seat[], dept: Dept) => seats.filter((s) => s.dept === dept)

  const reset = () => {
    setSearch(''); setClient([])
    setSeatRole([]); setSeatType([]); setAllocation([])
    setShowAllSeats(false)
  }

  // ── Selection + flow ─────────────────────────────────────────────────────────
  const selectedProject = selected ? DASH_PROJECTS.find((p) => p.id === selected.projectId) ?? null : null
  const selectedSeat = selectedProject && selected ? selectedProject.seats.find((s) => s.id === selected.seatId) ?? null : null
  const selectedAllocs = selectedSeat ? allocsFor(selectedSeat) : []

  const openSeat = (project: DashProject, seat: Seat) => setSelected({ projectId: project.id, seatId: seat.id })
  const closePanel = () => { setSelected(null); setModalOpen(false) }

  const setAllocs = useCallback((seatId: string, updater: (a: SeatAllocation[]) => SeatAllocation[]) => {
    setAllocOverride((prev) => {
      const seat = DASH_PROJECTS.flatMap((p) => p.seats).find((s) => s.id === seatId)
      const base = prev[seatId] ?? seat?.allocations ?? []
      return { ...prev, [seatId]: updater(base) }
    })
  }, [])

  return (
    <div className="flex h-full gap-[10px] overflow-x-auto p-[10px] pt-[60px]">
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">

        {/* Title + filters — one clean header, no internal stroke lines */}
        <div className="flex-shrink-0 px-5 pb-3 pt-5">
          <h1 className="mb-4 text-base font-semibold leading-none text-foreground">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2">
            <SearchField
              value={search}
              onChange={setSearch}
              onSelect={setSearch}
              options={DEMO_PROJECT_NAMES}
            />
            <FilterMultiSelect label="Client" options={CLIENT_OPTIONS} value={client} onChange={setClient} />
            <FilterMultiSelect label="Seat Role" options={SEAT_ROLE_OPTIONS} value={seatRole} onChange={setSeatRole} />
            <FilterMultiSelect label="Seat Type" options={SEAT_TYPE_OPTIONS} value={seatType} onChange={setSeatType} />
            <FilterMultiSelect label="Allocation Status" options={ALLOCATION_OPTIONS} value={allocation} onChange={setAllocation} />
            {hasAnyFilter && (
              <button
                type="button"
                className="ml-1 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-primary/80"
                onClick={reset}
              >
                Reset all
              </button>
            )}
            {/* "All projects seats" — only while a seat filter narrows rows */}
            {seatFilterActive && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      aria-pressed={showAll}
                      aria-label="All projects seats"
                      className="ml-auto h-9 w-9 shrink-0 p-0"
                      onClick={() => setShowAllSeats((v) => !v)}
                    >
                      {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-primary text-primary-foreground">
                    All projects seats
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto">
          {/* Sticky column headers — muted band: "Accounts (N)" + add, dept openings */}
          <div className="sticky top-0 z-10 flex h-12 border-y border-border bg-muted">
            <div className="flex w-[320px] flex-shrink-0 items-center justify-between border-r border-border px-6">
              <span className="text-sm font-semibold tracking-[0.14px] text-[#414b5c] dark:text-slate-300">
                Accounts ({rows.length})
              </span>
              <button
                type="button"
                aria-label="Add account"
                className="text-primary transition-colors hover:text-primary/80"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-w-0 flex-1">
              {DEPTS.map((dept, i) => {
                const soon = startingSoonFor(visibleProjects, dept)
                return (
                  <div key={dept} className={cn('flex flex-1 items-center gap-1.5 px-6', i === 0 && 'border-r border-border')}>
                    <span className="text-sm font-semibold tracking-[0.14px] text-[#414b5c] dark:text-slate-300">{dept}</span>
                    <span className="text-sm tracking-[0.14px] text-[#414b5c] dark:text-slate-300">
                      | {openingsFor(visibleProjects, dept)} Openings{soon > 0 && ` (${soon} start soon)`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rows */}
          {rows.map(({ project, seats }) => (
            <div key={project.id} className="flex border-b border-border">
              <div className="w-[320px] flex-shrink-0 border-r border-border">
                <AccountCard client={project.client} name={project.name} dates={project.dates} contractType={project.contractType} variant={project.variant} notesCount={project.notesCount} />
              </div>
              <div className="flex min-w-0 flex-1 bg-sidebar">
                {DEPTS.map((dept, i) => (
                  <div key={dept} className={cn('flex min-h-[60px] flex-1 flex-wrap content-start gap-2 p-3', i === 0 && 'border-r border-border')}>
                    {seatsByDept(seats, dept).map((seat) => {
                      const d = seatDisplay({ ...seat, allocations: allocsFor(seat) })
                      return (
                        <SeatCard
                          key={seat.id}
                          state={d.state}
                          role={shortRole(seat.role)}
                          hoursLabel={d.hoursLabel}
                          metaLabel={d.metaLabel}
                          person={d.person}
                          badges={d.badges.filter(Boolean) as ('TA' | 'NB' | 'PA')[]}
                          selected={selected?.seatId === seat.id}
                          onClick={() => openSeat(project, seat)}
                          className={cn(showAll && !seatMatches(seat) && 'opacity-50')}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-base font-medium text-destructive">
                Sorry, we didn't find any matching Accounts, Clients or People.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seat details sidebar */}
      <SeatDetailsPanel
        isOpen={!!selectedSeat}
        seat={selectedSeat}
        project={selectedProject}
        allocations={selectedAllocs}
        onClose={closePanel}
        onAllocate={() => setModalOpen(true)}
        onDeleteSeat={() => {
          if (!selectedSeat) return
          setDeletedSeats((prev) => new Set(prev).add(selectedSeat.id))
          closePanel()
        }}
        onDeleteAlloc={(id) => selectedSeat && setAllocs(selectedSeat.id, (a) => a.filter((x) => x.id !== id))}
      />

      {/* Allocation modal */}
      {selectedSeat && (
        <AllocationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          seat={selectedSeat}
          project={selectedProject}
          allocations={selectedAllocs}
        />
      )}
    </div>
  )
}
