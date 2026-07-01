import { cn } from '@/lib/utils'
import type { Person } from '@/mocks/people'

// ── Data types ────────────────────────────────────────────────────────────────

export interface SeatData {
  personId: string | null  // null = open / unassigned seat
  /** Short role label shown in the card header: "Eng", "Design", "PM", "TPM", "QA" */
  role: string
  hoursPerWeek: number
  /**
   * ISO "YYYY-MM-DD" — only provide when the seat starts in the future.
   * Displayed as "Starts M/D". Omit for seats that are already active.
   */
  startDate?: string
  nonBillable?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

function abbrevName(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0]} ${parts[parts.length - 1][0]}.`
    : name
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface SeatCardProps {
  person: Person | null
  role: string
  hoursPerWeek: number
  /** Only shown when provided (future-scheduled seats only) */
  startDate?: string
  nonBillable?: boolean
  onClick?: () => void
  className?: string
}

export function SeatCard({
  person,
  role,
  hoursPerWeek,
  startDate,
  nonBillable,
  onClick,
  className,
}: SeatCardProps) {
  const isOpen = person === null

  return (
    <div
      className={cn(
        'rounded-md border flex flex-col gap-2 p-3 cursor-pointer transition-colors',
        isOpen
          ? 'bg-badge-error border-red-200 dark:border-red-900'
          : 'bg-background border-border hover:bg-extended-hover',
        className,
      )}
      onClick={onClick}
    >
      {/* Top row: role · Xh · Starts M/D + optional NB badge */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <span
            className={cn(
              'text-sm font-medium leading-none shrink-0',
              isOpen ? 'text-badge-error-fg' : 'text-foreground',
            )}
          >
            {role}
          </span>
          <span className={cn('text-xs leading-none shrink-0', isOpen ? 'text-foreground' : 'text-muted-foreground')}>·</span>
          <span className={cn('text-xs leading-none shrink-0', isOpen ? 'text-foreground' : 'text-muted-foreground')}>
            {hoursPerWeek}h
          </span>
          {startDate && (
            <>
              <span className={cn('text-xs leading-none shrink-0', isOpen ? 'text-foreground' : 'text-muted-foreground')}>·</span>
              <span className={cn('text-xs leading-none shrink-0 truncate', isOpen ? 'text-foreground' : 'text-muted-foreground')}>
                Starts {formatSeatDate(startDate)}
              </span>
            </>
          )}
        </div>
        {nonBillable && (
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
            NB
          </span>
        )}
      </div>

      {/* Separator — matches bg on open seats (visually flush), neutral on filled */}
      <div className={cn('h-px w-full shrink-0', isOpen ? 'bg-badge-error' : 'bg-border')} />

      {/* Person or Open Seat */}
      <div className="flex items-center gap-2 min-w-0">
        {isOpen ? (
          <span className="text-sm font-medium leading-none text-badge-error-fg">
            Open Seat
          </span>
        ) : (
          <>
            <img
              src={person.avatar}
              alt={person.name}
              className="h-6 w-6 rounded-full object-cover shrink-0"
            />
            <span className="text-sm leading-none text-foreground truncate">
              {abbrevName(person.name)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
