import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        /* ── Status badge variants (Figma: badges group) ──────────────────── */
        success: "bg-badge-success border-badge-success-stroke text-badge-success-fg",
        warning: "bg-badge-warning border-badge-warning-stroke text-badge-warning-fg",
        error:   "bg-badge-error   border-badge-error-stroke   text-badge-error-fg",
        neutral: "bg-badge-neutral border-badge-neutral-stroke text-badge-neutral-fg",
        blue:    "bg-badge-blue    border-badge-blue-stroke    text-badge-blue-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
