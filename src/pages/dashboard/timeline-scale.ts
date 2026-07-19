// Windowed month scale for the allocation-modal Gantt timelines.
// The window is sized from the seat period so the seat always occupies
// SEAT_TRACK_FRACTION of the track (its start/end caps stay in view at any
// screen width), and can be panned left/right with the section arrows
// (shift = number of whole months offset from the seat-centred base window).

import { daysBetween } from './format'

export const TL_TODAY = '2026-07-10'

// Share of the track the seat window should span in the default (un-panned)
// view. The remaining space is split evenly as left/right margins, so both seat
// caps read with breathing room. This is a fraction of DAYS, so it holds at any
// pixel width — the seat is always 75% of the track regardless of screen size.
export const SEAT_TRACK_FRACTION = 0.75

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const addDays = (dateISO: string, days: number) => {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + days)
  return iso(d)
}
const addMonths = (dateISO: string, months: number) => {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  return iso(d)
}

export interface MonthTick { key: string; label: string; startISO: string }
export interface TLWindow {
  startISO: string
  endISO: string
  months: MonthTick[]
  totalDays: number
}

/** Month-boundary ticks covering [startISO, endISO]. The window can open/close
 *  mid-month, so the leading tick clamps to the left edge (`xFor` clamps) — but
 *  a sub-12-day leading sliver is dropped, since its label would crowd the next
 *  month's (both sit near x=0). */
function monthTicks(startISO: string, endISO: string): MonthTick[] {
  const start = new Date(`${startISO}T00:00:00`)
  const end = new Date(`${endISO}T00:00:00`)
  const ticks: MonthTick[] = []
  const d = new Date(start.getFullYear(), start.getMonth(), 1)
  while (d <= end) {
    const tickISO = iso(d)
    const nextISO = iso(new Date(d.getFullYear(), d.getMonth() + 1, 1))
    // Full months (tick ≥ window start) always show; a leading partial month
    // shows only when ≥12 of its days remain in view.
    if (tickISO >= startISO || daysBetween(startISO, nextISO) >= 12)
      ticks.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: MONTHS[d.getMonth()], startISO: tickISO })
    d.setMonth(d.getMonth() + 1)
  }
  return ticks
}

/**
 * Build the visible window from the seat period so the seat spans
 * SEAT_TRACK_FRACTION of the track, centred (equal margins). `shift` pans the
 * whole window by whole months without changing its span (the seat stays 75%
 * wide, it just slides).
 */
export function buildWindow(seat: { startDate: string; endDate: string }, shift = 0): TLWindow {
  const seatDays = Math.max(1, daysBetween(seat.startDate, seat.endDate))
  // 75% seat ⇒ 25% margin total ⇒ (1/0.75 − 1)/2 = 1/6 of the seat span each side.
  const margin = Math.max(1, Math.round((seatDays * (1 / SEAT_TRACK_FRACTION - 1)) / 2))
  const startISO = addMonths(addDays(seat.startDate, -margin), shift)
  const endISO = addMonths(addDays(seat.endDate, margin), shift)
  return { startISO, endISO, months: monthTicks(startISO, endISO), totalDays: daysBetween(startISO, endISO) }
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
