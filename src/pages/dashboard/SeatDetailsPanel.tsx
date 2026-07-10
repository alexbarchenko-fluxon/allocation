import { useState } from 'react'
import { X, DraftingCompass, Trash2, NotepadText, ChevronDown, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DateField } from './DateField'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { weeksBetween, fmtDate } from './format'
import { DASH_PERSON_MAP, type Seat, type SeatNote, type DashProject, type SeatAllocation } from './data'
import slackLogo from '@/assets/logos/logo-slack.svg'

/** True when an ISO date is before today — used to warn about past billing. */
function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

const PANEL_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const PANEL_DURATION = '0.35s'

// ── Small square icon button (Slack / trash) ─────────────────────────────────

function IconButton({
  children, onClick, title, className,
}: { children: React.ReactNode; onClick?: () => void; title?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md border border-input bg-[var(--input-bg)] text-muted-foreground shadow-sm transition-colors hover:bg-extended-hover',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ── One allocation card (Upcoming / Current) ─────────────────────────────────

function AllocationCard({
  alloc, onDelete,
}: { alloc: SeatAllocation; onDelete: () => void }) {
  const person = DASH_PERSON_MAP.get(alloc.personId)
  if (!person) return null
  const firstName = person.name.split(' ')[0]
  return (
    <div>
      {/* Person row */}
      <div className="flex items-start gap-2">
        <img src={person.avatar} alt={person.name} className="size-9 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-foreground">{person.name}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <DraftingCompass className="h-3.5 w-3.5" />{person.role}
          </span>
        </div>
        <IconButton title="Message on Slack" onClick={() => window.open('https://slack.com', '_blank')}>
          <img src={slackLogo} alt="Slack" className="h-4 w-4" />
        </IconButton>
        <IconButton title="Remove allocation" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Dates + summary — muted inset box */}
      <div className="mt-3 flex items-center gap-3 rounded-md bg-muted px-3 py-2">
        <div className="flex items-center gap-2">
          <DateField iso={alloc.startDate} icon={false} className="w-[94px]" />
          <span className="text-muted-foreground">–</span>
          <DateField iso={alloc.endDate} icon={false} className="w-[94px]" />
        </div>
        <span className="text-xs text-muted-foreground">
          {weeksBetween(alloc.startDate, alloc.endDate)} w · {alloc.hoursPerWeek}h/w
        </span>
      </div>

      {/* Reports to */}
      {person.reportsTo && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />Reports to {person.reportsTo}
        </div>
      )}

      {/* Availability checkbox */}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
        <Checkbox checked={!!alloc.keepsAvailability} className="mt-0.5" />
        <span>This allocation will not reduce {firstName}'s availability for new projects</span>
      </label>
    </div>
  )
}

// ── One note (Notes accordion) ───────────────────────────────────────────────

function NoteRow({ note }: { note: SeatNote }) {
  return (
    <div className={cn('relative rounded-md p-4', note.isNew && 'bg-accent/50')}>
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <span className="truncate">{note.author}</span>
        <span className="opacity-50">|</span>
        <span className="truncate">{note.date}</span>
        {note.isNew && <span className="ml-auto size-2 shrink-0 rounded-full bg-primary" />}
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{note.body}</p>
    </div>
  )
}

// ── A titled allocation group card (Upcoming / Current) ──────────────────────

