// Shared fixtures for the Positions page Storybook stories.
//
// Rather than hand-crafting fragile mock objects, these reuse the real seed data
// (`makeSeedCells`) and the pure selector functions in `./lib`. That keeps the
// stories representative of production data and correct as the model evolves.
import { makeSeedCells, SEED_ACTIVITY } from '@/lib/positions/seed'
import {
  cellKey, cItems, cFilled, cOpenN, cPastDue, cClosedCount, cNoReq, openAgeLabel,
} from '@/lib/positions/model'
import { BASE_ROLES } from '@/lib/positions/roles'
import { TIMELINE, monthFull } from '@/lib/positions/time'
import {
  unifiedRows, groupByDept, planGrid, recordsForRow, needsReviewItems,
  deptRollup, roleRollup, rollup, earliestOpenIdx,
  type PosRow, type DetailRecord, type ReviewItem, type Rollup, type DeptSection, type GridRow,
} from './lib'
import { type ActivityItem } from '@/lib/positions/seed'

// A single, shared cell engine for every story in this folder.
export const cells = makeSeedCells()

// ── PosRow reconstruction ───────────────────────────────────────────────────
// `rowFor` in lib.ts isn't exported, so mirror it here using the exported model
// getters. Lets detail-panel stories target any role-month cell precisely.
export function makeRow(title: string, mk: string): PosRow {
  const c = cells[cellKey(title, mk)]
  const role = BASE_ROLES.find((r) => r.title === title)!
  const people = cItems(c)
    .filter((p) => (p.status === 'started' || p.status === 'accepted') && p.person)
    .map((p) => ({ name: p.person!.name, loc: p.person!.loc }))
  const locMap: Record<string, number> = {}
  cItems(c).filter((p) => p.status !== 'closed').forEach((p) => { if (p.loc) locMap[p.loc] = (locMap[p.loc] || 0) + 1 })
  const locs = Object.entries(locMap).map(([loc, n]) => ({ loc, n }))
  return {
    id: cellKey(title, mk),
    title, label: role.label, chip: role.chip, dept: role.dept, mk,
    monthLabel: monthFull(mk),
    total: cItems(c).length,
    filled: cFilled(c),
    open: cOpenN(c) - cPastDue(c, mk),
    pending: cPastDue(c, mk),
    closed: cClosedCount(c),
    noReq: cNoReq(c),
    age: openAgeLabel(c),
    people,
    locs,
  }
}

// ── MetricCards ─────────────────────────────────────────────────────────────
export const rollupReal: Rollup = rollup(cells)
export const rollupNoReview: Rollup = { ...rollupReal, pending: 0, noReq: 0, needsReview: 0 }
export const rollupHeavyBacklog: Rollup = {
  total: 120, filled: 40, open: 55, pending: 25, noReq: 12, closed: 8, needsReview: 37,
}

// ── PositionsTable ──────────────────────────────────────────────────────────
export const tableSectionsOpen: DeptSection[] = groupByDept(unifiedRows(cells, '', 'All', true))
export const tableSectionsAll: DeptSection[] = groupByDept(unifiedRows(cells, '', 'All', false))
export const firstRowId: string | undefined = tableSectionsOpen[0]?.rows[0]?.id

// ── PlanGrid ────────────────────────────────────────────────────────────────
const planStartIdx = earliestOpenIdx(cells)
export const planMonths: string[] = TIMELINE.slice(planStartIdx, planStartIdx + 6).map((m) => m.key)

function rollupsFor(groups: { dept: string; rows: GridRow[] }[], months: string[]) {
  return groups.map((g) => ({
    dept: g.dept,
    ...deptRollup(cells, g.dept, months),
    roleRollups: Object.fromEntries(g.rows.map((r) => [r.title, roleRollup(cells, r.title, months)])),
  }))
}

export const planGroups = planGrid(cells, planMonths, '', 'All')
export const planRollups = rollupsFor(planGroups, planMonths)

export const planSearch = 'engineer'
export const planGroupsSearch = planGrid(cells, planMonths, planSearch, 'All')
export const planRollupsSearch = rollupsFor(planGroupsSearch, planMonths)

// ── PositionDetailPanel ─────────────────────────────────────────────────────
// Mixed: someone on staff + open positions.
export const rowMixed = makeRow('Software Engineer', '2026-06')
export const recordsMixed: DetailRecord[] = recordsForRow(cells, rowMixed.id)

// Fully filled (a standing, older cohort). Month label tidied for display.
export const rowFilled: PosRow = { ...makeRow('Staff Software Engineer', '2025-09'), monthLabel: 'September 2025' }
export const recordsFilled: DetailRecord[] = recordsForRow(cells, cellKey('Staff Software Engineer', '2025-09'))

// Past due: an open position sitting in a month that already passed.
export const rowPastDue = makeRow('Product Designer', '2026-05')
export const recordsPastDue: DetailRecord[] = recordsForRow(cells, rowPastDue.id)

// With closed history.
export const rowClosed = makeRow('Software Engineer', '2026-04')
export const recordsClosed: DetailRecord[] = recordsForRow(cells, rowClosed.id)

// ── NeedsReview ─────────────────────────────────────────────────────────────
export const reviewItems: ReviewItem[] = needsReviewItems(cells)
export const reviewNoReq: ReviewItem[] = reviewItems.filter((r) => r.kind === 'noreq')
export const reviewPastDue: ReviewItem[] = reviewItems.filter((r) => r.kind === 'pending')

// ── ChangeLog ───────────────────────────────────────────────────────────────
export const activity: ActivityItem[] = SEED_ACTIVITY

// ── ExtendWizard ────────────────────────────────────────────────────────────
const actionable = (id: string) =>
  recordsForRow(cells, id).filter((r) => r.status === 'open' || r.status === 'pending')

export const extendRecords: DetailRecord[] = actionable(cellKey('Senior Software Engineer', '2026-05'))
export const openReqRecords: DetailRecord[] = actionable(cellKey('Senior Product Manager', '2026-08'))

// ── CloseWizard ─────────────────────────────────────────────────────────────
export const closeRecords: DetailRecord[] = actionable(cellKey('Senior Software Engineer', '2026-08'))
export const closeRecordsProtected: DetailRecord[] = actionable(cellKey('Software Engineer', '2026-06'))
export const closeProtectedFilledCount = cFilled(cells[cellKey('Software Engineer', '2026-06')])
