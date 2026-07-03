import { X, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { avatarFor } from '@/lib/positions/avatars'
import { type ActivityItem } from '@/lib/positions/seed'

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SLIDE = '0.35s'

// People get an avatar photo or an initials chip; system actors are plain text.
const SYSTEMS = ['Allox', 'Greenhouse', 'Spark']
const INITIALS_TONE = ['var(--chart-4)', 'var(--badge-success-fg)', 'var(--primary)', 'var(--chart-2)']
const isSystem = (actor: string) => SYSTEMS.includes(actor)
function initials(name: string) {
  const clean = name.replace(/\([^)]*\)/, '').trim() || name
  const parts = clean.split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
function ActorAvatar({ actor }: { actor: string }) {
  // "BizOps (Queenie)" gets a photo (seed = inner name); a bare name gets an initials chip.
  const m = actor.match(/\(([^)]+)\)/)
  if (m) {
    return <img src={avatarFor(m[1])} alt={actor} className="h-6 w-6 shrink-0 rounded-full object-cover" />
  }
  const tone = INITIALS_TONE[(initials(actor).charCodeAt(0) || 0) % INITIALS_TONE.length]
  return (
    <span className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold text-white uppercase" style={{ background: tone }}>
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

        <div className="overflow-y-auto scrollbar-minimal flex-1 px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No activity yet.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {entries.map((e, idx) => (
                // Note-card pattern (same as Deals notes): the newest entry is
                // highlighted with the unread dot.
                <li key={e.id} className={cn('rounded-md p-3 flex flex-col gap-1.5', idx === 0 ? 'bg-[rgba(231,235,255,0.5)]' : 'bg-transparent')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {!isSystem(e.actor) && <ActorAvatar actor={e.actor} />}
                      <span className="truncate text-xs font-medium text-foreground">{e.actor}</span>
                      <span className="text-xs text-muted-foreground/60">|</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{e.ts}</span>
                    </div>
                    {idx === 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{e.action}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
