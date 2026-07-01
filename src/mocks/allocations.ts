/**
 * Allocation mock data for all 80 people.
 *
 * Data range: 2024-03-01 → TODAY + 6 months
 *
 * Generation strategy — three phases per person:
 *
 *  Phase 1 – Continuous history
 *    Fills from RANGE_START to the current block with sequential 4–12 week
 *    blocks and 1–3 week bench gaps.  No large empty stretches.
 *    Block mix (per user requirements):
 *      35 % – full cap, single project
 *      35 % – full cap, 2–3 simultaneous projects (hours split to sum to cap)
 *      15 % – under-allocated (25–70 % of cap, one project)
 *      15 % – over-allocated (2 overlapping projects > 100 % total)
 *    ~30 % chance per block revisits an already-used project ("return" pattern)
 *
 *  Phase 2 – Current block  (ALWAYS spans today)
 *    Started 14–59 days ago, ends 60–150 days from now (~3.5 month avg end).
 *
 *  Phase 3 – Optional future block  (~40 % of people)
 *    Represents signed-but-not-started contracts, starting after phase 2 ends.
 */

import { MOCK_PEOPLE } from './people'
import { MOCK_PROJECTS, type AllocationType } from './projects'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Allocation {
  id: string
  personId: string
  /** MOCK_PROJECTS id, or 'ooo' for absence blocks */
  projectId: string
  hoursPerWeek: number
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  type: AllocationType
  /** True when the allocation is non-billable (shown as green "NB" badge in the side panel). */
  nonBillable?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic LCG — same seed always produces the same sequence. */
function seededRng(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4_294_967_296
  }
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function clampDate(d: Date, max: Date): Date {
  return d > max ? max : d
}

// ── Date range ────────────────────────────────────────────────────────────────

const RANGE_START = new Date('2024-03-01')
const TODAY       = new Date()
const RANGE_END   = addDays(TODAY, 180)   // 6 months forward for gantt scroll

// ── Team → project-index pools ────────────────────────────────────────────────

const TEAM_POOL: Record<string, number[]> = {
  'Engineering':          [0, 3, 4, 5, 7, 10, 11, 15, 18],
  'Design':               [6, 7, 8, 13, 16],
  'PM':                   [0, 1, 2, 4, 7, 8, 13, 14, 18],
  'TPM':                  [0, 2, 3, 5, 7, 11, 15, 18],
  'QA':                   [0, 3, 7, 10, 14],
  'Marketing':            [8, 9, 16, 19],
  'Business Development': [1, 4, 8, 14, 18],
  'Finance':              [9, 17, 18, 1],
  'Biz Ops':              [4, 9, 17, 18],
  'Legal':                [12, 17, 9],
  'People Ops':           [17, 19],
  'Talent':               [17, 19],
  'General Ops':          [9, 11, 17],
  'Exec':                 [0, 1, 2, 17],
}

function pickProject(pool: number[], rng: () => number, exclude?: number): number {
  const filtered = exclude !== undefined ? pool.filter((i) => i !== exclude) : pool
  const arr = filtered.length > 0 ? filtered : pool
  return arr[Math.floor(rng() * arr.length)]
}

function projId(idx: number): string {
  return MOCK_PROJECTS[idx % MOCK_PROJECTS.length].id
}

const VALID_HOURS = [5, 10, 15, 20, 25, 30, 35, 40] as const

/** Snap an arbitrary hours value to the nearest valid allocation increment. */
function snapHours(h: number): number {
  return VALID_HOURS.reduce((best, v) =>
    Math.abs(v - h) < Math.abs(best - h) ? v : best
  )
}

// ── Generator ─────────────────────────────────────────────────────────────────

function generateAllocations(): Allocation[] {
  const allocs: Allocation[] = []
  let counter = 0
  const nextId = () => `a${++counter}`

  function push(
    personId: string,
    projectId: string,
    start: Date,
    end: Date,
    hpw: number,
    type: AllocationType,
  ) {
    const s = start < RANGE_START ? RANGE_START : start
    const e = clampDate(end, RANGE_END)
    if (s >= e) return
    allocs.push({ id: nextId(), personId, projectId, hoursPerWeek: hpw, startDate: dateStr(s), endDate: dateStr(e), type })
  }

  MOCK_PEOPLE.forEach((person, idx) => {
    const rng  = seededRng(idx * 53 + 17)
    const cap  = person.employmentType === 'PT' ? 20 : 40
    const pool = TEAM_POOL[person.team] ?? [0, 1, 2, 3]

    // Track every project this person has touched (enables "return" pattern)
    const everUsed: number[] = []
    let lastProjIdx: number | undefined

    function pickNext(exclude?: number): number {
      // ~30 % chance to revisit a previous project once we have history
      if (everUsed.length >= 2 && rng() < 0.30) {
        return everUsed[Math.floor(rng() * everUsed.length)]
      }
      const p = pickProject(pool, rng, exclude)
      if (!everUsed.includes(p)) everUsed.push(p)
      return p
    }

    /**
     * Push one allocation block.  Style is drawn fresh each call so the same
     * person alternates between single-project, parallel, under-, and over-
     * allocated periods naturally over their history.
     */
    function pushBlock(blockStart: Date, blockEnd: Date) {
      const roll = rng()

      if (roll < 0.35) {
        // ── Full cap, single project ──────────────────────────────────────────
        const p = pickNext(lastProjIdx)
        lastProjIdx = p
        push(person.id, projId(p), blockStart, blockEnd, cap, 'project')

      } else if (roll < 0.70) {
        // ── Full cap, 2–3 simultaneous projects (hours sum to cap) ────────────
        const n = rng() < 0.65 ? 2 : 3
        const h = snapHours(cap / n)
        for (let k = 0; k < n; k++) {
          const p = pickNext(k === 0 ? lastProjIdx : undefined)
          if (k === 0) lastProjIdx = p
          // Small date offsets so rows don't start/end on the exact same day
          const sOff = k === 0 ? 0 : Math.floor(rng() * 7)
          const eOff = Math.floor(rng() * 14) - 7
          push(person.id, projId(p),
            addDays(blockStart, sOff),
            addDays(blockEnd,   eOff),
            h, 'project')
        }

      } else if (roll < 0.85) {
        // ── Under-allocated: 25–70 % of cap ──────────────────────────────────
        const h = snapHours(cap * (0.25 + rng() * 0.45))
        const p = pickNext(lastProjIdx)
        lastProjIdx = p
        push(person.id, projId(p), blockStart, blockEnd, h, 'project')

      } else {
        // ── Over-allocated: 2 overlapping projects > 100 % ───────────────────
        const h1 = snapHours(cap * (0.55 + rng() * 0.25))  // 55–80 %
        const h2 = snapHours(cap * (0.40 + rng() * 0.25))  // 40–65 %
        const p1 = pickNext(lastProjIdx)
        const p2 = pickNext(p1)
        lastProjIdx = p2
        push(person.id, projId(p1), blockStart, blockEnd, h1, 'project')
        push(person.id, projId(p2),
          addDays(blockStart, Math.floor(rng() * 7)),
          addDays(blockEnd,   Math.floor(rng() * 14)),
          h2, 'project')
      }
    }

    // ── Phase 2 anchor: current block parameters (drawn first) ────────────────
    const curBackDays = Math.floor(rng() * 45) + 14   // started 14–59 days ago
    const curFwdDays  = Math.floor(rng() * 90) + 60   // ends   60–150 days from now
    const curStart    = addDays(TODAY, -curBackDays)
    const curEnd      = addDays(TODAY,  curFwdDays)

    // ── Phase 1: continuous historical fill ───────────────────────────────────
    // Fills RANGE_START → curStart with 4–12 week blocks and 1–3 week bench gaps.
    let cursor = addDays(RANGE_START, Math.floor(rng() * 30))

    while (true) {
      const room = Math.floor((curStart.getTime() - cursor.getTime()) / 86_400_000)
      // Stop when there's no room for a full block plus clearance to curStart
      if (room < 35) break

      // Block: 28–84 days, but never overlap curStart (leave 14 day clearance)
      const maxDur   = Math.min(room - 14, 84)
      const blockDur = Math.floor(rng() * (maxDur - 28 + 1)) + 28
      const blockEnd = addDays(cursor, blockDur)

      pushBlock(cursor, blockEnd)

      // Bench gap: 1–3 weeks before next block
      const gap = Math.floor(rng() * 14) + 7
      cursor = addDays(blockEnd, gap)
    }

    // ── Phase 2: current block (guaranteed to span today) ─────────────────────
    pushBlock(curStart, curEnd)

    // ── Phase 3: optional signed future contract (~40 % of people) ───────────
    if (rng() < 0.40) {
      const fGap   = Math.floor(rng() * 14) + 7
      const fDur   = Math.floor(rng() * 84) + 42
      const fStart = addDays(curEnd, fGap)
      const fEnd   = addDays(fStart, fDur)
      if (fStart < RANGE_END) {
        pushBlock(fStart, fEnd)
      }
    }

    // ── OOO: annual 2-week vacations + sporadic short absences ───────────────
    //
    // Data spans ~2.5 years (Mar 2024 → ~Sep 2026).  Three year windows:
    //   2024: days  0-300   (Mar-Dec)
    //   2025: days 301-670  (Jan-Dec)
    //   2026: days 671-910  (Jan-Sep)
    //
    // ~85 % of people take one 2-week vacation per year, preferring summer.
    // Short breaks (2-3 days) happen 0-3 times per year for ~70 % of people.
    const yearWindows = [
      { start:   0, end: 300 },
      { start: 301, end: 670 },
      { start: 671, end: 910 },
    ]

    for (const win of yearWindows) {
      const span = win.end - win.start

      // 2-week vacation (~85 % of people per year)
      if (rng() < 0.85) {
        // Spread across the whole year but weight toward the middle third (summer)
        const sumStart = win.start + Math.floor(span * 0.25)
        const sumEnd   = win.start + Math.floor(span * 0.70)
        const vacOff   = sumStart + Math.floor(rng() * (sumEnd - sumStart))
        push(person.id, 'ooo', addDays(RANGE_START, vacOff), addDays(RANGE_START, vacOff + 14), cap, 'ooo')
      }

      // Short breaks: ~70 % of people take 0-3 per year
      if (rng() < 0.70) {
        const numBreaks = Math.floor(rng() * 3) + 1   // 1-3 breaks
        for (let b = 0; b < numBreaks; b++) {
          const brOff = win.start + Math.floor(rng() * span)
          const dur   = 2 + Math.floor(rng() * 2)     // 2-3 days
          push(person.id, 'ooo', addDays(RANGE_START, brOff), addDays(RANGE_START, brOff + dur), cap, 'ooo')
        }
      }
    }

    // ── Internal side-project — ~28 % ────────────────────────────────────────
    if (rng() < 0.28) {
      const off = Math.floor(rng() * 600)
      const dur = Math.floor(rng() * 60) + 20
      const s   = addDays(RANGE_START, off)
      push(person.id, MOCK_PROJECTS[17].id, s, addDays(s, dur), 10, 'internal')
    }
  })

  return allocs
}

// ── Post-process: mark ~27 % of project allocations as non-billable ──────────
// Uses a deterministic hash on the id counter so the seeded RNG above is
// not affected.  Pattern: (n % 5 === 2) || (n % 11 === 4) ≈ 27 % coverage.
function applyNonBillable(allocs: Allocation[]): Allocation[] {
  return allocs.map((a) => {
    if (a.type !== 'project') return a
    const n = parseInt(a.id.slice(1), 10)
    const nb = n % 5 === 2 || n % 11 === 4
    return nb ? { ...a, nonBillable: true } : a
  })
}

// ── Exports ───────────────────────────────────────────────────────────────────

export const MOCK_ALLOCATIONS: Allocation[] = applyNonBillable(generateAllocations())

/** Fast lookup: person ID → their allocations (built once at module load). */
export const ALLOCS_BY_PERSON: Map<string, Allocation[]> = (() => {
  const map = new Map<string, Allocation[]>()
  for (const a of MOCK_ALLOCATIONS) {
    const arr = map.get(a.personId) ?? []
    arr.push(a)
    map.set(a.personId, arr)
  }
  return map
})()
