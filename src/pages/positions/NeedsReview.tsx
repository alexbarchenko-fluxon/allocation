import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type ReviewItem } from './lib'

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
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse">
        <colgroup>
          <col /><col style={{ width: '150px' }} /><col style={{ width: '160px' }} /><col style={{ width: '120px' }} /><col style={{ width: '180px' }} />
        </colgroup>
        <thead>
          <tr>
            {['Role', 'Target month', 'Status', 'Open for', ''].map((h, idx) => (
              <th
                key={h || 'actions'}
                className={cn(
                  'h-12 bg-primary-foreground text-sm font-medium text-muted-foreground whitespace-nowrap border-b border-border text-left',
                  idx === 0 ? 'pl-4 pr-3' : 'px-3',
                  idx > 0 && idx < 4 && 'border-l border-border',
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
                <span className="inline-flex items-center gap-2">
                  {item.n > 1 && <Badge variant="neutral" className="tabular-nums">{item.n}</Badge>}
                  {item.title}
                </span>
              </td>
              <td className={cell(1)}>{item.monthLabel}</td>
              <td className={cell(2)}>
                {item.kind === 'noreq'
                  ? <Badge variant="neutral">No request</Badge>
                  : <Badge variant="warning">Past due</Badge>}
              </td>
              <td className={cn(cell(3), 'text-muted-foreground')}>{item.age}</td>
              <td className="h-12 px-3 pr-4 text-sm">
                <div className="flex items-center justify-end gap-2">
                  {item.kind === 'noreq' && (
                    <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenRequest(item)}>Open request</Button>
                  )}
                  {/* Trash is always the rightmost element, aligned across rows — same as the
                      Positions table's trailing Settings column. Past-due rows: Close only. */}
                  <button
                    type="button"
                    onClick={() => onClose(item)}
                    aria-label={`Close ${item.title}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-badge-error-fg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
