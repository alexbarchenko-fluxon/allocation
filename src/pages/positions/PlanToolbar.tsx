import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIMELINE } from '@/lib/positions/time'
import { DEPTS } from '@/lib/positions/roles'

const YEARS = Array.from(new Set(TIMELINE.map((m) => m.key.slice(0, 4))))

interface Props {
  rangeLabel: string
  startIdx: number
  winLen: number
  onShift: (d: number) => void
  onJump: (startIdx: number) => void
  onSetLen: (len: number) => void
  canLeft: boolean
  canRight: boolean
  dept: string
  onDept: (v: string) => void
}

export function PlanToolbar({ rangeLabel, startIdx, winLen, onShift, onJump, onSetLen, canLeft, canRight, dept, onDept }: Props) {
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
    onSetLen(pLen)
    onJump(pStart)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-3">
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
                      {yearMonths.map((m, idxInYear) => {
                        const i = TIMELINE.findIndex((x) => x.key === m.key)
                        const isEndpoint = i === pStart || i === pEnd
                        const inWindow = i > pStart && i < pEnd
                        const col = idxInYear % 6
                        // In-window months read as one continuous band; endpoints are solid pills.
                        const bandStart = col === 0 || i === pStart + 1
                        const bandEnd = col === 5 || i === pEnd - 1
                        return (
                          <button key={m.key} onClick={() => setPStart(Math.min(i, TIMELINE.length - pLen))}
                            className={cn('py-2 text-sm transition-colors',
                              isEndpoint ? 'rounded-md bg-primary font-medium text-primary-foreground'
                                : inWindow ? cn('bg-electric-blue-50 text-primary', bandStart && 'rounded-l-md', bandEnd && 'rounded-r-md')
                                : 'rounded-md text-foreground hover:bg-extended-hover')}>
                            {m.label}
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
              <Button size="sm" onClick={apply}>Apply</Button>
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
  )
}
