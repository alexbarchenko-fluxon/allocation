import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  id?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  /** Dates before this date will be disabled. */
  minDate?: Date
  /** Dates after this date will be disabled. */
  maxDate?: Date
  placeholder?: string
  /** date-fns format string for the selected value. Defaults to "MM/dd/yyyy". */
  displayFormat?: string
  error?: boolean
  disabled?: boolean
  className?: string
  /** Which side the calendar opens. Defaults to "bottom". Use "top" inside tall modals. */
  side?: "top" | "bottom" | "left" | "right"
}

function DatePicker({
  id,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "MM/DD/YYYY",
  displayFormat = "MM/dd/yyyy",
  error,
  disabled,
  className,
  side = "bottom",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const disabledMatcher = React.useMemo(() => {
    const matchers: ((date: Date) => boolean)[] = []
    if (minDate) {
      const min = new Date(minDate)
      min.setHours(0, 0, 0, 0)
      matchers.push((d) => {
        const day = new Date(d)
        day.setHours(0, 0, 0, 0)
        return day < min
      })
    }
    if (maxDate) {
      const max = new Date(maxDate)
      max.setHours(0, 0, 0, 0)
      matchers.push((d) => {
        const day = new Date(d)
        day.setHours(0, 0, 0, 0)
        return day > max
      })
    }
    if (matchers.length === 0) return undefined
    return (d: Date) => matchers.some((m) => m(d))
  }, [minDate, maxDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          className={cn(
            "relative flex h-10 w-full items-center rounded-md border border-input bg-[var(--input-bg)] px-3 py-2 pr-10 text-left text-sm shadow-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
        >
          {value ? format(value, displayFormat) : placeholder}
          <CalendarIcon
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side={side} sideOffset={6} collisionPadding={16}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={disabledMatcher}
          defaultMonth={value ?? minDate}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
export type { DatePickerProps }
