import React, { useState } from 'react'
import { Trash2, ClipboardList, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StageSeparatorRow } from '@/components/deals/table/StageSeparatorRow'
import { avatarFor } from '@/lib/positions/avatars'
import { type DeptSection, type PosRow } from './lib'

// Unified column set: open and filled live together, row shows filled/total + status breakdown.
const COLUMNS = [
  { id: 'role', label: 'Role', center: false, sortable: true },
  { id: 'month', label: 'Target month', center: false, sortable: true },
  { id: 'headcount', label: 'Headcount', center: true, sortable: true },
  { id: 'status', label: 'Status', center: false, sortable: true },
  { id: 'location', label: 'Location', center: false, sortable: true },
  { id: 'people', label: 'People', center: false, sortable: true },
  { id: 'age', label: 'Open for', center: false, sortable: true },
  { id: 'notes', label: 'Notes', center: false, sortable: false },
  { id: 'settings', label: 'Actions', center: false, sortable: false },
]
const FIXED: Record<string, string> = { headcount: '120px', age: '120px', notes: '80px', settings: '76px' }

// Location colours are dedicated tokens, deliberately off the status palette.
const LOC_TOKEN: Record<string, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
}

// Sort key per column. Strings sort alphabetically, numbers numerically.
function sortValue(row: PosRow, col: string): string | number {
  switch (col) {
    case 'role': return row.title
    case 'month': return row.mk
    case 'headcount': return row.total
    case 'status': return row.open + row.pending
    case 'location': return row.locs.reduce((s, l) => s + l.n, 0)
    case 'people': return row.people.length
    case 'age': return row.ageDays
    default: return 0
  }
}

function StatusBadges({ row }: { row: PosRow }) {
  const complete = row.open === 0 && row.pending === 0 && row.filled > 0
  if (complete) return <Badge variant="success">Filled</Badge>
  // "Open" = recruiting (request exists). No-request positions are their own state.
  const openWithReq = Math.max(0, row.open - row.noReq)
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {row.pending > 0 && <Badge variant="warning">{row.pending} past due</Badge>}
      {openWithReq > 0 && <Badge variant="outline" className="border-transparent bg-electric-blue-50 text-foreground">{openWithReq} open</Badge>}
      {row.noReq > 0 && <Badge variant="neutral">{row.noReq} no request</Badge>}
      {row.reopened && <Badge variant="outline" title={row.reopenedFrom}>Reopened</Badge>}
      {row.filled > 0 && (row.open > 0 || row.pending > 0) && <Badge variant="success">{row.filled} filled</Badge>}
    </div>
  )
}

function LocationCluster({ locs }: { locs: { loc: string; n: number }[] }) {
  if (locs.length === 0) return <span className="text-sm text-muted-foreground">—</span>
  // Bordered pill per location: 12px count circle + name (Figma 286-27503).
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {locs.map((l) => (
        <span key={l.loc} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
          <span
            className="flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[8px] font-medium leading-3 text-white tabular-nums"
            style={{ background: LOC_TOKEN[l.loc] ?? 'var(--muted-foreground)' }}
          >
            {l.n}
          </span>
          {l.loc}
        </span>
      ))}
    </div>
  )
}

// Overlapping avatar cluster — mirrors People AvatarStack (ring, overlap, +N pill).
function PeopleCluster({ people }: { people: { name: string }[] }) {
  if (people.length === 0) return <span className="text-sm text-muted-foreground">—</span>
  const MAX = 4
  const shown = people.slice(0, MAX)
  const extra = people.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <img
          key={i}
          src={avatarFor(p.name)}
          alt={p.name}
          title={p.name}
          className="h-6 w-6 -mr-1.5 rounded-full object-cover ring-2 ring-background shrink-0"
          style={{ zIndex: shown.length - i }}
        />
      ))}
      {extra > 0 && (
        <span className="h-6 min-w-6 px-1 -mr-1.5 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0" style={{ zIndex: 0 }}>
          +{extra}
        </span>
      )}
    </div>
  )
}

interface Props {
  sections: DeptSection[]
  onRowClick: (row: PosRow) => void
  selectedId?: string | null
  onRowClose?: (row: PosRow) => void
}

