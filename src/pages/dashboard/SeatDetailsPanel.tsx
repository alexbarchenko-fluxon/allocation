import { useState } from 'react'
import {
  X, Trash2, NotepadText, ChevronDown, Plus, Users,
  FlagTriangleRight, Lightbulb, History, DraftingCompass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DateField } from './DateField'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { weeksBetween, fmtDate } from './format'
import {
  DASH_PERSON_MAP, PERSON_BADGE_PILL, PERSON_BADGE_STYLE,
  type Seat, type SeatNote, type DashProject, type SeatAllocation, type AllocConflict,
  type PersonBadge,
} from './data'
import emptyAllocation from '@/assets/empty-allocation.svg'

/** True when an ISO date is before today — used to warn about past billing. */
function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

const PANEL_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const PANEL_DURATION = '0.35s'

// ── Small square icon button (trash) ─────────────────────────────────────────

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

// ── TA / NB / PA badge — the palette used across the plan / conflict rows ─────

function AllocBadge({ kind }: { kind: PersonBadge }) {
  return (
    <span className={cn(PERSON_BADGE_PILL, PERSON_BADGE_STYLE[kind])}>
      {kind}
    </span>
  )
}

// Thin middot separator used inside the dense conflict rows.
function MidDot() {
  return <span className="shrink-0 px-1 text-muted-foreground/50">·</span>
}

// ── Stage cards ───────────────────────────────────────────────────────────────
// Figma 4480-25519 / 4482-21977 / 4582-34957: each lifecycle stage is its own
// bordered card, and the border style is what separates them at a glance —
// Allocation Plan = solid blue, Proposed = dashed purple, Past = plain grey.

type StageTone = 'plan' | 'proposed' | 'past'

const STAGE_BORDER: Record<StageTone, string> = {
  plan:     'border border-[#0e35ff] dark:border-[#6e86ff]',
  proposed: 'border border-dashed border-[#d8b4fe] dark:border-[#a855f7]',
  past:     'border border-border',
}

const STAGE_ICON: Record<StageTone, React.ReactNode> = {
  plan:     <FlagTriangleRight className="h-5 w-5" />,
  proposed: <Lightbulb className="h-5 w-5" />,
  past:     <History className="h-5 w-5" />,
}

function StageCard({
  tone, title, defaultOpen = true, children,
}: {
  tone: StageTone
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('rounded-lg bg-background px-5', STAGE_BORDER[tone])}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-4"
      >
        <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
          {STAGE_ICON[tone]}
          <span className="text-sm font-medium">{title}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open ? 'rotate-180' : '-rotate-90')} />
      </button>
      {open && <div className="space-y-4 pb-6">{children}</div>}
    </div>
  )
}

// ── Empty state — no allocations planned yet (Figma 4480-22553) ───────────────
// The whole box is a click target into the allocation flow.

function EmptyPlan({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-[#7a90ff] px-6 py-10 text-center transition-colors hover:bg-[#f5f7ff] dark:border-[#4a5fd0] dark:hover:bg-[#141c3a]"
    >
      <img src={emptyAllocation} alt="" className="mb-2 h-[126px] w-[110px]" />
      <p className="text-sm font-medium text-foreground">No current allocations planned</p>
      <p className="text-xs text-muted-foreground">Add a new allocation to see them here</p>
    </button>
  )
}

// ── Person header row — avatar, name + title, trailing slot ──────────────────

function PersonHead({
  personId, nameTag, trailing,
}: { personId: string; nameTag?: React.ReactNode; trailing?: React.ReactNode }) {
  const person = DASH_PERSON_MAP.get(personId)
  if (!person) return null
  return (
    <div className="flex items-center gap-2">
      <img src={person.avatar} alt={person.name} className="size-9 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-medium leading-tight text-foreground">{person.name}</span>
          {nameTag}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <DraftingCompass className="h-3.5 w-3.5 shrink-0" />
          {person.role}
        </span>
      </div>
      {trailing}
    </div>
  )
}

// ── Dates + summary inset (muted box) ────────────────────────────────────────

function DatesInset({ alloc }: { alloc: SeatAllocation }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2">
      <div className="flex items-center gap-2">
        <DateField iso={alloc.startDate} icon={false} className="w-[94px]" />
        <span className="text-muted-foreground">–</span>
        <DateField iso={alloc.endDate} icon={false} className="w-[94px]" />
      </div>
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {alloc.hoursPerWeek}h/w · {weeksBetween(alloc.startDate, alloc.endDate)} w
      </span>
    </div>
  )
}

// ── "Reports to" + availability checkbox (shared meta rows) ──────────────────

