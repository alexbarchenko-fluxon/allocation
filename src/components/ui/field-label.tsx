import * as React from "react"
import { HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  /** Mark the field as required — renders a red asterisk. */
  required?: boolean
  /** Appends "• optional" in muted-foreground after the label text. */
  optional?: boolean
  /** Short hint text shown in a native tooltip on the help icon. */
  hint?: string
}

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FieldLabelProps
>(({ className, children, required, optional, hint, ...props }, ref) => (
  <div className="flex items-center gap-0">
    <Label
      ref={ref}
      className={cn("text-xs font-medium leading-none", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </Label>
    {optional && (
      <>
        <span className="mx-1.5 text-muted-foreground opacity-80 leading-none" aria-hidden="true">•</span>
        <span className="text-xs text-muted-foreground opacity-80 leading-none font-medium">optional</span>
      </>
    )}
    {hint && (
      <button
        type="button"
        className="ml-1.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={hint}
        aria-label={`Help: ${hint}`}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    )}
  </div>
))

FieldLabel.displayName = "FieldLabel"

export { FieldLabel }
export type { FieldLabelProps }
