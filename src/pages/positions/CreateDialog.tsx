import { useState, useEffect } from 'react'
import { Zap, Minus, Plus, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { BASE_ROLES, DEPT_ORDER, EXEC_DEPT, isExecTitle } from '@/lib/positions/roles'
import { TODAY } from '@/lib/positions/time'

type LocKey = 'India' | 'Europe' | 'North America'
const LOC_KEYS: LocKey[] = ['India', 'Europe', 'North America']
const LOC_TOKEN: Record<LocKey, string> = {
  India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)',
}

// Inline on/off switch built from tokens — the system has no Switch primitive,
// so this stays dependency-free while reading as a standard switch.
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
  onCreate: (title: string, raiseRequest: boolean, startISO: string | null, loc: Record<LocKey, number>, total: number) => void
  defaultTitle?: string
}

export function CreateDialog({ open, onOpenChange, onCreate, defaultTitle }: Props) {
  const [title, setTitle] = useState(defaultTitle ?? 'Senior Software Engineer')
  const [raiseRequest, setRaiseRequest] = useState(true) // default ON (Kenny, Jun 29)
  const [date, setDate] = useState<Date | undefined>(() => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 20); return d })
  const [loc, setLoc] = useState<Record<LocKey, number>>({ India: 0, Europe: 0, 'North America': 0 })
  const [total, setTotal] = useState(1)

  useEffect(() => { if (open) { if (defaultTitle) setTitle(defaultTitle); setLoc({ India: 0, Europe: 0, 'North America': 0 }); setTotal(1) } }, [open, defaultTitle])

  const execBlocked = isExecTitle(title)
  const assigned = LOC_KEYS.reduce((s, k) => s + loc[k], 0)
  const count = Math.max(total, assigned)
  const minDate = (() => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d })()
  const dateOk = !raiseRequest || (!!date && date > minDate)
  const valid = count >= 1 && !execBlocked && dateOk

  // Location steppers assign within the total; bumping a hub up past total raises total too.
  const bump = (k: LocKey, delta: number) => setLoc((l) => {
    const next = Math.max(0, l[k] + delta)
    const nextLoc = { ...l, [k]: next }
    const nextAssigned = LOC_KEYS.reduce((s, kk) => s + nextLoc[kk], 0)
    if (nextAssigned > total) setTotal(nextAssigned)
    return nextLoc
  })
  const decTotal = () => setTotal((t) => Math.max(assigned, t - 1))
  const incTotal = () => setTotal((t) => t + 1)

  const submit = () => {
    if (!valid) return
    const startISO = raiseRequest && date ? date.toISOString().slice(0, 10) : null
    onCreate(title, raiseRequest, startISO, loc, count)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New positions</DialogTitle>
          <DialogDescription>Set the position details, then choose whether to raise a hiring request now.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2 overflow-y-auto scrollbar-minimal flex-1 min-h-0">
          {/* ── Position details: Role + Location ─────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            <FieldLabel required hint="Roles come from BambooHR. The department is derived from the role, never set by hand.">Role</FieldLabel>
            <Select value={title} onValueChange={setTitle}>
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

          {execBlocked && (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertTitle>Positions can't be opened for exec and advisory roles</AlertTitle>
              <AlertDescription>These are one-off hires, handled outside the monthly plan. Pick a role from another department to continue.</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2.5">
            <FieldLabel optional hint="Split positions across hubs, or leave it and decide later.">Location</FieldLabel>
            <div className="flex flex-col gap-2">
              {LOC_KEYS.map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: LOC_TOKEN[k] }} />
                  <span className="text-sm text-foreground flex-1">{k}</span>
                  <div className="flex items-center h-9 rounded-md border border-input bg-background shadow-xs">
                    <button className="px-2 h-full text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none" disabled={loc[k] === 0} onClick={() => bump(k, -1)} aria-label={`Fewer ${k}`}><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center text-sm tabular-nums">{loc[k]}</span>
                    <button className="px-2 h-full text-muted-foreground hover:text-foreground" onClick={() => bump(k, 1)} aria-label={`More ${k}`}><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
              {LOC_KEYS.map((k) => loc[k] > 0 && <span key={k} style={{ flex: loc[k], background: LOC_TOKEN[k] }} />)}
              {count - assigned > 0 && <span style={{ flex: count - assigned, background: 'var(--border)' }} />}
            </div>
            {count - assigned > 0 && assigned > 0 && (
              <p className="text-xs text-muted-foreground">{count - assigned} unassigned, you can split by hub now or later.</p>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-center gap-4">
            <button className="h-9 w-9 rounded-md border border-input bg-background shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none" disabled={count <= 0} onClick={decTotal} aria-label="Fewer positions"><Minus className="h-4 w-4" /></button>
            <span className="text-3xl font-light tabular-nums w-12 text-center">{count}</span>
            <button className="h-9 w-9 rounded-md border border-input bg-background shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground" onClick={incTotal} aria-label="More positions"><Plus className="h-4 w-4" /></button>
          </div>

          {/* ── Hiring request section, gated by the toggle ───────────────── */}
          <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Raise a hiring request</span>
                <span className="text-xs text-muted-foreground">On for new hires. Turn off for internal moves like a promotion, no request or start date.</span>
              </div>
              <Switch checked={raiseRequest} onChange={setRaiseRequest} />
            </div>

            {raiseRequest && (
              <div className="flex flex-col gap-2.5 pt-1">
                <FieldLabel required hint="The hiring request carries this target start date. The position counts toward this month's plan.">Target start date</FieldLabel>
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
            <Button disabled={!valid} onClick={submit}>{count > 0 ? `Open ${count} ${count === 1 ? 'position' : 'positions'}` : 'Open positions'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
