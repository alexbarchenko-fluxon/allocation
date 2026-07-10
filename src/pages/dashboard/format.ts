// Small date/label helpers shared by the sidebar + modal.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-11-15" → "Nov 15 '26" */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d} '${String(y).slice(2)}`
}

/** Whole weeks between two ISO dates (rounded). */
export function weeksBetween(startISO: string, endISO: string): number {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime()
  return Math.max(1, Math.round(ms / (7 * 86_400_000)))
}

export function daysBetween(startISO: string, endISO: string): number {
  return Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 86_400_000)
}
