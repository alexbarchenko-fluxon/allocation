import { cn } from "@/lib/utils"

/**
 * Switch — an on/off toggle built from tokens. The design system has no Radix
 * Switch primitive; this matches the pattern established in the create dialog.
 */
function Switch({
  checked,
  onCheckedChange,
  className,
  id,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  className?: string
  id?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className,
      )}
    >
      <span className={cn("inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform", checked ? "translate-x-4" : "translate-x-1")} />
    </button>
  )
}

export { Switch }