function AllocationGroup({
  title, count, allocs, onDeleteAlloc, collapsible = false,
}: {
  title: string
  count?: number
  allocs: SeatAllocation[]
  onDeleteAlloc: (id: string) => void
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(true)
  if (allocs.length === 0) return null
  const showList = !collapsible || open
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {count != null && count > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-xs font-medium text-secondary-foreground">{count}</span>
          )}
        </div>
        {collapsible && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-muted-foreground" aria-label={open ? 'Collapse' : 'Expand'}>
            <ChevronDown className={cn('h-5 w-5 transition-transform', !open && '-rotate-90')} />
          </button>
        )}
      </div>
      {showList && (
        <div className="mt-4 space-y-4">
          {allocs.map((a, i) => (
            <div key={a.id} className={cn(i > 0 && 'border-t border-border pt-4')}>
              <AllocationCard alloc={a} onDelete={() => onDeleteAlloc(a.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function SeatDetailsPanel({
  isOpen, seat, project, allocations, onClose, onAllocate, onDeleteSeat, onDeleteAlloc,
}: {
  isOpen: boolean
  seat: Seat | null
  project: DashProject | null
  allocations: SeatAllocation[]
  onClose: () => void
  onAllocate: () => void
  onDeleteSeat: () => void
  onDeleteAlloc: (id: string) => void
}) {
  // Current is a single allocation; everything else (excl. proposed, which lives
  // in the Allocate pill) falls under Past Allocations.
  const currentAlloc = allocations.find((a) => a.status === 'current') ?? null
  const pastAllocs = allocations.filter((a) => a !== currentAlloc && a.status !== 'proposed')
  const proposedCount = allocations.filter((a) => a.status === 'proposed').length
  const notes = seat?.notes ?? []
  const [notesOpen, setNotesOpen] = useState(true)

  // Destructive confirmations — a seat deletion and, keyed by id, an allocation.
  const [deleteSeatOpen, setDeleteSeatOpen] = useState(false)
  const [pendingAllocId, setPendingAllocId] = useState<string | null>(null)
  const pendingAlloc = allocations.find((a) => a.id === pendingAllocId) ?? null
  const pendingPerson = pendingAlloc ? DASH_PERSON_MAP.get(pendingAlloc.personId) : null

  return (
    <div
      className="h-full flex-shrink-0 overflow-hidden"
      style={{
        width: isOpen ? 520 : 0,
        marginLeft: isOpen ? 0 : -10,
        transition: `width ${PANEL_DURATION} ${PANEL_EASING}, margin-left ${PANEL_DURATION} ${PANEL_EASING}`,
      }}
    >
      <div className="h-full w-[520px]">
        <div className="flex h-full w-[520px] flex-col overflow-hidden rounded-lg border border-border bg-muted">
          {/* Header */}
          <div className="relative z-10 flex h-20 flex-shrink-0 items-center bg-background px-5 shadow-[0px_6px_12px_0px_rgba(106,106,106,0.05)]">
            <span className="text-lg font-semibold leading-6 tracking-[0.18px] text-foreground">Seat details</span>
            <Button variant="ghost" onClick={onClose} className="absolute right-4 top-1/2 h-9 w-9 -translate-y-1/2 p-0 opacity-70">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {seat && (
            <div className="scrollbar-panel min-h-0 flex-1 space-y-6 overflow-y-auto bg-muted px-6 pb-6 pt-6">
              {/* Seat info card */}
              <div className="rounded-lg border border-border bg-background">
                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <DraftingCompass className="h-5 w-5" />
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium">
                      <span className="text-foreground">{seat.role}</span>
                      <span className="text-muted-foreground">·</span>
                      <span><span className="text-foreground">{seat.hoursPerWeek}h</span> <span className="text-muted-foreground">/w</span></span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-foreground">{seat.weeks} w</span>
                    </div>
                    <IconButton title="Delete seat" onClick={() => setDeleteSeatOpen(true)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Start</span>
                    <DateField iso={seat.startDate} icon={false} className="w-[100px]" />
                    <span className="text-muted-foreground">–</span>
                    <span className="text-sm text-muted-foreground">End</span>
                    <DateField iso={seat.endDate} icon={false} className="w-[100px]" />
                    {!seat.billable && <Badge variant="blue" className="ml-auto text-[10px]">NB</Badge>}
                  </div>
                </div>

                {/* Notes accordion */}
                <div className="border-t border-border px-5">
                  <button
                    type="button"
                    onClick={() => setNotesOpen((v) => !v)}
                    className="flex w-full items-center justify-between py-4"
                  >
                    <span className="flex items-center gap-2">
                      <NotepadText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Notes</span>
                      {seat.notesCount ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">{seat.notesCount}</span>
                      ) : null}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', notesOpen && 'rotate-180')} />
                  </button>

                  {notesOpen && (
                    <div className="space-y-2 pb-4">
                      {/* Add note */}
                      <div className="space-y-2">
                        <textarea
                          placeholder="Add a note…"
                          className="scrollbar-panel h-16 w-full resize-none rounded-md border border-input bg-[var(--input-bg)] p-3 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" className="h-8 px-3 text-xs">Cancel</Button>
                          <Button variant="secondary" className="h-8 px-3 text-xs">Add note</Button>
                        </div>
                      </div>

                      {/* Notes list */}
                      {notes.length > 0 && (
                        <div className="space-y-1">
                          {notes.map((n, i) => <NoteRow key={i} note={n} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Allocate */}
              <button
                type="button"
                onClick={onAllocate}
                className="flex w-full items-center gap-4 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-extended-hover"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[color:var(--timeline-misalloc-ooo)]">
                  <Plus className="h-3.5 w-3.5 text-badge-warning-fg" />
                </span>
                <span className="flex-1 text-sm font-medium text-badge-warning-fg">Allocate</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-1 text-xs font-medium',
                    proposedCount > 0 ? 'bg-badge-warning text-foreground' : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  Proposed
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium',
                      proposedCount > 0 ? 'bg-badge-warning-fg text-white' : 'bg-background text-foreground',
                    )}
                  >
                    {proposedCount}
                  </span>
                </span>
              </button>

              {/* Current — a single allocation */}
              {currentAlloc && (
                <AllocationGroup title="Current Allocation" allocs={[currentAlloc]} onDeleteAlloc={setPendingAllocId} />
              )}

              {/* Past — several, collapsible */}
              <AllocationGroup
                title="Past Allocations"
                count={pastAllocs.length}
                allocs={pastAllocs}
                onDeleteAlloc={setPendingAllocId}
                collapsible
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete seat confirmation */}
      {seat && (
        <DeleteConfirmDialog
          open={deleteSeatOpen}
          onOpenChange={setDeleteSeatOpen}
          title="Delete Seat"
          fields={[
            { label: 'Seat id', value: seat.id },
            { label: 'Project Name', value: project?.name ?? '—' },
            { label: 'Seat Role', value: seat.role },
            { label: 'Start-End date', value: `${fmtDate(seat.startDate)} – ${fmtDate(seat.endDate)}` },
          ]}
          warning={isPast(seat.startDate)
            ? 'Start date of the seat is in past. Deleting this seat may cause unexpected impact on the billing for past billing cycle.'
            : undefined}
          onConfirm={onDeleteSeat}
        />
      )}

      {/* Remove allocation confirmation */}
      {pendingAlloc && pendingPerson && (
        <DeleteConfirmDialog
          open={!!pendingAllocId}
          onOpenChange={(v) => { if (!v) setPendingAllocId(null) }}
          title="Delete Allocation"
          fields={[
            { label: 'Employee', value: pendingPerson.name },
            { label: 'Allocation role', value: pendingPerson.role },
            { label: 'Start-End date', value: `${fmtDate(pendingAlloc.startDate)} – ${fmtDate(pendingAlloc.endDate)}` },
          ]}
          warning={isPast(pendingAlloc.startDate)
            ? 'Start date of the allocation is in past. Deleting this allocation may cause unexpected impact on the billing for past billing cycle.'
            : undefined}
          onConfirm={() => onDeleteAlloc(pendingAlloc.id)}
        />
      )}
    </div>
  )
}
