import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterMultiSelectProps {
  /** Display label when nothing is selected, e.g. "Division", "Team" */
  label: string
  options: FilterOption[]
  /** Currently selected values (empty array = no filter) */
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}

/**
 * A consistent multi-select filter trigger + popover used across all pages.
 *
 * Trigger label rules:
 *  - 0 selected  → shows `label` in muted colour
 *  - 1 selected  → shows the option's display label in foreground colour
 *  - 2+ selected → shows `Label (n)` in foreground colour
 *
 * Dropdown structure:
 *  - "Clear all" row (always first, highlighted primary when active)
 *  - Thin separator (matching column-settings Reset separator style)
 *  - Checkbox option rows
 */
export function FilterMultiSelect({
  label,
  options,
  value,
  onChange,
  className,
}: FilterMultiSelectProps) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const isActive = value.length > 0

  const triggerLabel =
    value.length === 0
      ? label
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? value[0])
        : `${label} (${value.length})`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 justify-between gap-2 font-normal px-3',
            isActive ? 'text-foreground' : 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate text-sm">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto min-w-[160px] p-1.5" align="start">
        {/* Clear all — always present as the first action */}
        <div
          className="flex items-center px-2 py-1.5 rounded-md cursor-pointer select-none hover:bg-accent"
          onClick={() => onChange([])}
        >
          <span
            className={cn(
              'text-sm font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            Clear all
          </span>
        </div>

        {/* Separator — mirrors column-settings "Reset to default" border style */}
        <div className="-mx-1.5 my-1 h-px bg-border" />

        {/* Options */}
        {options.map((opt) => (
          <div
            key={opt.value}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer select-none"
            onClick={() => toggle(opt.value)}
          >
            <Checkbox
              checked={value.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              className="pointer-events-none"
            />
            <span className="text-sm">{opt.label}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
