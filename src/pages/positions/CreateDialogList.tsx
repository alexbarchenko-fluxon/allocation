import { useState, useEffect } from 'react'
import { Zap, Minus, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { BASE_ROLES, DEPT_ORDER, EXEC_DEPT, isExecTitle } from '@/lib/positions/roles'
import { TODAY } from '@/lib/positions/time'

// Experimental list-based create (AJ's proposal): each line is a single
// role + location + count; add as many lines as needed and open them in one go.
// Lives behind the flask button next to "New position" for comparison testing.

export type LineLoc = 'Anywhere' | 'India' | 'Europe' | 'North America'
export interface CreateLine { title: string; loc: LineLoc; count: number }

const LOC_OPTIONS: LineLoc[] = ['Anywhere', 'India', 'Europe', 'North America']
const LOC_TOKEN: Record<string, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
  Anywhere: 'var(--muted-foreground)',
}

// Same inline switch as CreateDialog — the system has no Switch primitive.
function Switch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} id={id}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: (lines: CreateLine[], raiseRequest: boolean, startISO: string | null) => void
  defaultTitle?: string
}

const newLine = (title = 'Senior Software Engineer'): CreateLine => ({ title, loc: 'Anywhere', count: 1 })

export function CreateDialogList({ open, onOpenChange, onCreate, defaultTitle }: Props) {
  const [lines, setLines] = useState<CreateLine[]>([newLine()])
  const [raiseRequest, setRaiseRequest] = useState(true)
  const [date, setDate] = useState<Date | undefined>(() => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 20); return d })

  useEffect(() => { if (open) setLines([newLine(defaultTitle)]) }, [open, defaultTitle])

  const total = lines.reduce((s, l) => s + l.count, 0)
  const minDate = (() => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d })()
  const dateOk = !raiseRequest || (!!date && date > minDate)
  const valid = lines.length > 0 && total >= 1 && lines.every((l) => l.count >= 1 && !isExecTitle(l.title)) && dateOk

  const patch = (idx: number, p: Partial<CreateLine>) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...p } : l)))
  const remove = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx))

  const submit = () => {
    if (!valid) return
    onCreate(lines, raiseRequest, raiseRequest && date ? date.toISOString().slice(0, 10) : null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New positions</DialogTitle>
          <DialogDescription>Set the position details, then choose whether to raise a hiring request now.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 overflow-y-auto scrollbar-minimal flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Add positions</span>
            <Button variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, newLine(ls[ls.length - 1]?.title)])}>Add position</Button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Select value={line.title} onValueChange={(v) => patch(idx, { title: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {DEPT_ORDER.map((dep) => (
                      <SelectGroup key={dep}>
                        <SelectLabel>{dep}</SelectLabel>
                        {BASE_ROLES.filter((r) => r.dept === dep).map((r) => (
                          <SelectItem key={r.title} value={r.title} disabled={dep === EXEC_DEPT}>
                            {r.title}{dep === EXEC_DEPT ? ' · not planned here' : ''}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={line.loc} onValueChange={(v) => patch(idx, { loc: v as LineLoc })}>
                <SelectTrigger className="w-[170px] shrink-0">
                  <span className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: LOC_TOKEN[line.loc] }} />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LOC_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: LOC_TOKEN[l] }} />{l}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex h-9 shrink-0 items-center rounded-md border border-input bg-background shadow-xs">
                <button className="h-full px-2 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none" disabled={line.count <= 1} onClick={() => patch(idx, { count: line.count - 1 })} aria-label="Fewer"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center text-sm tabular-nums">{line.count}</span>
                <button className="h-full px-2 text-muted-foreground hover:text-foreground" onClick={() => patch(idx, { count: line.count + 1 })} aria-label="More"><Plus className="h-4 w-4" /></button>
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={lines.length === 1}
                aria-label="Remove line"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-badge-error-fg disabled:opacity-30 disabled:pointer-events-none"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Hiring request, gated by the toggle — same grammar as the classic dialog */}
          <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Raise hiring requests</span>
                <span className="text-xs text-muted-foreground">On for new hires. Turn off for internal moves like a promotion, no request or start date.</span>
              </div>
              <Switch checked={raiseRequest} onChange={setRaiseRequest} />
            </div>
            {raiseRequest && (
              <div className="flex flex-col gap-2.5 pt-1">
                <FieldLabel hint="Every request in this batch carries this target start date. The positions count toward that month's plan.">Start date</FieldLabel>
                <DatePicker value={date} onChange={setDate} minDate={minDate} placeholder="Pick a date" side="top" />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className={cn('hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground', !raiseRequest && 'invisible')} title="Approval happens offline for the MVP. Recruiters pick positions up in Spark.">
            <Zap className="h-3.5 w-3.5" /> Sent to Spark automatically
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!valid} onClick={submit}>{total > 0 ? `Open ${total} ${total === 1 ? 'position' : 'positions'}` : 'Open positions'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
