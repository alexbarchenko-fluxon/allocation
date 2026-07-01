import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface MainNavButtonProps {
  label: string
  href: string
  isActive?: boolean
  className?: string
}

export const MainNavButton = React.forwardRef<
  HTMLAnchorElement,
  MainNavButtonProps
>(({ label, href, isActive = false, className }, ref) => {
  return (
    <Link
      ref={ref}
      to={href}
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 h-9",
        "text-sm font-medium transition-colors",
        "rounded-full",
        isActive
          ? "bg-background text-accent-foreground border border-border"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {label}
    </Link>
  )
})

MainNavButton.displayName = "MainNavButton"
