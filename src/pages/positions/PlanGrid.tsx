import React, { useState } from 'react'
import { Plus, Check, ChevronDown, History, Flag, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { monthLabel, CURRENT_KEY } from '@/lib/positions/time'
import { type GridRow } from './lib'
import { SearchEmpty } from './EmptyState'

// Same families as the metric-bar segments so "filled/open/past due/no request"
// is one colour language everywhere. gray-400 (not 300) for the tiny dots — the
// bar's gray-300 is too faint at 6px on tinted cells.
const DOT: Record<string, string> = {
  started: 'var(--seg-filled)',
  accepted: 'var(--seg-filled)',
  pending: 'var(--seg-pastdue)',
  open: 'var(--seg-open)',
  noreq: '#9ca3af',
}

// Solid dots, differentiated by the laddered status colours (teal / blue-300 /
// orange-500 / gray-400). Lightness spacing keeps the mix readable under CVD and
// in grayscale; the hollow-ring variant was tested and dropped for a calmer look
// (comparison evidence in the a11y review set).
function Dots({ dots, max = 7 }: { dots: { status: string }[]; max?: number }) {
  const shown = dots.slice(0, max)
  const extra = dots.length - shown.length
  return (
    <div className="flex items-center gap-1 justify-center mt-1.5">
      {shown.map((d, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[d.status] ?? 'var(--muted-foreground)' }} />
      ))}
      {extra > 0 && <span className="text-[10px] text-muted-foreground leading-none ml-0.5">+{extra}</span>}
    </div>
  )
}

interface Props {
  groups: { dept: string; rows: GridRow[] }[]
  rollups: { dept: string; filled: number; open: number; roleRollups: Record<string, { filled: number; open: number }> }[]
  months: string[]
  search: string
  onCellClick: (title: string, mk: string) => void
  onCreate: (title: string, mk: string) => void
}

const ROLE_W = 240
const ROW_CAP = 6 // "+N more" beyond this many rows per dept

