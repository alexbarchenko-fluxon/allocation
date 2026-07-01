import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

/**
 * RadioCardGroup — wraps Radix RadioGroup.Root with a flex-wrap layout
 * suitable for card-style option grids.
 *
 * Figma: RadioGroup container uses gap-2 (8px) between cards.
 * Consumers can override layout with className (e.g. grid grid-cols-3 gap-2).
 */
const RadioCardGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-wrap gap-2", className)}
    {...props}
  />
))
RadioCardGroup.displayName = "RadioCardGroup"

interface RadioCardItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Primary label text. */
  label: string
  /** Optional secondary description rendered below the label. */
  description?: string
  /**
   * Compact layout variant — radio circle on top, label below, smaller
   * padding (p-3) and text size (text-xs). Used in narrow contexts such as
   * the Deal details sidebar where horizontal space is limited.
   * Figma: 571:17827 (Deal type) / 571:17859 (Win probability)
   */
  compact?: boolean
}

/**
 * RadioCardItem — a card-style radio button.
 *
 * Figma spec (node 447:18917, type=Box):
 * - Layout: flex-row, gap-3 (12px), items-start, p-4 (16px), rounded-lg (10px)
 * - Border: 1px solid border-border (#e5e7eb) — same in default AND selected
 * - Default bg: transparent
 * - Selected bg: bg-primary-foreground (#f9fafb) — no border-color change
 * - Radio indicator: 16px circle, white bg, border-input, shadow-xs (left-aligned)
 * - Inner dot (selected only): 8px circle, bg-primary (#0e35ff)
 * - Label: text-sm font-medium text-foreground
 * - Description: text-sm font-normal text-muted-foreground, 6px below label
 * - Optical alignment: text column has pt-px to align baseline with circle center
 *
 * compact=true (Figma 571:17827):
 * - Layout: flex-col, gap-1 (4px), p-3 (12px), rounded-lg
 * - Radio circle on top; label text-xs below
 */
const RadioCardItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardItemProps
>(({ className, label, description, compact, id, ...props }, ref) => {
  const generatedId = React.useId()
  const itemId = id ?? generatedId

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={itemId}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-[var(--input-bg)] shadow-sm text-left transition-colors",
        "hover:bg-accent/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary-foreground",
        compact
          ? "flex flex-col items-start gap-1 p-3"
          : "flex items-start gap-3 p-4",
        className
      )}
      {...props}
    >
      {/* Radio circle */}
      <div
        className={cn(
          "relative flex h-4 w-4 shrink-0 items-center justify-center",
          "rounded-full border border-border bg-[var(--input-bg)]",
          "shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
          !compact && "mt-px"
        )}
        aria-hidden="true"
      >
        <RadioGroupPrimitive.Indicator>
          <div className="h-2 w-2 rounded-full bg-primary" />
        </RadioGroupPrimitive.Indicator>
      </div>

      {/* Text column */}
      <div className={cn("flex min-w-0 flex-col", !compact && "flex-1 pt-px")}>
        <span
          className={cn(
            "font-medium leading-none text-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {label}
        </span>
        {!compact && description && (
          <span className="mt-1.5 text-sm font-normal leading-5 text-muted-foreground">
            {description}
          </span>
        )}
      </div>
    </RadioGroupPrimitive.Item>
  )
})
RadioCardItem.displayName = "RadioCardItem"

export { RadioCardGroup, RadioCardItem }
export type { RadioCardItemProps }
