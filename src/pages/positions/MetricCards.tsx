import { Info, ArrowRight } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { type Rollup } from './lib'

const SEG = { filled: 'var(--metric-filled)', open: 'var(--electric-blue-600)', pending: 'var(--badge-warning-fg)' }

function CardLabel({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-sm font-normal text-muted-foreground">{children}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label={tip}>
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px]">{tip}</TooltipContent>
      </Tooltip>
    </div>
  )
}

interface Props { r: Rollup; onNeedsReview: () => void }

export function MetricCards({ r, onNeedsReview }: Props) {
  const segs = [
    { key: 'filled', label: 'Filled', value: r.filled, color: SEG.filled },
    { key: 'open', label: 'Open', value: r.open, color: SEG.open },
    { key: 'pending', label: 'Past due', value: r.pending, color: SEG.pending },
  ].filter((s) => s.value > 0)
  const barTotal = segs.reduce((s, x) => s + x.value, 0) || 1

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted rounded-xl p-5 flex flex-col gap-3 min-w-[200px]">
          <CardLabel tip="All active positions across departments. Closed positions are excluded.">Total positions</CardLabel>
          <p className="text-4xl font-light leading-none">{r.total}</p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-background mt-1">
            {segs.map((s) => <span key={s.key} style={{ flex: s.value / barTotal, background: s.color }} />)}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {segs.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label} {s.value}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-muted rounded-xl p-5 flex flex-col gap-3 min-w-[200px]">
          <CardLabel tip="Positions with someone on staff or an accepted offer.">Filled</CardLabel>
          <p className="text-4xl font-light leading-none">{r.filled}</p>
          <p className="text-xs text-muted-foreground mt-auto">On staff or offer accepted</p>
        </div>

        <div className="bg-muted rounded-xl p-5 flex flex-col gap-3 min-w-[200px]">
          <CardLabel tip="Open and past-due positions still being hired for.">Open</CardLabel>
          <p className="text-4xl font-light leading-none">{r.open + r.pending}</p>
          {r.needsReview > 0 ? (
            <button onClick={onNeedsReview} className="group flex items-center gap-1 text-xs text-left text-electric-blue-600 hover:underline mt-auto font-medium">
              {r.needsReview} need review
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <p className="text-xs text-muted-foreground mt-auto">All up to date</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
