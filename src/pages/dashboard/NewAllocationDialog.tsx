import { DraftingCompass, Trash2, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { DateField } from './DateField'
import { fmtDate, weeksBetween } from './format'
import type { ModalCandidate, CandidateBar } from './data'
import type { Period } from './AllocationTimeline'
import slackLogo from '@/assets/logos/logo-slack.svg'

// Prototype: candidates aren't wired to a real reporting line yet.
const REPORTS_TO = 'Kenny Leung'

// Existing-schedule blocks reuse the timeline tones (orange misallocation,
// red unassigned, muted proposed, outlined available).
const BLOCK_TONE: Record<string, string> = {
  misalloc:   'bg-badge-warning border-[color:var(--timeline-misalloc-ooo)]',
  unassigned: 'bg-badge-error border-[color:var(--timeline-unassigned-ooo)]',
  proposed:   'bg-muted border-border',
  available:  'bg-background border-border',
}

const BADGE_TONE: Record<string, string> = {
  blue:    'bg-[#e7ebff] text-[#0e35ff]',
  dark:    'bg-[#111827] text-white',
  neutral: 'bg-[#e5e7eb] text-[#111827]',
  orange:  'bg-badge-warning-stroke text-badge-warning-fg',
  gray:    'bg-[#d1d5db] text-[#111827] dark:bg-[#4b5563] dark:text-white',
}

/** Bars that represent a real overlapping project (skip OOO / joiner flags). */
function isProjectBar(b: CandidateBar) {
  return !!b.label && b.tone !== 'ooo' && b.tone !== 'flag'
}

// Small bordered square button (Slack / trash), matching the sidebar card.
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
            <IconButton title="Message on Slack" onClick={() => window.open('https://slack.com', '_blank')}>
              <img src={slackLogo} alt="Slack" className="h-4 w-4" />
            </IconButton>
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

          {/* Overlapping allocations */}
          {overlaps.length > 0 && (
            <div className="space-y-2">
              {overlaps.map((b) => (
                <div
                  key={b.id}
                  className={cn('flex h-9 items-center justify-between gap-2 rounded border px-4 py-1', BLOCK_TONE[b.tone] ?? BLOCK_TONE.proposed)}
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#111827]">
                    {b.label}
                    {b.hours != null && <span className="font-normal"> · {b.hours}h/w</span>}
                    <span className="font-normal"> · {fmtDate(b.startDate)} – {fmtDate(b.endDate)} · {weeksBetween(b.startDate, b.endDate)} w</span>
                  </span>
                  {b.badges?.map((bd) => (
                    <span key={bd.label} className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', BADGE_TONE[bd.tone ?? 'neutral'])}>
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
            <Checkbox className="mt-0.5" />
            <span>This allocation will not reduce {firstName}'s availability for new projects</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <span className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onPropose}>Propose</Button>
            <Button size="sm" onClick={onConfirm}>Confirm</Button>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
