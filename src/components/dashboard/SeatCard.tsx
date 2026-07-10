import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SeatState, PersonBadge } from '@/pages/dashboard/data'

// ── Small role/status pill shown after a person's name ─────────────────────────
// TA = tentative, NB = non-billable, PA = pending approval. Colours per Figma.

const BADGE_STYLE: Record<PersonBadge, string> = {
  TA: 'bg-[#e5e7eb] text-[#111827] dark:bg-[#374151] dark:text-white',
  NB: 'bg-[#e7ebff] text-[#0e35ff] dark:bg-[#1e2a5a] dark:text-[#a5b4ff]',
  PA: 'bg-[#d1d5db] text-[#111827] dark:bg-[#4b5563] dark:text-white',
}

export function SeatBadge({ kind }: { kind: PersonBadge }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full px-1 text-[8px] font-medium leading-4',
        BADGE_STYLE[kind],
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
  const isAssign = state !== 'filled'
  const isOverdue = state === 'overdue'

  return (
    <div
      className={cn(
        'flex h-12 w-[164px] shrink-0 cursor-pointer items-center gap-1 rounded p-2 transition-colors',
        state === 'filled' &&
          'border border-border bg-background hover:bg-extended-hover',
        (state === 'upcoming' || state === 'open') &&
          'border border-[color:var(--timeline-misalloc-ooo)] bg-badge-warning hover:brightness-[0.985]',
        state === 'overdue' &&
          'border border-[color:var(--timeline-unassigned-ooo)] bg-badge-error hover:brightness-[0.985]',
        selected && 'ring-2 ring-primary ring-offset-1',
        className,
      )}
      onClick={onClick}
    >
      {/* Leading: avatar (filled) or dashed + circle (assign) */}
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
