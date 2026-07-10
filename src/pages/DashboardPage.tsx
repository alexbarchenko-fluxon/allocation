import { useState, useMemo, useCallback } from 'react'
import { Search, ArrowDownAZ, ArrowUpAZ, Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InputGroup } from '@/components/ui/input-group'
import { FilterMultiSelect } from '@/components/ui/filter-multiselect'
import { AccountCard } from '@/components/dashboard/AccountCard'
import { SeatCard } from '@/components/dashboard/SeatCard'
import { SeatDetailsPanel } from '@/pages/dashboard/SeatDetailsPanel'
import { AllocationModal } from '@/pages/dashboard/AllocationModal'
import {
  DASH_PROJECTS, DASH_PERSON_MAP, openingsFor, shortRole,
  DEMO_PROJECT_NAMES, DEMO_CLIENTS,
  type Seat, type DashProject, type SeatAllocation, type Dept,
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
]

const DEPTS: Dept[] = ['Product and Design', 'Engineering']

// ── Seat display helpers ─────────────────────────────────────────────────────

/** Resolve the person + badges + labels a seat card should render. */
function seatDisplay(seat: Seat) {
  const current = seat.allocations.find((a) => a.status === 'current')
  const person = current ? DASH_PERSON_MAP.get(current.personId) ?? null : null
  const badges = seat.state === 'filled'
    ? [
        ...(current?.badge ? [current.badge] : []),
        ...(!seat.billable ? (['NB'] as const) : []),
      ]
    : (!seat.billable ? (['NB'] as const) : [])
  const hoursLabel = seat.state === 'filled' && current
    ? `${current.hoursPerWeek}/${seat.hoursPerWeek}h`
    : `${seat.hoursPerWeek}h`
  const metaLabel = seat.state === 'overdue'
    ? `Overdue ${seat.overdueDays ?? 0}d`
    : seat.startsLabel
      ? `Starts ${seat.startsLabel}`
      : undefined
  return { person, badges: [...badges] as SeatAllocation['badge'][], hoursLabel, metaLabel }
}

// ── Search field with typeahead — shared by Project + Client ──────────────────

function SearchField({
  value, onChange, placeholder, options, width,
}: { value: string; onChange: (v: string) => void; placeholder: string; options: string[]; width: number }) {
  const [open, setOpen] = useState(false)
  const suggestions = value.trim()
    ? options.filter((n) => n.toLowerCase().includes(value.toLowerCase()))
    : options
  return (
    <div className="relative" style={{ width }}>
      <InputGroup
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        wrapperClassName="h-9"
        rightElement={<Search className="h-4 w-4" />}
      />
      {open && suggestions.length > 0 && (
        // ~6 rows tall (6 × 33px), scroll inside for the rest
        <div className="scrollbar-minimal absolute left-0 top-[calc(100%+4px)] z-20 max-h-[198px] w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {suggestions.map((n) => (
            <div
              key={n}
              className="cursor-pointer truncate rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              onMouseDown={() => { onChange(n); setOpen(false) }}
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
  const [client, setClient] = useState('')
  const [seatRole, setSeatRole] = useState<string[]>([])
  const [seatType, setSeatType] = useState<string[]>([])
  const [allocation, setAllocation] = useState<string[]>([])
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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
  const hasAnyFilter = !!search.trim() || !!client.trim() || seatFilterActive

  const seatMatches = useCallback(
    (seat: Seat): boolean => {
      if (seatRole.length && !seatRole.includes(seat.roleGroup)) return false
      if (seatType.length && !seatType.some((t) => (t === 'billable' ? seat.billable : !seat.billable))) return false
      if (allocation.length && !allocation.some((a) => (a === 'overdue' ? seat.state === 'overdue' : seat.state === 'upcoming'))) return false
      return true
    },
    [seatRole, seatType, allocation],
  )

  const rows = useMemo(() => {
    let projects = [...DASH_PROJECTS]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      projects = projects.filter((p) => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q))
    }
    if (client.trim()) {
      const c = client.trim().toLowerCase()
      projects = projects.filter((p) => p.client.toLowerCase().includes(c))
    }

    const result = projects
      .map((p) => {
        const live = p.seats.filter((s) => !deletedSeats.has(s.id))
        const matching = live.filter(seatMatches)
        const seats = seatFilterActive ? matching : live
        return { project: p, seats, matchCount: matching.length }
      })
      .filter((r) => (seatFilterActive ? r.matchCount > 0 : true))

    result.sort((a, b) => {
      const cmp = a.project.name.localeCompare(b.project.name)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [search, client, seatMatches, seatFilterActive, sortDir, deletedSeats])

  const visibleProjects = rows.map((r) => r.project)
  const seatsByDept = (seats: Seat[], dept: Dept) => seats.filter((s) => s.dept === dept)

  const reset = () => { setSearch(''); setClient(''); setSeatRole([]); setSeatType([]); setAllocation([]) }

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
            <SearchField value={search} onChange={setSearch} placeholder="Project" options={DEMO_PROJECT_NAMES} width={294} />
            <SearchField value={client} onChange={setClient} placeholder="Client" options={DEMO_CLIENTS} width={200} />
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
          </div>
        </div>

        {/* Body */}
        <div className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto">
          {/* Sticky column headers */}
          <div className="sticky top-0 z-10 flex h-10 border-y border-border bg-background">
            <div className="flex w-[320px] flex-shrink-0 items-center justify-between border-r border-border px-2">
              <Badge variant="secondary" className="gap-1 rounded-full border-transparent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {rows.length}
              </Badge>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} aria-label="Sort">
                {sortDir === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex min-w-0 flex-1">
              {DEPTS.map((dept, i) => (
                <div key={dept} className={cn('flex flex-1 items-center gap-2 px-4', i === 0 && 'border-r border-border')}>
                  <span className="text-xs font-semibold leading-4 text-foreground">{dept}</span>
                  <span className="text-xs text-muted-foreground">| {openingsFor(visibleProjects, dept)} Openings</span>
                </div>
              ))}
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
                          state={seat.state}
                          role={shortRole(seat.role)}
                          hoursLabel={d.hoursLabel}
                          metaLabel={d.metaLabel}
                          person={d.person}
                          badges={d.badges.filter(Boolean) as ('TA' | 'NB' | 'PA')[]}
                          selected={selected?.seatId === seat.id}
                          onClick={() => openSeat(project, seat)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-1 py-20 text-center">
              <Plus className="mb-1 h-6 w-6 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">No matching projects</p>
              <p className="text-sm text-muted-foreground">Try adjusting or resetting the filters.</p>
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
        />
      )}
    </div>
  )
}
