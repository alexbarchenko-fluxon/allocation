import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIMELINE } from '@/lib/positions/time'
import { DEPTS } from '@/lib/positions/roles'

const YEARS = Array.from(new Set(TIMELINE.map((m) => m.key.slice(0, 4))))

interface Props {
  rangeLabel: string
  startIdx: number
  winLen: number
  onShift: (d: number) => void
  onApply: (startIdx: number, len: number) => void
  canLeft: boolean
  canRight: boolean
  dept: string
  onDept: (v: string) => void
  showAll: boolean
  onShowAll: (v: boolean) => void
}

export function PlanToolbar({ rangeLabel, startIdx, winLen, onShift, onApply, canLeft, canRight, dept, onDept, showAll, onShowAll }: Props) {
  // The picker edits a pending selection; the grid only moves on Apply.
  const [open, setOpen] = useState(false)
  const [pStart, setPStart] = useState(startIdx)
  const [pLen, setPLen] = useState(winLen)
  const pEnd = Math.min(pStart + pLen - 1, TIMELINE.length - 1)

  const openChange = (o: boolean) => {
    setOpen(o)
    if (o) { setPStart(startIdx); setPLen(winLen) }
  }
  const apply = () => {
    onApply(pStart, pLen)
    setOpen(false)
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex items-center gap-3">
      {/* Off by default: the grid shows only roles with planned positions in the
          window. On: every role appears, empty cells become creation shortcuts. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <label className="flex h-9 cursor-pointer select-none items-center gap-2 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">
            <Switch checked={showAll} onCheckedChange={onShowAll} />
            Show all roles
          </label>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">Also show roles with nothing planned in this window — their empty cells let you open positions.</TooltipContent>
      </Tooltip>
      <div className="flex items-center h-9 rounded-md border border-input bg-background shadow-xs">
        <button className="px-2 h-full text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none" disabled={!canLeft} onClick={() => onShift(-1)} aria-label="Earlier"><ChevronLeft className="h-4 w-4" /></button>
        <Popover open={open} onOpenChange={openChange}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 h-full text-sm tabular-nums whitespace-nowrap hover:text-foreground">{rangeLabel}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </PopoverTrigger>
          <PopoverContent className="w-[460px] p-5" align="center" sideOffset={6}>
            <div className="flex gap-2">
              {[3, 6, 12].map((len) => (
                <button key={len} onClick={() => { setPLen(len); setPStart((s) => Math.min(s, TIMELINE.length - len)) }}
                  className={cn('flex-1 rounded-full border px-3 py-2 text-sm transition-colors',
                    pLen === len ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-extended-hover')}>
                  {len} months
                </button>
              ))}
            </div>
            <div className="border-t border-border -mx-5 my-4" />
            <div className="flex flex-col gap-3">
              {YEARS.map((yr) => {
                const yearMonths = TIMELINE.filter((m) => m.key.slice(0, 4) === yr)
                return (
                  <div key={yr} className="flex items-start gap-4">
                    <span className="w-11 shrink-0 pt-2 text-sm font-medium text-muted-foreground">{yr}</span>
                    <div className="grid flex-1 grid-cols-6 gap-y-1.5">
                      {yearMonths.map((m) => {
                        const i = TIMELINE.findIndex((x) => x.key === m.key)
                        const isStart = i === pStart
                        const isEnd = i === pEnd
                        const inBand = i >= pStart && i <= pEnd
                        // One continuous accent band across the window; only the band's absolute
                        // ends are rounded. Endpoints render as primary pills sitting ON the band
                        // so the range reads as a single connected stretch (Figma 285-26965).
                        return (
                          <button key={m.key} onClick={() => setPStart(Math.min(i, TIMELINE.length - pLen))}
                            className={cn('flex h-9 items-center justify-center text-sm transition-colors',
                              inBand ? 'bg-accent text-primary' : 'rounded-md text-foreground hover:bg-extended-hover',
                              isStart && 'rounded-l-md',
                              isEnd && 'rounded-r-md')}>
                            {isStart || isEnd ? (
                              <span className="flex h-full w-full items-center justify-center rounded-md bg-primary text-primary-foreground">{m.label}</span>
                            ) : (
                              m.label
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-border -mx-5 mt-4" />
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm font-medium text-foreground">
                {TIMELINE[pStart]?.full} <span className="mx-1 text-muted-foreground">→</span> {TIMELINE[pEnd]?.full}
              </span>
              <Button onClick={apply}>Apply</Button>
            </div>
          </PopoverContent>
        </Popover>
        <button className="px-2 h-full text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none" disabled={!canRight} onClick={() => onShift(1)} aria-label="Later"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <Select value={dept} onValueChange={onDept}>
        <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {DEPTS.map((d) => <SelectItem key={d} value={d}>{d === 'All' ? 'All departments' : d}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
    </TooltipProvider>
  )
}
