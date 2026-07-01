import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StageSeparatorRowProps {
  label: string
  count: number
  colSpan: number
  open: boolean
  onToggle: () => void
}

export function StageSeparatorRow({ label, count, colSpan, open, onToggle }: StageSeparatorRowProps) {
  return (
    <tr className={cn('bg-muted', !open && 'border-b border-border')}>
      <td colSpan={colSpan} className="p-0 h-9">
        <button
          onClick={onToggle}
          className="w-full h-full flex items-center pl-1.5 hover:bg-muted/80 transition-colors"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-md shrink-0">
            <ChevronDown
              className={cn('h-4 w-4 text-foreground transition-transform', !open && '-rotate-90')}
            />
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-foreground">
            <span>{label}</span>
            <span>({count})</span>
          </span>
        </button>
      </td>
    </tr>
  )
}