export function PlanGrid({ groups, rollups, months, search, onCellClick, onCreate }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map((g) => [g.dept, true])))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (d: string) => setOpen((p) => ({ ...p, [d]: !(p[d] ?? true) }))
  const rollupFor = (d: string) => rollups.find((r) => r.dept === d)

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex flex-col gap-3">
      {/* Grid */}
      {groups.length === 0 ? (
        <div className="rounded-lg border border-border"><SearchEmpty query={search} /></div>
      ) : (
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex bg-primary-foreground border-b border-border">
            <div className="shrink-0 h-11 flex items-center pl-4 text-sm font-medium text-muted-foreground" style={{ width: ROLE_W }}>Job title</div>
            {months.map((mk) => {
              const past = mk < CURRENT_KEY
              const current = mk === CURRENT_KEY
              const future = mk > CURRENT_KEY
              return (
                <div key={mk} className="shrink-0 h-11 flex items-center justify-center gap-1.5 border-l border-border text-xs font-medium" style={{ flex: 1, minWidth: 150 }}>
                  <span className={cn(past && 'text-badge-warning-fg', current && 'text-foreground', future && 'text-muted-foreground')}>{monthLabel(mk)} '{mk.slice(2, 4)}</span>
                  {past && <span className="text-[10px] uppercase tracking-wide text-badge-warning-fg/80">Past due</span>}
                  {current && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
              )
            })}
          </div>

          {groups.map((g) => {
            const isOpen = open[g.dept] ?? true
            const ru = rollupFor(g.dept)
            const showAll = expanded[g.dept]
            const rows = showAll ? g.rows : g.rows.slice(0, ROW_CAP)
            const hidden = g.rows.length - rows.length
            return (
              <React.Fragment key={g.dept}>
                <div className="flex items-center bg-muted h-9 border-b border-border">
                  <button onClick={() => toggle(g.dept)} className="flex items-center pl-1.5 h-full hover:bg-muted/70 transition-colors" style={{ width: ROLE_W }}>
                    <span className="flex items-center justify-center w-7 h-7 shrink-0">
                      <ChevronDown className={cn('h-4 w-4 text-foreground transition-transform', !isOpen && '-rotate-90')} />
                    </span>
                    <span className="whitespace-nowrap text-xs font-semibold text-foreground">{g.dept}</span>
                    {ru && (
                      <span className="ml-2 whitespace-nowrap rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
                        {`${ru.filled} filled · ${ru.open} open`}
                      </span>
                    )}
                  </button>
                </div>

                {isOpen && rows.map((row) => {
                  const rr = ru?.roleRollups[row.title]
                  return (
                    <div key={row.title} className="flex group">
                      <div className="shrink-0 flex flex-col justify-center pl-4 pr-2 py-2" style={{ width: ROLE_W }}>
                        <span className="text-sm font-medium text-foreground truncate">{row.title}</span>
                        {rr && (rr.filled > 0 || rr.open > 0) && (
                          <span className="text-xs text-muted-foreground">{rr.filled} filled{rr.open > 0 ? ` · ${rr.open} open` : ''}</span>
                        )}
                      </div>
                      {row.cells.map((cell) => {
                        const pad = 'px-2 py-2'
                        if (cell.empty) {
                          return (
                            <div key={cell.mk} className={cn('shrink-0 flex items-center justify-center', pad)} style={{ flex: 1, minWidth: 150 }}>
                              <button disabled={cell.past} onClick={() => onCreate(row.title, cell.mk)}
                                className={cn('w-full h-[52px] rounded-lg border border-dashed border-border flex items-center justify-center group/cell transition-colors',
                                  cell.past ? 'opacity-40 cursor-default' : 'hover:border-primary hover:bg-electric-blue-50/40')}>
                                {!cell.past && <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />}
                              </button>
                            </div>
                          )
                        }
                        const pastDue = cell.past && cell.total - cell.filled > 0
                        const needsFlag = !cell.past && cell.noReq > 0
                        const pendingFlag = !cell.past && cell.noReq === 0 && cell.pending > 0
                        const reopened = !cell.past && cell.reopened
                        return (
                          <div key={cell.mk} className={cn('shrink-0', pad)} style={{ flex: 1, minWidth: 150 }}>
                            <button onClick={() => onCellClick(row.title, cell.mk)}
                              className={cn('relative w-full h-[52px] rounded-lg border flex flex-col items-center justify-center transition-all hover:shadow-sm',
                                pastDue ? 'border-badge-warning-stroke bg-badge-warning/60' :
                                // Populated cells carry a light accent tint so activity pops against empty slots.
                                'border-border bg-[rgba(231,235,255,0.5)] hover:bg-[rgba(231,235,255,0.85)]')}>
                              {(pastDue || pendingFlag) && (
                                <Tooltip><TooltipTrigger asChild>
                                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-[18px] w-[18px] rounded-full bg-badge-warning-fg text-white ring-2 ring-background"><History className="h-2.5 w-2.5" /></span>
                                </TooltipTrigger><TooltipContent>{pastDue ? 'Past due: target month has passed' : 'Has a past-due request'}</TooltipContent></Tooltip>
                              )}
                              {needsFlag && (
                                <Tooltip><TooltipTrigger asChild>
                                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-[18px] w-[18px] rounded-full bg-muted-foreground text-white ring-2 ring-background"><Flag className="h-2.5 w-2.5" /></span>
                                </TooltipTrigger><TooltipContent>No hiring request raised yet</TooltipContent></Tooltip>
                              )}
                              {reopened && (
                                <Tooltip><TooltipTrigger asChild>
                                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-[18px] w-[18px] rounded-full bg-electric-blue-600 text-white ring-2 ring-background"><RotateCcw className="h-2.5 w-2.5" /></span>
                                </TooltipTrigger><TooltipContent>Reopened after someone vacated the role</TooltipContent></Tooltip>
                              )}
                              <span className={cn('text-sm tabular-nums', pastDue ? 'text-badge-warning-fg' : 'text-foreground')}>
                                <span className="font-medium">{cell.filled}</span>
                                <span className="text-muted-foreground"> / </span>
                                <span className="font-medium text-muted-foreground">{cell.total}</span>
                                {cell.done && <Check className="inline h-3 w-3 ml-0.5 text-badge-success-fg" />}
                              </span>
                              <Dots dots={cell.dots} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {isOpen && hidden > 0 && (
                  <button onClick={() => setExpanded((p) => ({ ...p, [g.dept]: true }))} className="flex items-center gap-1 pl-4 h-9 w-full text-xs text-muted-foreground hover:text-foreground border-b border-border bg-background transition-colors">
                    <Plus className="h-3 w-3" /> {hidden} more
                  </button>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
      )}
    </div>
    </TooltipProvider>
  )
}
