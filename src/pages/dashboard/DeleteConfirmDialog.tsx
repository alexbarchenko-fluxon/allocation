import { CircleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export interface InfoField {
  label: string
  value: React.ReactNode
}

/**
 * Destructive confirmation used before removing a seat or an allocation
 * (Figma 3984-12599 / 3992-16678). A short read-only summary of what's being
 * deleted, an optional billing warning, and Cancel / Delete.
 */
export function DeleteConfirmDialog({
  open, onOpenChange, title, fields, warning, confirmLabel = 'Delete', onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  fields: InfoField[]
  /** Destructive alert copy — omit to hide the alert. */
  warning?: string
  confirmLabel?: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[425px] gap-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Read-only summary — one labelled column per field */}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <span className="text-xs leading-4 text-muted-foreground">{f.label}</span>
              <span className="text-xs font-medium leading-4 text-foreground">{f.value}</span>
            </div>
          ))}
        </div>

        {warning && (
          <Alert variant="destructive" className="border-border">
            <CircleAlert className="h-4 w-4" />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { onConfirm(); onOpenChange(false) }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
