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

export const commentStore = {
  list: (): ProtoComment[] => read(),
  add(c: ProtoComment) { write([c, ...read()]) },
  setResolved(id: string, resolved: boolean, by: string) {
    write(read().map((c) => (c.id === id ? { ...c, resolved, resolvedBy: resolved ? by : undefined } : c)))
  },
  subscribe(fn: Listener) { listeners.add(fn); return () => { listeners.delete(fn) } },
}

// Reviewer identity without login: ask once, keep in localStorage.
const AUTHOR_KEY = 'proto-comment-author'
export const getAuthor = () => localStorage.getItem(AUTHOR_KEY) ?? ''
export const setAuthor = (name: string) => localStorage.setItem(AUTHOR_KEY, name.trim())
