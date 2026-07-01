import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { monthLabel, TIMELINE } from '@/lib/positions/time'
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
  const winStart = TIMELINE[startIdx]?.full ?? ''
  const winEnd = TIMELINE[Math.min(startIdx + winLen - 1, TIMELINE.length - 1)]?.full ?? ''
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center h-9 rounded-md border border-input bg-background shadow-xs">
        <button className="px-2 h-full text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none" disabled={!canLeft} onClick={() => onShift(-1)} aria-label="Earlier"><ChevronLeft className="h-4 w-4" /></button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 h-full text-sm tabular-nums whitespace-nowrap hover:text-foreground">{rangeLabel}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </PopoverTrigger>
          <PopoverContent className="w-[440px] p-5" align="center" sideOffset={6}>
            <div className="flex gap-2">
              {[3, 6, 12].map((len) => (
                <button key={len} onClick={() => onSetLen(len)}
                  className={cn('flex-1 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    winLen === len ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:bg-extended-hover')}>
                  {len} months
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2.5">Pick a start month. The range follows your length choice.</p>
            <div className="border-t border-border -mx-5 my-3" />
            {YEARS.map((yr) => (
              <div key={yr} className="flex items-center gap-3 mb-2 last:mb-0">
                <span className="text-sm font-semibold text-muted-foreground w-8 shrink-0">{yr.slice(2)}</span>
                <div className="grid grid-cols-6 gap-2 flex-1">
                  {TIMELINE.filter((m) => m.key.slice(0, 4) === yr).map((m) => {
                    const i = TIMELINE.findIndex((x) => x.key === m.key)
                    const inWindow = i >= startIdx && i < startIdx + winLen
                    return (
                      <button key={m.key} onClick={() => onJump(Math.min(i, TIMELINE.length - winLen))}
                        className={cn('text-xs rounded-md py-1.5 px-2 transition-colors',
                          i === startIdx ? 'bg-primary text-primary-foreground font-medium'
                            : inWindow ? 'bg-electric-blue-50 text-primary' : 'hover:bg-extended-hover text-foreground')}>
                        {monthLabel(m.key)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="border-t border-border -mx-5 mt-3 pt-3 px-0">
              <span className="text-sm text-foreground">{winStart.replace(' 20', ' ')} <span className="text-muted-foreground mx-1">→</span> {winEnd.replace(' 20', ' ')}</span>
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
