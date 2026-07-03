import { useState, useEffect } from 'react'
import { Trash2, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type DetailRecord } from './lib'

const REASONS = ['No longer needed', 'Repurposing to another role', 'Budget reduced', 'Deal fell through', 'Other']

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  dept: string
  monthLabel: string
  records: DetailRecord[]            // active (open/pending) records, closeable
  filledCount: number                // protected, shown in the note
  onConfirm: (ids: string[], reason: string) => void
}

export function CloseWizard({ open, onOpenChange, title, dept, monthLabel, records, filledCount, onConfirm }: Props) {
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')

  // With a single position there's nothing to pick — the wizard opens straight on Reason.
  const single = records.length === 1

  useEffect(() => {
    if (open) {
      // Preselect every position passed in — clicking "Close" should open with the
      // position(s) already checked, ready to confirm (still editable before closing).
      setStep(records.length === 1 ? 1 : 0); setNote('')
      setPicked(Object.fromEntries(records.map((r) => [r.id, true])))
    }
  }, [open]) // eslint-disable-line

  const pickedIds = records.filter((r) => picked[r.id]).map((r) => r.id)
  const n = pickedIds.length
  const canContinue = n > 0
  const canConfirm = n > 0 && note.trim().length > 0

  // Honest subtitle: break the records down by state instead of calling everything "open".
  const breakdown = (() => {
    const pending = records.filter((r) => r.status === 'pending').length
    const noReq = records.filter((r) => r.status === 'open' && r.noReq).length
    const openN = records.length - pending - noReq
    const parts: string[] = []
    if (pending > 0) parts.push(`${pending} past due`)
    if (openN > 0) parts.push(`${openN} open`)
    if (noReq > 0) parts.push(`${noReq} no request`)
    return parts.join(' · ') || 'no active positions'
  })()

  const confirm = () => {
    if (!canConfirm) return
    onConfirm(pickedIds, note.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">Closing {title} positions</h2>
              <p className="text-sm text-muted-foreground">{dept} · {monthLabel} · {breakdown}</p>
            </div>
          </div>
          {/* Step rail — only when there's actually something to pick */}
          {!single && (
            <div className="flex gap-3 mt-5">
              {['Pick positions', 'Reason'].map((label, i) => (
                <div key={label} className="flex-1 flex flex-col gap-1.5">
                  <div className={cn('h-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-electric-blue-100')} />
                  <span className={cn('text-sm font-medium', i === step ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Body */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto scrollbar-minimal">
          {step === 0 ? (
            <div className="flex flex-col gap-3">
              {records.map((r) => (
                <label key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-extended-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={!!picked[r.id]} onCheckedChange={(v) => setPicked((p) => ({ ...p, [r.id]: !!v }))} />
                    <span className="text-sm font-medium text-foreground">{r.loc}</span>
                  </div>
                  {r.status === 'pending'
                    ? <Badge variant="warning">Past due</Badge>
                    : r.noReq
                    ? <Badge variant="neutral">No request</Badge>
                    : <Badge variant="outline" className="border-transparent bg-electric-blue-50 text-foreground">Open</Badge>}
                </label>
              ))}
              {filledCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-badge-warning-stroke bg-badge-warning/40 p-3.5">
                  <ShieldCheck className="h-4 w-4 text-badge-warning-fg shrink-0 mt-0.5" />
                  <p className="text-sm text-badge-warning-fg">
                    {filledCount} filled {filledCount === 1 ? 'position isn’t' : 'positions aren’t'} listed here — a position with someone in it can’t be closed. Closing an open position also closes its Spark hiring request.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Single position: show what's being closed instead of asking to pick it */}
              {single && records[0] && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <span className="text-sm font-medium text-foreground">{records[0].loc}</span>
                  {records[0].status === 'pending'
                    ? <Badge variant="warning">Past due</Badge>
                    : records[0].noReq
                    ? <Badge variant="neutral">No request</Badge>
                    : <Badge variant="outline" className="border-transparent bg-electric-blue-50 text-foreground">Open</Badge>}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Quick fill, or write your own below</span>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button key={r} onClick={() => setNote(r === 'Other' ? '' : r)}
                      className={cn('rounded-full border px-4 py-2 text-sm transition-colors',
                        note === r ? 'border-primary bg-electric-blue-50 text-primary' : 'border-border text-foreground hover:bg-extended-hover')}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for closing (required)"
                rows={3}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">Closing {n} {n === 1 ? 'position' : 'positions'}.</p>
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between">
          {step === 0 || single
            ? <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            : <Button variant="outline" onClick={() => setStep(0)}>Back</Button>}
          {step === 0
            ? <Button disabled={!canContinue} onClick={() => setStep(1)}>Continue</Button>
            : <Button variant="destructive" disabled={!canConfirm} onClick={confirm}><Trash2 className="h-4 w-4" /> Close {n} {n === 1 ? 'position' : 'positions'}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
