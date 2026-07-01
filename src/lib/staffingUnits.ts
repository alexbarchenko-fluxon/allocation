/** Hours per full-time-equivalent week. */
export const HOURS_PER_FTE = 40

/** Default step size (hours) for +/− stepper buttons. */
export const HOURS_STEP = 5

/** Maximum hours per week a single seat can carry. */
export const HOURS_MAX = 200

/** Convert a fractional FTE value to hours per week. */
export function fteToHours(fte: number): number {
  return fte * HOURS_PER_FTE
}

/** Convert hours per week to a fractional FTE value. */
export function hoursToFte(hours: number): number {
  return hours / HOURS_PER_FTE
}

/**
 * Format hours for display: always `N h` with a space and lowercase h.
 * Examples: `0 h`, `5 h`, `20 h`, `40 h`.
 */
export function formatHours(hours: number): string {
  return `${hours} h`
}
