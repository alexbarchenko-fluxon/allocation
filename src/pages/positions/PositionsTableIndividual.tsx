import { useState } from 'react'
import { Trash2, Zap, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { avatarFor } from '@/lib/positions/avatars'
import { type IndividualRow } from './lib'

// AJ's proposal, behind the third scope pill: a flat list at individual grain —
// one row per position record. No aggregates, so "Open for" and "Person" are
// exact per row; Plan keeps the month-grain summary.
const COLUMNS = [
  { id: 'role', label: 'Role', sortable: true },
  { id: 'month', label: 'Target month', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'location', label: 'Location', sortable: true },
  { id: 'person', label: 'Person', sortable: true },
  { id: 'age', label: 'Open for', sortable: true },
  { id: 'settings', label: 'Actions', sortable: false },
]
const FIXED: Record<string, string> = { age: '120px', settings: '96px' }

// Location colours are dedicated tokens, deliberately off the status palette.
const LOC_TOKEN: Record<string, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
}

const STATUS_ORDER: Record<string, number> = { pastdue: 0, noreq: 1, open: 2, accepted: 3, started: 4 }

function sortValue(row: IndividualRow, col: string): string | number {
  switch (col) {
    case 'role': return row.title
    case 'month': return row.mk
    case 'status': return STATUS_ORDER[row.status] ?? 9
    case 'location': return row.loc
    case 'person': return row.person?.name ?? ''
    case 'age': return row.ageDays
    default: return 0
  }
}

function StatusBadge({ row }: { row: IndividualRow }) {
  switch (row.status) {
    case 'started': return <Badge variant="success">On staff</Badge>
    case 'accepted': return <Badge variant="success">Offer accepted</Badge>
    case 'pastdue':
      return (
        <Tooltip>
          <TooltipTrigger asChild><span><Badge variant="warning" className="whitespace-nowrap">Past due</Badge></span></TooltipTrigger>
          <TooltipContent className="max-w-[260px]">Target month has passed. The request stays open — hiring is just delayed. Close it if no longer needed.</TooltipContent>
        </Tooltip>
      )
    case 'noreq':
      return (
        <span className="inline-flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild><span><Badge variant="neutral" className="whitespace-nowrap">No request</Badge></span></TooltipTrigger>
            <TooltipContent className="max-w-[260px]">No hiring request yet — nothing is being recruited until one is opened.</TooltipContent>
          </Tooltip>
          {row.reopened && (
            <Tooltip>
              <TooltipTrigger asChild><span><Badge variant="outline" className="whitespace-nowrap">Reopened</Badge></span></TooltipTrigger>
              <TooltipContent className="max-w-[260px]">{row.reopenedFrom ? `${row.reopenedFrom}.` : 'Reopened after the previous person left the role.'}</TooltipContent>
            </Tooltip>
          )}
        </span>
      )
    default:
      return <Badge variant="outline" className="whitespace-nowrap border-transparent bg-electric-blue-50 text-foreground">Open</Badge>
  }
}

interface Props {
  rows: IndividualRow[]
  onRowClick: (row: IndividualRow) => void
  selectedRowId?: string | null            // parent rowId — highlights all records of the open cell
  onClose?: (row: IndividualRow) => void
  onOpenRequest?: (row: IndividualRow) => void
}

export function PositionsTableIndividual({ rows, onRowClick, selectedRowId, onClose, onOpenRequest }: Props) {
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null)
  const onSort = (col: string) =>
    setSort((s) => (s && s.col === col ? (s.dir === 'asc' ? { col, dir: 'desc' } : null) : { col, dir: 'asc' }))
  const sorted = (() => {
    if (!sort) return rows
    const { col, dir } = sort
    return [...rows].sort((a, b) => {
      const av = sortValue(a, col), bv = sortValue(b, col)
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number)
      return dir === 'asc' ? cmp : -cmp
    })
  })()

  const cellCls = (idx: number) => cn('h-12 px-3 text-sm', idx > 0 && 'border-l border-border')

  return (
    <TooltipProvider delayDuration={150}>
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse">
        <colgroup>
          {COLUMNS.map((c) => <col key={c.id} style={FIXED[c.id] ? { width: FIXED[c.id] } : undefined} />)}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((c, idx) => {
              const active = sort?.col === c.id
              return (
                <th
                  key={c.id}
                  className={cn(
                    'h-12 bg-primary-foreground text-sm font-medium text-muted-foreground whitespace-nowrap border-b border-border text-left',
                    idx === 0 ? 'pl-4 pr-3' : 'px-3',
                    idx > 0 && 'border-l border-border',
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.id)}
                      className={cn('inline-flex items-center gap-1 transition-colors hover:text-foreground', active && 'text-foreground')}
                    >
                      {c.label}
                      {active
                        ? (sort!.dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />)
                        : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row)}
              className={cn(
                'cursor-pointer transition-colors border-b border-border',
                row.rowId === selectedRowId ? 'bg-extended-hover' : 'bg-background hover:bg-extended-hover',
              )}
            >
              {COLUMNS.map((c, idx) => {
                const cls = cellCls(idx)
                switch (c.id) {
                  case 'role':
                    return (
                      <td key={c.id} className={cn(cls, 'pl-4')}>
                        <div className="flex flex-col justify-center">
                          <span className="font-medium text-foreground">{row.title}</span>
                          <span className="text-xs text-muted-foreground">{row.dept}</span>
                        </div>
                      </td>
                    )
                  case 'month':
                    return <td key={c.id} className={cls}>{row.monthLabel}</td>
                  case 'status':
                    return <td key={c.id} className={cls}><StatusBadge row={row} /></td>
                  case 'location':
                    return (
                      <td key={c.id} className={cls}>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LOC_TOKEN[row.loc] ?? 'var(--muted-foreground)' }} />
                          {row.loc}
                        </span>
                      </td>
                    )
                  case 'person':
                    return (
                      <td key={c.id} className={cls}>
                        {row.person ? (
                          <span className="inline-flex items-center gap-2">
                            <img src={avatarFor(row.person.name)} alt={row.person.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                            <span className="whitespace-nowrap text-foreground">{row.person.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )
                  case 'age':
                    return <td key={c.id} className={cn(cls, 'text-muted-foreground')}>{row.age}</td>
                  case 'settings':
                    return (
                      <td key={c.id} className={cls}>
                        <div className="flex items-center gap-1">
                          {row.status === 'noreq' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onOpenRequest?.(row) }}
                                  aria-label={`Open request for ${row.title}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-extended-hover hover:text-foreground"
                                >
                                  <Zap className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Open a hiring request</TooltipContent>
                            </Tooltip>
                          )}
                          {(row.status === 'open' || row.status === 'pastdue' || row.status === 'noreq') && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onClose?.(row) }}
                                  aria-label={`Close ${row.title}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-badge-error-fg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Close position — reason required</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    )
                  default:
                    return null
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  )
}