function AllocMeta({
  alloc, checked, onCheckedChange,
}: { alloc: SeatAllocation; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  const person = DASH_PERSON_MAP.get(alloc.personId)
  if (!person) return null
  const firstName = person.name.split(' ')[0]
  return (
    <>
      {person.reportsTo && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />Reports to {person.reportsTo}
        </div>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="mt-0.5"
        />
        <span>This allocation will not reduce {firstName}'s availability for new projects</span>
      </label>
    </>
  )
}

// ── One compact conflict row (proposed candidate's other commitments) ────────

function ConflictRow({ conflict }: { conflict: AllocConflict }) {
  return (
    <div className="flex h-9 items-center justify-between gap-2 rounded border border-border px-3">
      <div className="flex min-w-0 items-center text-xs">
        <span className="max-w-[92px] shrink truncate font-medium text-foreground">{conflict.project}</span>
        <MidDot />
        <span className="shrink-0 text-muted-foreground">{conflict.hoursPerWeek}h/w</span>
        <MidDot />
        <span className="truncate text-muted-foreground">{fmtDate(conflict.startDate)} – {fmtDate(conflict.endDate)}</span>
        <MidDot />
        <span className="shrink-0 text-muted-foreground">{weeksBetween(conflict.startDate, conflict.endDate)} w</span>
      </div>
      {conflict.badge && <AllocBadge kind={conflict.badge} />}
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
  // Group allocations by lifecycle stage. Current + Upcoming together form the
  // Allocation Plan card; Proposed and Past get their own cards. Default-open:
  // plan and proposed open, past closed.
  const stageOf = (status: SeatAllocation['status']) =>
    allocations.filter((a) => a.status === status)
  const currentAllocs = stageOf('current')
  const upcomingAllocs = stageOf('upcoming')
  const proposedAllocs = stageOf('proposed')
  const pastAllocs = stageOf('past')
  const hasPlan = currentAllocs.length > 0 || upcomingAllocs.length > 0

  const notes = seat?.notes ?? []
  const [notesOpen, setNotesOpen] = useState(false)

  // "Will not reduce availability" checkbox, per allocation id — seeded from the
  // data, toggled locally. Checked shows a TA tag next to the trailing controls.
  const [keepsAvailability, setKeepsAvailability] = useState<Record<string, boolean>>({})
  const allocKeeps = (a: SeatAllocation) =>
    keepsAvailability[a.id] ?? (!!a.keepsAvailability || a.badge === 'TA')
  const setAllocKeeps = (id: string, v: boolean) =>
    setKeepsAvailability((prev) => ({ ...prev, [id]: v }))

  // Destructive confirmations — a seat deletion and, keyed by id, an allocation.
  const [deleteSeatOpen, setDeleteSeatOpen] = useState(false)
  const [pendingAllocId, setPendingAllocId] = useState<string | null>(null)
  const pendingAlloc = allocations.find((a) => a.id === pendingAllocId) ?? null
  const pendingPerson = pendingAlloc ? DASH_PERSON_MAP.get(pendingAlloc.personId) : null

  // Render one person block (avatar + dates + meta). `variant` tweaks the trailing
  // controls: plan → trash, proposed → hours pill + Reject/Assign, past → trash.
  const AllocBlock = ({ alloc, variant }: { alloc: SeatAllocation; variant: 'plan' | 'proposed' | 'past' }) => (
    <div>
      <PersonHead
        personId={alloc.personId}
        nameTag={variant === 'proposed' ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-[#f0fdf4] px-2 py-0.5 text-xs font-medium text-[#15803d] dark:bg-[#052e16] dark:text-[#4ade80]">
            <span className="size-1.5 rounded-full bg-current" />{alloc.hoursPerWeek}h
          </span>
        ) : undefined}
        trailing={
          <div className="flex shrink-0 items-center gap-2">
            {variant !== 'proposed' && alloc.badge && alloc.badge !== 'TA' && <AllocBadge kind={alloc.badge} />}
            {allocKeeps(alloc) && <AllocBadge kind="TA" />}
            {variant === 'proposed' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteAlloc(alloc.id)}
                  className="h-9"
                >
                  Reject
                </Button>
                <Button size="sm" onClick={onAllocate} className="h-9">Assign</Button>
              </>
            ) : (
              <IconButton title="Remove allocation" onClick={() => setPendingAllocId(alloc.id)}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        }
      />
      <div className="mt-3">
        <DatesInset alloc={alloc} />
      </div>
      {variant !== 'past' && (
        <AllocMeta
          alloc={alloc}
          checked={allocKeeps(alloc)}
          onCheckedChange={(v) => setAllocKeeps(alloc.id, v)}
        />
      )}
      {variant === 'proposed' && alloc.conflicts && alloc.conflicts.length > 0 && (
        <div className="mt-3 space-y-2">
          {alloc.conflicts.map((c, i) => <ConflictRow key={i} conflict={c} />)}
        </div>
      )}
    </div>
  )

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
          {/* Header — seat identity + delete / close */}
          <div className="relative z-10 flex h-20 flex-shrink-0 items-center bg-background px-5 shadow-[0px_6px_12px_0px_rgba(106,106,106,0.05)]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold leading-6 tracking-[0.18px] text-foreground">{seat?.roleGroup} Seat</p>
              {seat && <p className="mt-0.5 text-xs text-muted-foreground">{seat.hoursPerWeek}h/w</p>}
            </div>
            {seat && (
              <IconButton title="Delete seat" onClick={() => setDeleteSeatOpen(true)} className="mr-1">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            )}
            <Button variant="ghost" onClick={onClose} className="h-9 w-9 p-0 opacity-70">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {seat && (
            <div className="scrollbar-panel flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
              {/* Dates strip */}
              <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-background px-5 py-4">
                <span className="text-sm text-muted-foreground">Start</span>
                <DateField iso={seat.startDate} icon={false} className="w-[100px]" />
                <span className="text-muted-foreground">–</span>
                <span className="text-sm text-muted-foreground">End</span>
                <DateField iso={seat.endDate} icon={false} className="w-[100px]" />
                <span className="ml-1 text-sm text-muted-foreground">·</span>
                <span className="text-sm font-medium text-foreground">{seat.weeks} w</span>
                {!seat.billable && <span className={cn(PERSON_BADGE_PILL, PERSON_BADGE_STYLE.NB, 'ml-auto')}>NB</span>}
              </div>

              {/* Notes strip */}
              <div className="flex-shrink-0 border-b border-border bg-background px-5">
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
                  <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', notesOpen ? 'rotate-180' : '-rotate-90')} />
                </button>
                {notesOpen && (
                  <div className="space-y-2 pb-4">
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
                    {notes.length > 0 && (
                      <div className="space-y-1">
                        {notes.map((n, i) => <NoteRow key={i} note={n} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stage cards — border style separates the stages (Figma 4582-34957):
                  Plan = solid blue, Proposed = dashed purple, Past = grey. */}
              <div className="space-y-4 bg-background p-4">
                {hasPlan ? (
                  <StageCard tone="plan" title="Allocation Plan">
                    {currentAllocs.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground">Current</p>
                        {currentAllocs.map((a, i) => (
                          <div key={a.id} className={cn(i > 0 && 'border-t border-border pt-4')}>
                            <AllocBlock alloc={a} variant="plan" />
                          </div>
                        ))}
                      </div>
                    )}
                    {currentAllocs.length > 0 && upcomingAllocs.length > 0 && (
                      <div className="border-t border-border" />
                    )}
                    {upcomingAllocs.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                        {upcomingAllocs.map((a, i) => (
                          <div key={a.id} className={cn(i > 0 && 'border-t border-border pt-4')}>
                            <AllocBlock alloc={a} variant="plan" />
                          </div>
                        ))}
                      </div>
                    )}
                  </StageCard>
                ) : (
                  <EmptyPlan onClick={onAllocate} />
                )}

                {proposedAllocs.length > 0 && (
                  <StageCard tone="proposed" title="Proposed Allocation">
                    {proposedAllocs.map((a, i) => (
                      <div key={a.id} className={cn(i > 0 && 'border-t border-border pt-4')}>
                        <AllocBlock alloc={a} variant="proposed" />
                      </div>
                    ))}
                  </StageCard>
                )}

                {pastAllocs.length > 0 && (
                  <StageCard tone="past" title="Past Allocation" defaultOpen={false}>
                    {pastAllocs.map((a, i) => (
                      <div key={a.id} className={cn(i > 0 && 'border-t border-border pt-4')}>
                        <AllocBlock alloc={a} variant="past" />
                      </div>
                    ))}
                  </StageCard>
                )}
              </div>
            </div>
          )}

          {/* Footer — single primary entry into the allocation flow */}
          {seat && (
            <div className="flex flex-shrink-0 items-center justify-end border-t border-border bg-background px-5 py-5">
              <Button onClick={onAllocate} className="gap-2">
                <Plus className="h-4 w-4" />New Allocation
              </Button>
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

      {/* Remove / reject allocation confirmation */}
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