export function PositionsTable({ sections, onRowClick, selectedId, onRowClose }: Props) {
  const cols = COLUMNS
  const count = cols.length

  const [open, setOpen] = useState<Record<string, boolean>>(
    () => Object.fromEntries(sections.map((s) => [s.key, true]))
  )
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !(p[k] ?? true) }))

  // Sort state cycles asc → desc → off per column.
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null)
  const onSort = (col: string) =>
    setSort((s) => (s && s.col === col ? (s.dir === 'asc' ? { col, dir: 'desc' } : null) : { col, dir: 'asc' }))
  const sortRows = (rows: PosRow[]) => {
    if (!sort) return rows
    const { col, dir } = sort
    return [...rows].sort((a, b) => {
      const av = sortValue(a, col), bv = sortValue(b, col)
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number)
      return dir === 'asc' ? cmp : -cmp
    })
  }

  const cellCls = (idx: number) => cn('h-12 px-3 text-sm', idx > 0 && 'border-l border-border')

  return (
    <TooltipProvider delayDuration={150}>
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse">
        <colgroup>
          {cols.map((c) => <col key={c.id} style={FIXED[c.id] ? { width: FIXED[c.id] } : undefined} />)}
        </colgroup>
        <thead>
          <tr>
            {cols.map((c, idx) => {
              const active = sort?.col === c.id
              return (
                <th
                  key={c.id}
                  className={cn(
                    'h-12 bg-primary-foreground text-sm font-medium text-muted-foreground whitespace-nowrap border-b border-border',
                    idx === 0 ? 'pl-4 pr-3 text-left' : 'px-3',
                    idx > 0 && 'border-l border-border',
                    c.center ? 'text-center' : 'text-left',
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(c.id)}
                      className={cn('inline-flex items-center gap-1 transition-colors hover:text-foreground', c.center && 'justify-center', active && 'text-foreground')}
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
          {sections.map((section) => {
            const isOpen = open[section.key] ?? true
            return (
              <React.Fragment key={section.key}>
                <StageSeparatorRow
                  label={section.label}
                  count={section.rows.length}
                  colSpan={count}
                  open={isOpen}
                  onToggle={() => toggle(section.key)}
                  badge={(() => {
                    const f = section.rows.reduce((n, r) => n + r.filled, 0)
                    const o = section.rows.reduce((n, r) => n + r.open + r.pending, 0)
                    return (
                      <span className="ml-1 whitespace-nowrap rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
                        {`${f} filled · ${o} open`}
                      </span>
                    )
                  })()}
                />
                {isOpen && sortRows(section.rows).map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick(row)}
                    className={cn(
                      'cursor-pointer transition-colors border-b border-border',
                      row.id === selectedId ? 'bg-extended-hover' : 'bg-background hover:bg-extended-hover',
                    )}
                  >
                    {cols.map((c, idx) => {
                      const cls = cellCls(idx)
                      switch (c.id) {
                        case 'role':
                          return (
                            <td key={c.id} className={cn(cls, 'pl-4')}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{row.title}</span>
                              </div>
                            </td>
                          )
                        case 'month':
                          return <td key={c.id} className={cls}>{row.monthLabel}</td>
                        case 'headcount':
                          return (
                            <td key={c.id} className={cn(cls, 'text-center tabular-nums')}>
                              <span className="font-medium text-foreground">{row.filled}</span>
                              <span className="font-medium text-muted-foreground">/{row.total}</span>
                            </td>
                          )
                        case 'status':
                          return <td key={c.id} className={cls}><StatusBadges row={row} /></td>
                        case 'location':
                          return <td key={c.id} className={cls}><LocationCluster locs={row.locs} /></td>
                        case 'people':
                          return <td key={c.id} className={cls}><PeopleCluster people={row.people} /></td>
                        case 'age':
                          return <td key={c.id} className={cn(cls, 'text-muted-foreground')}>{row.open + row.pending > 0 ? row.age : '—'}</td>
                        case 'notes':
                          return (
                            <td key={c.id} className={cls}>
                              {row.notes > 0 && (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <ClipboardList className="h-4 w-4" />
                                  <span className="text-xs tabular-nums">{row.notes}</span>
                                </span>
                              )}
                            </td>
                          )
                        case 'settings':
                          return (
                            <td key={c.id} className={cls}>
                              {row.open + row.pending > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); onRowClose?.(row) }}
                                      aria-label={`Close ${row.title}`}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-badge-error-fg"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Close position — reason required</TooltipContent>
                                </Tooltip>
                              )}
                            </td>
                          )
                        default:
                          return null
                      }
                    })}
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
  )
}
