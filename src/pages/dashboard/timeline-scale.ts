// Windowed month scale for the allocation-modal Gantt timelines.
// The visible window is WINDOW_MONTHS wide and can be panned left/right with
// the section arrows (shift = number of months offset from the base month).

import { daysBetween } from './format'

export const BASE_START = '2026-06-01' // first month of the default window
export const WINDOW_MONTHS = 7
export const TL_TODAY = '2026-07-10'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export interface MonthTick { key: string; label: string; startISO: string }
export interface TLWindow {
  startISO: string
  endISO: string
  months: MonthTick[]
  totalDays: number
}

/** Build the visible window, shifted by `shift` months from the base month. */
export function buildWindow(shift = 0): TLWindow {
  const base = new Date(`${BASE_START}T00:00:00`)
  const start = new Date(base.getFullYear(), base.getMonth() + shift, 1)
  const lastDay = new Date(start.getFullYear(), start.getMonth() + WINDOW_MONTHS, 0)
  const months: MonthTick[] = []
  const d = new Date(start)
  for (let i = 0; i < WINDOW_MONTHS; i++) {
    months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: MONTHS[d.getMonth()], startISO: iso(d) })
    d.setMonth(d.getMonth() + 1)
  }
  const startISO = iso(start)
  const endISO = iso(lastDay)
  return { startISO, endISO, months, totalDays: daysBetween(startISO, endISO) }
}

export function clampWin(dateISO: string, win: TLWindow): string {
  if (dateISO < win.startISO) return win.startISO
  if (dateISO > win.endISO) return win.endISO
  return dateISO
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + days)
  return iso(d)
}

/** px helpers for a measured track width within a given window. */
export function makeScale(width: number, win: TLWindow) {
  const pxPerDay = win.totalDays > 0 ? width / win.totalDays : 0
  return {
    pxPerDay,
    // Clamped to the window — for bands/gridlines that must stay inside view.
    xFor: (dateISO: string) => daysBetween(win.startISO, clampWin(dateISO, win)) * pxPerDay,
    // Raw (can be negative or past `width`) — bars anchor to their true date and
    // are clipped by the lane's overflow, so off-window bars simply scroll away.
    xForRaw: (dateISO: string) => daysBetween(win.startISO, dateISO) * pxPerDay,
    daysForPx: (px: number) => (pxPerDay > 0 ? Math.round(px / pxPerDay) : 0),
  }
}
