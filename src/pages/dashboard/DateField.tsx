import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { fmtDate } from './format'

/** "2026-11-15" → local Date (no UTC shift). */
function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** local Date → "2026-11-15". */
function dateToIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Editable date field used in the sidebar + modal — shows a formatted date with
 * an optional leading calendar glyph, styled like the design system's input.
 * Clicking opens a calendar popover seeded with the current (dummy) date; picking
 * a day updates the field. State is held locally so the prototype is editable
 * out of the box; pass `onChange` to also lift the new ISO value to a parent.
 */
export function DateField({
  iso, className, onChange, icon = true, min, max,
}: {
  iso: string
  className?: string
  onChange?: (iso: string) => void
  icon?: boolean
  /** Earliest selectable day (inclusive) — days before it are disabled. */
  min?: string
  /** Latest selectable day (inclusive) — days after it are disabled. */
  max?: string
}) {
  const [value, setValue] = useState(iso)
  // Reset when the seed changes (e.g. the panel switches to another seat) —
  // derived-state-during-render pattern, no effect needed.
  const [prevIso, setPrevIso] = useState(iso)
  if (iso !== prevIso) {
    setPrevIso(iso)
    setValue(iso)
  }

  const [open, setOpen] = useState(false)
  const selected = isoToDate(value)

  // Clamp the calendar to [min, max] — days outside the seat window are greyed
  // out and unselectable (react-day-picker `before`/`after` matchers).
  const disabled = [
    ...(min ? [{ before: isoToDate(min) }] : []),
    ...(max ? [{ after: isoToDate(max) }] : []),
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-md border border-input bg-[var(--input-bg)] px-2.5 text-sm text-foreground shadow-sm transition-colors hover:bg-extended-hover',
            className,
          )}
        >
          {icon && <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{fmtDate(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={6} collisionPadding={16}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={disabled.length ? disabled : undefined}
          onSelect={(date) => {
            if (!date) return
            const next = dateToIso(date)
            setValue(next)
            onChange?.(next)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
