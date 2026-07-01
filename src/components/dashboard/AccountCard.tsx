import { NotepadText } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AccountCardVariant = 'default' | 'soon' | 'ending'
export type ContractType = 'T&M' | 'Fixed'

export interface AccountCardProps {
  client: string
  name: string
  dates: string
  contractType: ContractType
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
        'h-full flex bg-background hover:bg-extended-hover cursor-pointer transition-colors',
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
          <p className="text-xs text-muted-foreground leading-4">{client}</p>
          <p className="text-base font-medium text-foreground leading-6 truncate">{name}</p>
          <p className="text-xs text-muted-foreground leading-4 py-1">{dates}</p>
        </div>

        {/* Bottom: badges + notes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Contract type: T&M or Fixed */}
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground">
              {contractType}
            </span>

            {/* Timeline status badge */}
            {variant === 'soon' && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-badge-warning text-badge-warning-fg border border-badge-warning-stroke">
                Starting Soon
              </span>
            )}
            {variant === 'ending' && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-badge-warning text-badge-warning-fg border border-badge-warning-stroke">
                Ending Soon
              </span>
            )}
          </div>

          {/* Notes count */}
          {notesCount !== undefined && notesCount > 0 && (
            <div className="flex items-center gap-1.5 pl-6 pr-2 py-1.5 opacity-50">
              <NotepadText className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{notesCount}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
