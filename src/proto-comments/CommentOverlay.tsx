import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquarePlus, MessageSquare, X, Check, RotateCcw, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildAnchor, resolveAnchor, type Anchor } from './anchor'
import { commentStore, getAuthor, setAuthor, BUILD_ID, type ProtoComment } from './store'

// Prototype comment layer — Figma-style pinned comments on the running build.
// Self-contained: mount <CommentOverlay /> once inside the router and it works in
// any Fluxon prototype. Everything renders under [data-proto-comments] so the
// Figma capture pipeline strips it. No login: reviewers give a name once.

const uid = () => Math.random().toString(36).slice(2, 10)

function currentContext(): string {
  const bits: string[] = []
  const scope = localStorage.getItem('allox-scope')
  if (scope) bits.push(scope.toUpperCase())
  const tab = document.querySelector('[role="tab"][data-state="active"]')?.textContent?.trim()
  if (tab) bits.push(tab)
  const dlg = document.querySelector('[role="dialog"] h2')?.textContent?.trim()
  if (dlg) bits.push(`in “${dlg}”`)
  return bits.join(' · ')
}

interface Draft { anchor: Anchor; x: number; y: number }

export function CommentOverlay() {
  const location = useLocation()
  const navigate = useNavigate()
  const [comments, setComments] = useState<ProtoComment[]>(() => commentStore.list())
  const [mode, setMode] = useState(false)          // comment-placing mode
  const [panel, setPanel] = useState(false)        // overview panel
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [text, setText] = useState('')
  const [name, setName] = useState(getAuthor())
  const [tick, setTick] = useState(0)              // pin reposition heartbeat
  const highlight = useRef<string | null>(null)

  // Body-level portal container: Radix dialogs set pointer-events:none on the app
  // root while open — as a sibling of their portal we stay interactive above modals.
  const [host] = useState(() => {
    const el = document.createElement('div')
    el.setAttribute('data-proto-comments', '')
    el.style.pointerEvents = 'auto'
    return el
  })
  useEffect(() => {
    document.body.appendChild(host)
    return () => { document.body.removeChild(host) }
  }, [host])

  useEffect(() => commentStore.subscribe(() => setComments(commentStore.list())), [])

  // Focus shield: Radix modal dialogs trap focus and would yank it back the moment
  // the composer textarea is focused (making typing impossible while a dialog is
  // open). Capture-phase handlers stop focus events involving our layer from ever
  // reaching Radix's document-level trap listeners.
  useEffect(() => {
    const ours = (n: EventTarget | null) => !!(n as Element | null)?.closest?.('[data-proto-comments]')
    const shield = (e: FocusEvent) => {
      if (ours(e.target) || ours(e.relatedTarget)) e.stopImmediatePropagation()
    }
    document.addEventListener('focusin', shield, true)
    document.addEventListener('focusout', shield, true)
    return () => {
      document.removeEventListener('focusin', shield, true)
      document.removeEventListener('focusout', shield, true)
    }
  }, [])

  // Escape closes composer/panel (checked before the app's own dialogs get it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (draft) { e.stopPropagation(); setDraft(null); setText('') }
      else if (panel) { e.stopPropagation(); setPanel(false) }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [draft, panel])

  // Pins follow their elements: cheap heartbeat + resize/scroll listeners.
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    const iv = setInterval(bump, 400)
    window.addEventListener('resize', bump)
    window.addEventListener('scroll', bump, true)
    return () => { clearInterval(iv); window.removeEventListener('resize', bump); window.removeEventListener('scroll', bump, true) }
  }, [])

  // Comment mode: capture the next click anywhere outside the overlay.
  useEffect(() => {
    if (!mode) return
    document.body.style.cursor = 'crosshair'
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element
      if (t.closest('[data-proto-comments]')) return
      e.preventDefault(); e.stopPropagation()
      setDraft({ anchor: buildAnchor(t, e.clientX, e.clientY), x: e.clientX, y: e.clientY })
      setMode(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMode(false) }
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.cursor = ''
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [mode])

  const post = useCallback(() => {
    if (!draft || !text.trim() || !name.trim()) return
    setAuthor(name)
    commentStore.add({
      id: uid(), buildId: BUILD_ID,
      route: location.pathname + location.search,
      anchor: draft.anchor,
      context: currentContext(),
      text: text.trim(), author: name.trim(),
      createdAt: new Date().toISOString(), resolved: false,
    })
    setDraft(null); setText(''); setPanel(true)
  }, [draft, text, name, location])

  const here = comments.filter((c) => c.route.split('?')[0] === location.pathname && !c.resolved)
  const shown = comments.filter((c) => filter === 'all' ? true : filter === 'resolved' ? c.resolved : !c.resolved)
  const openCount = comments.filter((c) => !c.resolved).length
  void tick // positions below re-read layout every heartbeat

  return createPortal(
    <div data-proto-comments="">
      {/* Pins — anchored to live elements; hidden when the element isn't on screen (e.g. its dialog is closed). */}
      {here.map((c, i) => {
        const el = resolveAnchor(c.anchor)
        if (!el) return null
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return null
        const x = r.left + r.width * c.anchor.xPct
        const y = r.top + r.height * c.anchor.yPct
        return (
          <button
            key={c.id}
            title={`${c.author}: ${c.text}`}
            onClick={() => { highlight.current = c.id; setPanel(true) }}
            className="fixed z-[100] flex h-6 w-6 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-none bg-primary text-[11px] font-semibold text-primary-foreground shadow-md ring-2 ring-background"
            style={{ left: x, top: y }}
          >
            {i + 1}
          </button>
        )
      })}

      {/* Composer */}
      {draft && (
        <div
          className="fixed z-[110] w-[300px] rounded-lg border border-border bg-background p-3 shadow-lg"
          style={{ left: Math.min(draft.x, window.innerWidth - 320), top: Math.min(draft.y + 8, window.innerHeight - 220) }}
        >
          <p className="mb-2 truncate text-xs text-muted-foreground">On: {draft.anchor.label}</p>
          {!getAuthor() && (
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="mb-2 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            />
          )}
          <textarea
            autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Leave a comment…"
            className="h-20 w-full resize-none rounded-md border border-input bg-background p-2 text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) post() }}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setDraft(null); setText('') }} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={post} disabled={!text.trim() || !name.trim()} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50">Post</button>
          </div>
        </div>
      )}

      {/* Overview panel */}
      {panel && (
        <div className="fixed inset-y-0 right-0 z-[105] flex w-[340px] flex-col border-l border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Comments · {BUILD_ID}</span>
            <button onClick={() => setPanel(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex gap-1 border-b border-border px-3 py-2">
            {(['open', 'resolved', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize', filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {shown.length === 0 && <p className="p-4 text-sm text-muted-foreground">No {filter !== 'all' ? filter : ''} comments yet.</p>}
            {shown.map((c) => (
              <div key={c.id} className={cn('border-b border-border px-4 py-3', highlight.current === c.id && 'bg-extended-hover')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                {c.context && <p className="mt-0.5 text-xs text-muted-foreground">{c.context}</p>}
                <p className="mt-1 text-sm text-foreground">{c.text}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">On: {c.anchor.label}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => commentStore.setResolved(c.id, !c.resolved, getAuthor() || 'someone')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {c.resolved ? <><RotateCcw className="h-3 w-3" /> Reopen</> : <><Check className="h-3 w-3" /> Resolve</>}
                  </button>
                  <button
                    onClick={() => { navigate(c.route); setPanel(false); highlight.current = c.id }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpRight className="h-3 w-3" /> Go to
                  </button>
                  {c.resolved && c.resolvedBy && <span className="text-xs text-muted-foreground">by {c.resolvedBy}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launcher — bottom-right, out of the scope pill's corner. */}
      <div className="fixed bottom-4 right-4 z-[100] flex items-center gap-2">
        <button
          onClick={() => setMode((m) => !m)}
          title="Add a comment — then click anywhere"
          className={cn('flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors',
            mode ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground')}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </button>
        <button
          onClick={() => setPanel((p) => !p)}
          title="All comments"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
        >
          <MessageSquare className="h-5 w-5" />
          {openCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">{openCount}</span>
          )}
        </button>
      </div>
    </div>,
    host,
  )
}
