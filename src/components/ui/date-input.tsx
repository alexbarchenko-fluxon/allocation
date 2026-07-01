import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface DateInputProps extends React.ComponentProps<"input"> {
  /** Renders the border and ring in destructive colour when true. */
  error?: boolean
}

/**
 * DateInput — a text input with a calendar icon adornment.
 *
 * Intentionally kept as a plain text input for now (no picker logic).
 * The `type="text"` allows full cross-browser control over the placeholder
 * format until a real date-picker is wired up.
 */
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="relative">
      <input
        type="text"
        placeholder="MM/DD/YYYY"
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-base ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          error &&
            "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
      <CalendarIcon
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
)

DateInput.displayName = "DateInput"

export { DateInput }
export type { DateInputProps }
