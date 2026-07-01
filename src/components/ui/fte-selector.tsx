import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { HOURS_STEP, HOURS_MAX } from "@/lib/staffingUnits"

interface HoursPerWeekInputProps {
  /** Role label displayed at the top of the tile (e.g. "TL", "Eng", "PM"). */
  role: string
  /** Current hours-per-week value. */
  value?: number
  /** Called when the user changes the value via buttons or direct input. */
  onChange?: (value: number) => void
  /** Minimum selectable hours. Defaults to 0. */
  min?: number
  /** Maximum selectable hours. Defaults to HOURS_MAX (200). */
  max?: number
  /**
   * Increment step for the +/− buttons. Defaults to HOURS_STEP (5).
   * Direct keyboard input is clamped and rounded to the nearest whole hour on blur;
   * it is NOT snapped to multiples of step, so typing 7 is valid.
   */
  step?: number
  disabled?: boolean
  className?: string
}

/** Clamp n to [min, max] and round to the nearest whole hour. */
function clampRound(n: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, n)))
}

const HoursPerWeekInput = ({
  role,
  value = 0,
  onChange,
  min = 0,
  max = HOURS_MAX,
  step = HOURS_STEP,
  disabled = false,
  className,
}: HoursPerWeekInputProps) => {
  const [rawVal, setRawVal] = React.useState(String(value))
  const [isFocused, setIsFocused] = React.useState(false)

  React.useEffect(() => {
    if (!isFocused) setRawVal(String(value))
  }, [value, isFocused])

  const decrement = () => {
    if (!disabled && value > min) onChange?.(Math.max(min, value - step))
  }
  const increment = () => {
    if (!disabled && value < max) onChange?.(Math.min(max, value + step))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRawVal(e.target.value.replace(/[^0-9]/g, ""))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") { e.preventDefault(); increment() }
    if (e.key === "ArrowDown") { e.preventDefault(); decrement() }
    if (e.key === "Enter") e.currentTarget.blur()
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setIsFocused(true)
    e.target.select()
  }

  function handleBlur() {
    setIsFocused(false)
    const parsed = parseInt(rawVal, 10)
    if (!isNaN(parsed)) {
      const committed = clampRound(parsed, min, max)
      setRawVal(String(committed))
      onChange?.(committed)
    } else {
      setRawVal(String(value))
    }
  }

  return (
    <div
      className={cn(
        "flex w-[180px] flex-col items-center gap-2 rounded-md border border-border bg-primary-foreground p-4",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span className="text-sm font-medium leading-5 text-foreground">
        {role}
      </span>

      <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-1.5 py-1 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${role} hours`}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-transparent text-foreground",
            "transition-colors hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <input
            type="text"
            inputMode="numeric"
            aria-label={`${role} hours per week`}
            disabled={disabled}
            value={isFocused ? rawVal : String(value)}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-[3ch] min-w-0 bg-transparent text-center text-sm font-normal leading-5 text-muted-foreground",
              "focus:outline-none disabled:cursor-not-allowed"
            )}
          />
          <span className="shrink-0 text-sm font-normal leading-5 text-muted-foreground opacity-50">
            h
          </span>
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={disabled || value >= max}
          aria-label={`Increase ${role} hours`}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-transparent text-foreground",
            "transition-colors hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

HoursPerWeekInput.displayName = "HoursPerWeekInput"

export { HoursPerWeekInput }
export type { HoursPerWeekInputProps }

/** @deprecated Use HoursPerWeekInput instead. */
export const FteSelector = HoursPerWeekInput
/** @deprecated Use HoursPerWeekInputProps instead. */
export type FteSelectorProps = HoursPerWeekInputProps
