import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

export interface SegmentedOption {
  value: string
  label: string
  disabled?: boolean
}

interface SegmentedControlProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** The list of options to render as segments. */
  options: SegmentedOption[]
}

/**
 * SegmentedControl — a pill-shaped single-select control built on Radix
 * RadioGroup. Designed for short option sets like P0 / P1 / P2.
 *
 * Semantics: behaves as a radio group so screen readers announce the selection
 * correctly. The visual indicator is rendered as a background highlight on the
 * active segment.
 */
const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  SegmentedControlProps
>(({ className, options, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex rounded-lg border border-border bg-muted p-1 gap-0.5",
      className
    )}
    {...props}
  >
    {options.map((option) => (
      <RadioGroupPrimitive.Item
        key={option.value}
        value={option.value}
        disabled={option.disabled}
        aria-label={option.label}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-all select-none",
          "text-muted-foreground",
          "hover:text-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-muted",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm"
        )}
      >
        {option.label}
        {/* Hidden Radix indicator — visual state is driven by data-[state] above */}
        <RadioGroupPrimitive.Indicator className="sr-only" />
      </RadioGroupPrimitive.Item>
    ))}
  </RadioGroupPrimitive.Root>
))

SegmentedControl.displayName = "SegmentedControl"

export { SegmentedControl }
export type { SegmentedControlProps }
