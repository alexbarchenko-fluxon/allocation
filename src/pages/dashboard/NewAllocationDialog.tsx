import { useEffect, useState } from 'react'
import { DraftingCompass, Trash2, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { DateField } from './DateField'
import { fmtDate, weeksBetween } from './format'
import { PERSON_BADGE_PILL, PERSON_BADGE_STYLE, type ModalCandidate, type CandidateBar, type PersonBadge } from './data'
import type { Period } from './AllocationTimeline'

// Prototype: candidates aren't wired to a real reporting line yet.
const REPORTS_TO = 'Kenny Leung'

/** Bars that represent a real overlapping project (skip OOO / joiner flags). */
function isProjectBar(b: CandidateBar) {
  return !!b.label && b.tone !== 'ooo' && b.tone !== 'flag'
}

// Small bordered square button (trash), matching the sidebar card.
function IconButton({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input bg-[var(--input-bg)] text-muted-foreground shadow-sm transition-colors hover:bg-extended-hover"
    >
      {children}
    </button>
  )
}

/**
 * Confirmation shown before an allocation is committed from the modal's
 * candidate list (Figma 4096-18185). A flat white card recaps the person, the
 * proposed seat, any overlapping allocations and their reporting line, then
 * lets the planner Cancel / Propose / Confirm.
 */
export function NewAllocationDialog({
  open, onOpenChange, candidate, period, hoursPerWeek, onPropose, onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  candidate: ModalCandidate | null
  period: Period
  hoursPerWeek: number
  onPropose: () => void
  onConfirm: () => void
}) {
  // "Will not reduce availability" checkbox — checked shows a TA tag on the
  // person row. Reset on every open so a previous candidate's choice doesn't leak.
  const [keepsAvailability, setKeepsAvailability] = useState(false)
  useEffect(() => {
    if (open) setKeepsAvailability(false)
  }, [open])

  if (!candidate) return null

  const firstName = candidate.name.split(' ')[0]
  const overlaps = candidate.bars.filter(isProjectBar)
  const weeks = weeksBetween(period.startDate, period.endDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[532px] gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-6">
          <DialogTitle className="text-2xl font-semibold leading-8">New Allocation</DialogTitle>
        </div>

        {/* Body — flat white, content sits directly */}
        <div className="space-y-4 p-6">
          {/* Person */}
          <div className="flex items-center gap-2">
            <img src={candidate.avatar} alt={candidate.name} className="size-9 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-medium text-foreground">{candidate.name}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <DraftingCompass className="h-3.5 w-3.5" />{candidate.role}
              </span>
            </div>
            {keepsAvailability && (
              <span className={cn(PERSON_BADGE_PILL, PERSON_BADGE_STYLE.TA)}>TA</span>
            )}
            <IconButton title="Remove" onClick={() => onOpenChange(false)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>

          {/* Proposed seat — dates + hours/weeks */}
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted px-3 py-2">
            <span className="flex items-center gap-1.5">
              <DateField iso={period.startDate} icon={false} className="w-[94px]" />
              <span className="text-muted-foreground">–</span>
              <DateField iso={period.endDate} icon={false} className="w-[94px]" />
            </span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">{hoursPerWeek}h/w · {weeks} w</span>
          </div>

          {/* Overlapping allocations — a person's other commitments. Per Figma
              `project_conflict_list` every row is a uniform grey-bordered row;
              the only colour is the trailing TA / NB / PA badge. */}
          {overlaps.length > 0 && (
            <div className="space-y-2">
              {overlaps.map((b) => (
                <div
                  key={b.id}
                  className="flex h-9 items-center justify-between gap-2 rounded border border-border px-3 py-1"
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {b.label}
                    {b.hours != null && <span className="font-normal"> · {b.hours}h/w</span>}
                    <span className="font-normal"> · {fmtDate(b.startDate)} – {fmtDate(b.endDate)} · {weeksBetween(b.startDate, b.endDate)} w</span>
                  </span>
                  {b.badges?.map((bd) => (
                    <span key={bd.label} className={cn(PERSON_BADGE_PILL, PERSON_BADGE_STYLE[bd.label as PersonBadge])}>
                      {bd.label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Reports to */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />Reports to {REPORTS_TO}
          </div>

          {/* Availability */}
          <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
            <Checkbox
              className="mt-0.5"
              checked={keepsAvailability}
              onCheckedChange={(v) => setKeepsAvailability(v === true)}
            />
            <span>This allocation will not reduce {firstName}'s availability for new projects</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onPropose}>Propose</Button>
          <Button size="sm" onClick={onConfirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
