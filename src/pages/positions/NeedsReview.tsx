import { Trash2, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { type ReviewItem } from './lib'

// Location colours are dedicated tokens, deliberately off the status palette.
const LOC_TOKEN: Record<string, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
}

interface Props {
  items: ReviewItem[]
  onOpenRequest: (item: ReviewItem) => void
  onClose: (item: ReviewItem) => void
}

export function NeedsReview({ items, onOpenRequest, onClose }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">Nothing needs review</p>
        <p className="text-sm text-muted-foreground mt-1">Past due and no-request positions show up here for a decision.</p>
      </div>
    )
  }

  const cell = (idx: number) => cn('h-12 px-3 text-sm', idx > 0 && 'border-l border-border')

  return (
    <TooltipProvider delayDuration={150}>
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse">
        <colgroup>
          <col /><col style={{ width: '150px' }} /><col style={{ width: '150px' }} /><col style={{ width: '160px' }} /><col style={{ width: '120px' }} /><col style={{ width: '180px' }} />
        </colgroup>
        <thead>
          <tr>
            {['Role', 'Target month', 'Location', 'Status', 'Open for', 'Actions'].map((h, idx) => (
              <th
                key={h}
                className={cn(
                  'h-12 bg-primary-foreground text-sm font-medium text-muted-foreground whitespace-nowrap border-b border-border text-left',
                  idx === 0 ? 'pl-4 pr-3' : 'px-3',
                  idx > 0 && 'border-l border-border',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border bg-background hover:bg-extended-hover transition-colors">
              <td className={cn(cell(0), 'pl-4 font-medium text-foreground')}>
                {/* Count moved into the Location pill — no duplicate badge here. */}
                {item.title}
              </td>
              <td className={cell(1)}>{item.monthLabel}</td>
              <td className={cell(2)}>
                {/* Same bordered location pill as the Positions table (Figma 286-27503). */}
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
                  <span
                    className="flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[8px] font-medium leading-none text-white tabular-nums"
                    style={{ background: LOC_TOKEN[item.loc] ?? 'var(--muted-foreground)' }}
                  >
                    {item.n}
                  </span>
                  {item.loc === 'Unassigned' ? 'Anywhere' : item.loc}
                </span>
              </td>
              <td className={cell(3)}>
                <span className="flex items-center gap-1.5">
                  {item.kind === 'noreq'
                    ? <Badge variant="neutral">No request</Badge>
                    : <Badge variant="warning">Past due</Badge>}
                  {item.reopened && <Badge variant="outline">Reopened</Badge>}
                </span>
              </td>
              <td className={cn(cell(4), 'text-muted-foreground')}>{item.age}</td>
              <td className={cell(5)}>
                <div className="flex items-center justify-end gap-2">
                  {item.kind === 'noreq' && (
                    // Zap = "send to Spark", the metaphor the create dialog already established.
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onOpenRequest(item)}
                          aria-label={`Open request for ${item.title}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-electric-blue-50 hover:text-electric-blue-600"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Open hiring request — sends to Spark</TooltipContent>
                    </Tooltip>
                  )}
                  {/* Trash is always the rightmost element, aligned across rows — same as the
                      Positions table's trailing Settings column. Past-due rows: Close only. */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onClose(item)}
                        aria-label={`Close ${item.title}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-badge-error-fg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Close position — reason required</TooltipContent>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  )
}
