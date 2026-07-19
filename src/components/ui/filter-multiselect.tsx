import { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { InputGroup } from '@/components/ui/input-group'
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
  /** Show a search input above the options — for long lists (e.g. clients). */
  searchable?: boolean
  className?: string
}

/**
 * A consistent multi-select filter trigger + popover used across all pages.
 *
 * Trigger label rules:
 *  - 0 selected  → shows `label` in muted colour
 *  - 1 selected  → shows `Label (option)` in foreground colour
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
  searchable,
  className,
}: FilterMultiSelectProps) {
  const [query, setQuery] = useState('')
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const isActive = value.length > 0
  const q = query.trim().toLowerCase()
  const visibleOptions =
    searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options

  const triggerLabel =
    value.length === 0
      ? label
      : value.length === 1
        ? `${label} (${options.find((o) => o.value === value[0])?.label ?? value[0]})`
        : `${label} (${value.length})`

  return (
    <Popover onOpenChange={(open) => { if (!open) setQuery('') }}>
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
        {/* Search — only for long lists. Mirrors the project search field. */}
        {searchable && (
          <>
            <InputGroup
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              wrapperClassName="h-9"
              leftElement={<Search className="h-4 w-4" />}
            />
            <div className="-mx-1.5 my-1 h-px bg-border" />
          </>
        )}

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
        {searchable && visibleOptions.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No results</div>
        )}
        {visibleOptions.map((opt) => (
          <div
            key={opt.value}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer select-none"
            onClick={() => toggle(opt.value)}
          >
            {/* Selection = a plain checkmark; the slot stays reserved so labels
                stay aligned whether or not the option is checked. */}
            <Check
              className={cn(
                'h-4 w-4 shrink-0',
                value.includes(opt.value) ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span className="text-sm">{opt.label}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
