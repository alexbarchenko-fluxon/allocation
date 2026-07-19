import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PERSON_BADGE_PILL, PERSON_BADGE_STYLE, type SeatState, type PersonBadge } from '@/pages/dashboard/data'

// ── Small role/status pill shown after a person's name ─────────────────────────
// TA = tentative, NB = non-billable, PA = pending approval. Colours per Figma.

export function SeatBadge({ kind }: { kind: PersonBadge }) {
  return (
    <span
      className={cn(
        PERSON_BADGE_PILL,
        // Dashboard card tags run at half the canonical pill size.
        'rounded-[1px] px-1 py-px text-[6px] leading-[8px]',
        PERSON_BADGE_STYLE[kind],
      )}
    >
      {kind}
    </span>
  )
}

// ── Seat card ──────────────────────────────────────────────────────────────────

export interface SeatCardProps {
  state: SeatState
  /** Short role label — "TPM", "Eng", "Design" */
  role: string
  /** "20/20h" for filled, "20h" for assign */
  hoursLabel: string
  /** "Starts 7/12" | "Overdue 7d" | undefined */
  metaLabel?: string
  /** Filled seats only */
  person?: { short: string; avatar: string } | null
  badges?: PersonBadge[]
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function SeatCard({
  state,
  role,
  hoursLabel,
  metaLabel,
  person,
  badges = [],
  selected,
  onClick,
  className,
}: SeatCardProps) {
  // Filled + proposed both surface a real person (avatar + name); the assign
  // states show a dashed "+" placeholder instead.
  const hasPerson = state === 'filled' || state === 'proposed'
  const isAssign = !hasPerson
  const isOverdue = state === 'overdue'

  return (
    <div
      className={cn(
        'flex h-12 w-[164px] shrink-0 cursor-pointer items-center gap-1 rounded p-2 transition-colors',
        state === 'filled' &&
          'border border-border bg-background hover:bg-extended-hover',
        // Proposed / pending approval → purple-50 fill, purple-300 dashed edge
        // (Figma 4597-27425). Matches the seat-details & timeline proposed tone.
        state === 'proposed' &&
          'border border-dashed border-[#d8b4fe] bg-[#faf5ff] hover:brightness-[0.985] dark:border-[#a855f7] dark:bg-[#3b0764]',
        (state === 'upcoming' || state === 'open') &&
          'border border-[color:var(--timeline-misalloc-ooo)] bg-badge-warning hover:brightness-[0.985]',
        state === 'overdue' &&
          'border border-[color:var(--timeline-unassigned-ooo)] bg-badge-error hover:brightness-[0.985]',
        selected && 'ring-2 ring-primary ring-offset-1',
        className,
      )}
      onClick={onClick}
    >
      {/* Leading: avatar (filled / proposed) or dashed + circle (assign) */}
      {isAssign ? (
          <span
            className={cn(
              'relative flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed',
              isOverdue
                ? 'border-badge-error-fg text-badge-error-fg'
                : 'border-badge-warning-fg text-badge-warning-fg',
            )}
          >
            <Plus className="size-3.5" />
          </span>
        ) : (
          <img
            src={person?.avatar}
            alt={person?.short ?? ''}
            className="size-6 shrink-0 rounded-full object-cover"
          />
        )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Line 1 — name / Assign + trailing badges */}
          <div className="flex w-full items-center gap-2">
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm leading-none',
                isAssign ? 'text-badge-warning-fg' : 'text-foreground',
              )}
            >
              {isAssign ? 'Assign' : person?.short}
            </span>
            {badges.length > 0 && (
              <span className="flex shrink-0 items-center gap-1">
                {badges.map((b) => (
                  <SeatBadge key={b} kind={b} />
                ))}
              </span>
            )}
          </div>

          {/* Line 2 — role · hours + trailing meta */}
          <div className="flex w-full items-center justify-between gap-2 text-[10px] leading-4">
            <span className="flex shrink-0 items-center gap-1">
              <span className="text-foreground">{role}</span>
              <span className="text-muted-foreground">{hoursLabel}</span>
            </span>
            {metaLabel && (
              <span
                className={cn(
                  'shrink-0 truncate',
                  isOverdue ? 'text-badge-error-fg' : 'text-muted-foreground',
                )}
              >
                {metaLabel}
              </span>
            )}
          </div>
        </div>
    </div>
  )
}
