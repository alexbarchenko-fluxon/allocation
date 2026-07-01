import { X, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { avatarFor } from '@/lib/positions/avatars'
import { type ActivityItem } from '@/lib/positions/seed'

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SLIDE = '0.35s'

// Systems get a small colored dot; people get an avatar photo (or initials chip).
const SYSTEM_TONE: Record<string, string> = {
  Allox: 'var(--primary)',
  Greenhouse: 'var(--electric-blue-600)',
  Spark: 'var(--badge-warning-fg)',
}
const INITIALS_TONE = ['var(--chart-4)', 'var(--badge-success-fg)', 'var(--primary)', 'var(--chart-2)']
const isSystem = (actor: string) => actor in SYSTEM_TONE
function initials(name: string) {
  const clean = name.replace(/\([^)]*\)/, '').trim() || name
  const parts = clean.split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
function ActorGlyph({ actor }: { actor: string }) {
  if (isSystem(actor)) {
    return <span className="h-2 w-2 shrink-0 mt-2 rounded-full" style={{ background: SYSTEM_TONE[actor] }} />
  }
  // Person: "BizOps (Queenie)" gets a photo (seed = inner name); a bare name gets an initials chip.
  const m = actor.match(/\(([^)]+)\)/)
  if (m) {
    return <img src={avatarFor(m[1])} alt={actor} className="h-7 w-7 shrink-0 rounded-full object-cover" />
  }
  const tone = INITIALS_TONE[(initials(actor).charCodeAt(0) || 0) % INITIALS_TONE.length]
  return (
    <span className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold text-white uppercase" style={{ background: tone }}>
      {initials(actor)}
    </span>
  )
}

interface Props {
  entries: ActivityItem[]
  isOpen: boolean
  onClose: () => void
}

export function ChangeLog({ entries, isOpen, onClose }: Props) {
  return (
    <div
      className="overflow-hidden flex-shrink-0 h-full"
      style={{ width: isOpen ? 380 : 0, marginLeft: isOpen ? 0 : -10, transition: `width ${SLIDE} ${EASING}, margin-left ${SLIDE} ${EASING}` }}
    >
      <div className="w-[380px] h-full bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-2 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-semibold tracking-tight">Change log</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0"><X /></Button>
        </div>

        <div className="overflow-y-auto scrollbar-minimal flex-1 px-5 py-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No activity yet.</p>
          ) : (
            <ol className="flex flex-col">
              {entries.map((e) => (
                <li key={e.id} className="flex gap-3 py-3 border-b border-border last:border-b-0">
                  <ActorGlyph actor={e.actor} />
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground">{e.ts}</span>
                    <p className="text-sm text-foreground leading-snug">
                      <span className="font-semibold">{e.actor}</span>{' '}
                      <span className="text-muted-foreground">{e.action}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
