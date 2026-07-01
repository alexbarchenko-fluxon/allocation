import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StageSeparatorRow } from '@/components/deals/table/StageSeparatorRow'
import { avatarFor } from '@/lib/positions/avatars'
import { type DeptSection, type PosRow } from './lib'

// Unified column set: open and filled live together, row shows filled/total + status breakdown.
const COLUMNS = [
  { id: 'role', label: 'Role', center: false },
  { id: 'month', label: 'Target month', center: false },
  { id: 'headcount', label: 'Headcount', center: true },
  { id: 'status', label: 'Status', center: false },
  { id: 'people', label: 'People', center: false },
  { id: 'age', label: 'Open for', center: false },
]
const FIXED: Record<string, string> = { headcount: '120px', age: '120px' }

function StatusBadges({ row }: { row: PosRow }) {
  const complete = row.open === 0 && row.pending === 0 && row.filled > 0
  if (complete) return <Badge variant="success">Filled</Badge>
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {row.pending > 0 && <Badge variant="warning">{row.pending} past due</Badge>}
      {row.open > 0 && <Badge variant="blue">{row.open} open</Badge>}
      {row.noReq > 0 && <Badge variant="neutral">{row.noReq} no request</Badge>}
      {row.filled > 0 && (row.open > 0 || row.pending > 0) && <Badge variant="success">{row.filled} filled</Badge>}
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
}

export function PositionsTable({ sections, onRowClick, selectedId }: Props) {
  const cols = COLUMNS
  const count = cols.length

  const [open, setOpen] = useState<Record<string, boolean>>(
    () => Object.fromEntries(sections.map((s) => [s.key, true]))
  )
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !(p[k] ?? true) }))

  const cellCls = (idx: number) => cn('h-10 px-3 text-sm', idx > 0 && 'border-l border-border')

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
          {sections.map((section) => {
            const isOpen = open[section.key] ?? true
            return (
              <React.Fragment key={section.key}>
                <StageSeparatorRow label={section.label} count={section.rows.length} colSpan={count} open={isOpen} onToggle={() => toggle(section.key)} />
                {isOpen && section.rows.map((row) => (
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
                              <span className="font-medium text-muted-foreground"> / {row.total}</span>
                            </td>
                          )
                        case 'status':
                          return <td key={c.id} className={cls}><StatusBadges row={row} /></td>
                        case 'people':
                          return <td key={c.id} className={cls}><PeopleCluster people={row.people} /></td>
                        case 'age':
                          return <td key={c.id} className={cn(cls, 'text-muted-foreground')}>{row.open + row.pending > 0 ? row.age : '—'}</td>
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
  )
}
