// Comment storage behind an interface: v1 persists to localStorage (per build id,
// survives reloads, cross-tab via the storage event). Swapping in a shared backend
// (Supabase / Vercel KV) later means reimplementing these four functions only.
import { type Anchor } from './anchor'

export interface ProtoComment {
  id: string
  buildId: string
  route: string          // pathname + search at the moment of commenting
  anchor: Anchor
  context: string        // human-readable chips: "AJ · Needs review · in dialog 'New positions'"
  text: string
  author: string
  createdAt: string
  resolved: boolean
  resolvedBy?: string
}

export const BUILD_ID = (import.meta as { env?: Record<string, string> }).env?.VITE_BUILD_ID ?? 'dev'
const KEY = `proto-comments:${BUILD_ID}`

type Listener = () => void
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((fn) => fn())

// Cross-tab sync — another reviewer's tab writes, ours re-renders.
window.addEventListener('storage', (e) => { if (e.key === KEY) notify() })

function read(): ProtoComment[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
function write(list: ProtoComment[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  notify()
}

// Optional shared backend: set VITE_COMMENTS_API (e.g. "/api/comments" once the
// Vercel KV function is enabled) and every read/write syncs through it. Without
// it, localStorage-only — use Export/Import in the panel to pass comments around.
const API = (import.meta as { env?: Record<string, string> }).env?.VITE_COMMENTS_API ?? ''

async function pullRemote() {
  if (!API) return
  try {
    const res = await fetch(`${API}?build=${encodeURIComponent(BUILD_ID)}`)
    if (!res.ok) return
    const remote: ProtoComment[] = await res.json()
    // merge by id — remote wins on resolved state, local-only drafts survive
    const local = read()
    const byId = new Map(local.map((c) => [c.id, c]))
    remote.forEach((c) => byId.set(c.id, c))
    localStorage.setItem(KEY, JSON.stringify([...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
    notify()
  } catch { /* offline / not configured — localStorage stays the truth */ }
}
function pushRemote(c: ProtoComment) {
  if (!API) return
  fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }).catch(() => {})
}
if (API) { pullRemote(); setInterval(pullRemote, 10000) }

export const commentStore = {
  list: (): ProtoComment[] => read(),
  add(c: ProtoComment) { write([c, ...read()]); pushRemote(c) },
  setResolved(id: string, resolved: boolean, by: string) {
    const next = read().map((c) => (c.id === id ? { ...c, resolved, resolvedBy: resolved ? by : undefined } : c))
    write(next)
    const changed = next.find((c) => c.id === id)
    if (changed) pushRemote(changed)
  },
  // Export/Import: the no-backend way to share comments (paste JSON in Slack).
  exportJSON(): string { return JSON.stringify(read(), null, 2) },
  exportDigest(): string {
    return read().map((c) =>
      `${c.resolved ? '✅' : '💬'} ${c.author} · ${c.context || c.route} · on "${c.anchor.label}"\n   ${c.text}`,
    ).join('\n')
  },
  importJSON(json: string): number {
    const incoming: ProtoComment[] = JSON.parse(json)
    if (!Array.isArray(incoming)) throw new Error('not a comment list')
    const byId = new Map(read().map((c) => [c.id, c]))
    let added = 0
    incoming.forEach((c) => { if (c.id && c.text && !byId.has(c.id)) { byId.set(c.id, c); added++ } })
    write([...byId.values()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')))
    incoming.forEach(pushRemote)
    return added
  },
  subscribe(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn) } },
}

// Reviewer identity without login: ask once, keep in localStorage.
const AUTHOR_KEY = 'proto-comment-author'
export const getAuthor = () => localStorage.getItem(AUTHOR_KEY) ?? ''
export const setAuthor = (name: string) => localStorage.setItem(AUTHOR_KEY, name.trim())
