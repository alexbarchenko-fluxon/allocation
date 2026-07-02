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
  records: DetailRecord[]            // the no-request records eligible for a hiring request
  onConfirm: (ids: string[], targetISO: string | null) => void
}

// Raise hiring requests for positions that don't have one yet. (The old "extend"
// flow is gone: per PRD, a late request keeps its target date — it's just delayed.)
export function OpenRequestWizard({ open, onOpenChange, title, dept, monthLabel, records, onConfirm }: Props) {
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [date, setDate] = useState<Date | undefined>(defaultTarget())

  useEffect(() => {
    // Preselect everything passed in — ready to confirm, still editable.
    if (open) { setPicked(Object.fromEntries(records.map((r) => [r.id, true]))); setDate(defaultTarget()) }
  }, [open]) // eslint-disable-line

  const minDate = (() => { const d = new Date(TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d })()
  const pickedIds = records.filter((r) => picked[r.id]).map((r) => r.id)
  const n = pickedIds.length
  const canConfirm = n > 0 && !!date

  const confirm = () => {
    if (!canConfirm) return
    onConfirm(pickedIds, date ? date.toISOString().slice(0, 10) : null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold tracking-tight">Open {title} positions</h2>
          <p className="text-sm text-muted-foreground mt-1">{dept} · {monthLabel} · {records.length} without a request</p>
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
              <Badge variant="neutral">No request</Badge>
            </label>
          ))}
        </div>

        {/* Target start date (default current month), per PRD 2.3 */}
        <div className="px-6 pb-5 flex flex-col gap-1.5">
          <FieldLabel required hint="The new hiring request carries this target start date. Defaults to the current hiring period.">Target start date</FieldLabel>
          <DatePicker value={date} onChange={setDate} minDate={minDate} placeholder="Pick a date" side="top" />
        </div>

        <div className="border-t border-border" />
        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{n > 0 ? `Opening ${n} ${n === 1 ? 'request' : 'requests'}.` : 'Select positions to continue.'}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!canConfirm} onClick={confirm}>{n > 0 ? `Open ${n} ${n === 1 ? 'request' : 'requests'}` : 'Open requests'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
