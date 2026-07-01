import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * InputGroup — a flex wrapper that renders like a single input field but
 * supports arbitrary left/right inline addons (icons, buttons, labels, etc.).
 *
 * The border and focus ring live on the wrapper; the native <input> inside
 * has no border of its own. Pass `rightElement` or `leftElement` to slot in
 * icons or small interactive controls.
 *
 * Usage:
 *   <InputGroup rightElement={<Info className="h-4 w-4" />} placeholder="…" />
 */
interface InputGroupProps extends React.ComponentProps<"input"> {
  /** Content rendered to the left of the input (icon, button, text, …). */
  leftElement?: React.ReactNode
  /** Content rendered to the right of the input (icon, button, text, …). */
  rightElement?: React.ReactNode
  /** Renders the border and focus ring in destructive colour when true. */
  error?: boolean
  /** Extra classes applied to the outer wrapper div. */
  wrapperClassName?: string
}

const InputGroup = React.forwardRef<HTMLInputElement, InputGroupProps>(
  (
    { leftElement, rightElement, error, className, wrapperClassName, ...props },
    ref
  ) => (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-[var(--input-bg)] px-3 py-2",
        "shadow-sm ring-offset-background transition-shadow",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        error &&
          "border-destructive focus-within:ring-destructive",
        wrapperClassName
      )}
    >
      {leftElement && (
        <span className="shrink-0 text-muted-foreground">{leftElement}</span>
      )}
      <input
        ref={ref}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-base outline-none",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        {...props}
      />
      {rightElement && (
        <span className="shrink-0 text-muted-foreground">{rightElement}</span>
      )}
    </div>
  )
)

InputGroup.displayName = "InputGroup"

export { InputGroup }
export type { InputGroupProps }
