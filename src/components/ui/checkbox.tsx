import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Size, shape & base shadow (Figma: 16×16px, 4px radius, shadow/xs)
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-[4px]",
      "border border-input bg-background shadow-xs",
      // Focus: custom outline ring — no offset, matches Figma focus/default token
      "focus-visible:outline-none focus-visible:shadow-[0px_0px_0px_3px_rgba(163,163,163,0.5)]",
      // Disabled
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Checked: primary fill + matching border
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      {/* h-3 w-3 ≈ 14px — matches Figma icon size within the 16px control */}
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
