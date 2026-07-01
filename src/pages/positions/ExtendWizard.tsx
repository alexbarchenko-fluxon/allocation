import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { FieldLabel } from '@/components/ui/field-label'
import { TODAY, CURRENT_KEY } from '@/lib/positions/time'
import { type DetailRecord } from './lib'

const LOC_DOT: Record<string, string> = { India: 'var(--loc-india)', Europe: 'var(--loc-europe)', 'North America': 'var(--loc-north-america)' }
// Default target date = first day of the current hiring period (month), per PRD 2.3.
const defaultTarget = () => new Date(CURRENT_KEY + '-01T00:00:00Z')

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  dept: string
  monthLabel: string
  /** 'extend' for past-due rows, 'open' for no-request rows. */
  mode: 'extend' | 'open'
  records: DetailRecord[]            // the actionable (open/pending/no-request) records
  onConfirm: (ids: string[], targetISO: string | null) => void
}

export function ExtendWizard({ open, onOpenChange, title, dept, monthLabel, mode, records, onConfirm }: Props) {
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [date, setDate] = useState<Date | undefined>(defaultTarget())

  useEffect(() => {
    if (open) { setPicked({}); setDate(defaultTarget()) } // nothing pre-selected, date defaults to current month
  }, [open]) // eslint-disable-line

  const minDate = (() => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d })()
  const pickedIds = records.filter((r) => picked[r.id]).map((r) => r.id)
  const n = pickedIds.length
  const verb = mode === 'extend' ? 'Extend' : 'Open'
  // Open Request requires a target date; Extend uses the fixed current-month move.
  const dateOk = mode === 'extend' || !!date
  const canConfirm = n > 0 && dateOk

  const confirm = () => {
    if (!canConfirm) return
    const targetISO = mode === 'open' && date ? date.toISOString().slice(0, 10) : null
    onConfirm(pickedIds, targetISO)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold tracking-tight">{mode === 'extend' ? 'Extend' : 'Open'} {title} positions</h2>
          <p className="text-sm text-muted-foreground mt-1">{dept} · {monthLabel} · {records.length} {mode === 'extend' ? 'past due' : 'without a request'}</p>
        </div>
        <div className="border-t border-border" />

        {/* Pick positions, identical grammar to the Close wizard */}
        <div className="px-6 py-5 flex flex-col gap-3 max-h-[50vh] overflow-y-auto scrollbar-minimal">
          {records.map((r) => (
            <label key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-extended-hover transition-colors">
              <span className="flex items-center gap-3 min-w-0">
                <Checkbox checked={!!picked[r.id]} onCheckedChange={(v) => setPicked((p) => ({ ...p, [r.id]: !!v }))} />
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LOC_DOT[r.loc] || 'var(--muted-foreground)' }} />
                <span className="text-sm font-medium text-foreground truncate">{r.loc}</span>
              </span>
              <Badge variant={mode === 'extend' ? 'warning' : 'neutral'}>{mode === 'extend' ? 'Past due' : 'No request'}</Badge>
            </label>
          ))}
        </div>

        {/* Open Request: choose a target start date (default current month), per PRD 2.3 */}
        {mode === 'open' && (
          <div className="px-6 pb-5 flex flex-col gap-1.5">
            <FieldLabel required hint="The new hiring request carries this target start date. Defaults to the current hiring period.">Target start date</FieldLabel>
            <DatePicker value={date} onChange={setDate} minDate={minDate} placeholder="Pick a date" side="top" />
          </div>
        )}

        <div className="border-t border-border" />
        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{n > 0 ? `${verb}ing ${n} ${n === 1 ? 'position' : 'positions'}.` : 'Select positions to continue.'}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!canConfirm} onClick={confirm}>{n > 0 ? `${verb} ${n} ${n === 1 ? 'position' : 'positions'}` : `${verb} positions`}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
