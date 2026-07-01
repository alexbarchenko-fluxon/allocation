import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { type OpenRoleRow } from './lib'

// Flat "all open positions" view — one row per role, aggregated across months.
// Decoupled from the timeline so you can scan how many are open, how old, and where.
const COLUMNS = [
  { id: 'role', label: 'Role', center: false },
  { id: 'open', label: 'Open', center: false },
  { id: 'location', label: 'Location', center: false },
  { id: 'months', label: 'Across', center: true },
  { id: 'age', label: 'Oldest open for', center: false },
]
const FIXED: Record<string, string> = { months: '110px', age: '150px' }

// Location colours are dedicated tokens, deliberately off the status palette.
const LOC_TOKEN: Record<string, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
}

function OpenBadges({ row }: { row: OpenRoleRow }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {row.pending > 0 && <Badge variant="warning">{row.pending} past due</Badge>}
      {row.open > 0 && <Badge variant="blue">{row.open} open</Badge>}
      {row.noReq > 0 && <Badge variant="neutral">{row.noReq} no request</Badge>}
    </div>
  )
}

function LocationCluster({ locs }: { locs: { loc: string; n: number }[] }) {
  if (locs.length === 0) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {locs.map((l) => (
        <span key={l.loc} className="flex items-center gap-1.5 text-sm text-foreground" title={l.loc}>
          <span className="h-2 w-2 rounded-full" style={{ background: LOC_TOKEN[l.loc] ?? 'var(--muted-foreground)' }} />
          {l.n}
        </span>
      ))}
    </div>
  )
}

interface Props {
  rows: OpenRoleRow[]
  onRowClick?: (row: OpenRoleRow) => void
}

export function PositionsFlatTable({ rows, onRowClick }: Props) {
  const cols = COLUMNS
  const cellCls = (idx: number) => cn('h-12 px-3 text-sm', idx > 0 && 'border-l border-border')

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse">
        <colgroup>
          {cols.map((c) => <col key={c.id} style={FIXED[c.id] ? { width: FIXED[c.id] } : undefined} />)}
        </colgroup>
        <thead>
          <tr>
            {cols.map((c, idx) => (
              <th
                key={c.id}
                className={cn(
                  'h-12 bg-primary-foreground text-sm font-medium text-muted-foreground whitespace-nowrap border-b border-border',
                  idx === 0 ? 'pl-4 pr-3 text-left' : 'px-3',
                  idx > 0 && 'border-l border-border',
                  c.center ? 'text-center' : 'text-left',
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.title}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border bg-background transition-colors',
                onRowClick && 'cursor-pointer hover:bg-extended-hover',
              )}
            >
              {cols.map((c, idx) => {
                const cls = cellCls(idx)
                switch (c.id) {
                  case 'role':
                    return (
                      <td key={c.id} className={cn(cls, 'pl-4')}>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{row.title}</span>
                          <span className="text-xs text-muted-foreground">{row.dept}</span>
                        </div>
                      </td>
                    )
                  case 'open':
                    return <td key={c.id} className={cls}><OpenBadges row={row} /></td>
                  case 'location':
                    return <td key={c.id} className={cls}><LocationCluster locs={row.locs} /></td>
                  case 'months':
                    return (
                      <td key={c.id} className={cn(cls, 'text-center text-muted-foreground tabular-nums')}>
                        {row.months} {row.months === 1 ? 'month' : 'months'}
                      </td>
                    )
                  case 'age':
                    return <td key={c.id} className={cn(cls, 'text-muted-foreground')}>{row.oldestAge}</td>
                  default:
                    return null
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
