import { Plus, MessageSquareText } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AccountCardVariant = 'default' | 'soon' | 'ending'
export type ContractType = 'T&M' | 'Fixed'

export interface AccountCardProps {
  client: string
  name: string
  dates: string
  /** Contract tag (T&M / Fixed). Omit to render the card without a tag. */
  contractType?: ContractType
  variant?: AccountCardVariant
  notesCount?: number
  className?: string
  onClick?: () => void
}

export function AccountCard({
  client,
  name,
  dates,
  contractType,
  variant = 'default',
  notesCount,
  className,
  onClick,
}: AccountCardProps) {
  const hasAlert = variant === 'soon' || variant === 'ending'

  return (
    <div
      className={cn(
        'group h-full flex bg-background hover:bg-extended-hover cursor-pointer transition-colors',
        className,
      )}
      onClick={onClick}
    >
      {/* Left colour bar — green for default, orange for soon/ending */}
      <div
        className={cn(
          'w-1.5 flex-shrink-0',
          hasAlert ? 'bg-badge-warning' : 'bg-badge-success',
        )}
      />

      {/* Main content */}
      <div className="flex flex-col justify-between flex-1 min-w-0 p-4">

        {/* Top section */}
        <div className="flex flex-col gap-1">
          {/* Client + add position */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground leading-4">{client}</p>
            <button
              type="button"
              aria-label="Add position"
              onClick={(e) => e.stopPropagation()}
              className="-my-1 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <p className="text-base font-medium text-foreground leading-6 truncate">{name}</p>
          <p className="text-xs text-muted-foreground leading-4 py-1">{dates}</p>

          {/* Contract type — shown on some cards only (indigo info badge) */}
          {contractType && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {contractType}
              </span>
            </div>
          )}
        </div>

        {/* Notes count — pinned bottom-right */}
        {notesCount !== undefined && notesCount > 0 && (
          <div className="flex justify-end">
            <div className="flex items-center gap-1 rounded bg-blue-50 pl-1 pr-1.5 py-1 dark:bg-blue-950">
              <MessageSquareText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-300">{notesCount}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
