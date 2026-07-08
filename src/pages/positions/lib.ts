// Shared selectors that turn the cell engine into role-month rows for the Positions tab.
import { type Cells, type Cell, cItems, cFilled, cOpenN, cPastDue, cClosedCount, cNoReq, openAgeLabel, daysOpen, cellKey } from "@/lib/positions/model";
import { BASE_ROLES, DEPT_ORDER, type Role } from "@/lib/positions/roles";
import { TIMELINE, monthFull } from "@/lib/positions/time";

export type StatusFilter = "open" | "filled" | "closed";

export interface PosRow {
  id: string;            // title|mk
  title: string;
  label: string;
  chip: string | null;
  dept: string;
  mk: string;
  monthLabel: string;
  total: number;
  filled: number;
  open: number;
  pending: number;       // past due
  closed: number;
  noReq: number;
  age: string;
  ageDays: number;                       // numeric age for sorting the "Open for" column
  people: { name: string; loc: string }[];
  locs: { loc: string; n: number }[];   // location split across non-closed positions
  notes: number;                         // note count (mock until a real notes model exists)
  reopened: boolean;                     // provenance: a placement ended and the position reopened
  reopenedFrom?: string;                 // the human story ("Marta K. left the role on Jun 9")
}

// Notes on a role-month position row (mirrors the Deals notes pattern).
export interface PosNote { id: string; author: string; date: string; text: string; isNew?: boolean }

// Deterministic mock notes until a real notes model exists — ~40% of rows carry
// 1–2 seeded notes so the Notes column and panel section read like the design.
const SEED_NOTE_TEXTS = [
  "Talent flagged this req as hard to fill at the current band — open to senior-adjacent candidates if the core skills are there.",
  "Prioritise India hires to land before the Q3 ramp. Europe can trail a month if needed.",
  "Backfill context: previous person left mid-project. Recruiting can reuse the old scorecard, role scope unchanged.",
  "Hiring manager prefers candidates who can overlap 4+ hours with the EU team, timezone matters more than hub.",
]
export function seedNotes(id: string): PosNote[] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const r = h % 5;
  const n = r >= 3 ? r - 2 : 0; // 3 -> 1 note, 4 -> 2 notes, else none
  return Array.from({ length: n }, (_, i) => ({
    id: `${id}-note-${i}`,
    author: i === 0 ? "Kenny L." : "Queenie",
    date: i === 0 ? "08.06.2026" : "28.05.2026",
    text: SEED_NOTE_TEXTS[(h + i) % SEED_NOTE_TEXTS.length],
  }));
}
export const noteCount = (id: string) => seedNotes(id).length;

function rowFor(role: Role, mk: string, c: Cell): PosRow {
  const people = cItems(c).filter((p) => (p.status === "started" || p.status === "accepted") && p.person)
    .map((p) => ({ name: p.person!.name, loc: p.person!.loc }));
  const locMap: Record<string, number> = {};
  cItems(c).filter((p) => p.status !== "closed").forEach((p) => { if (p.loc) locMap[p.loc] = (locMap[p.loc] || 0) + 1; });
  const locs = Object.entries(locMap).map(([loc, n]) => ({ loc, n }));
  return {
    id: cellKey(role.title, mk),
    title: role.title, label: role.label, chip: role.chip, dept: role.dept, mk,
    monthLabel: monthFull(mk),
    // Active positions only — closed records live in the panel's Closed section,
    // not in the headcount. Keeps the table consistent with the metric cards and Plan grid.
    total: cItems(c).filter((p) => p.status !== "closed").length,
    filled: cFilled(c), open: cOpenN(c) - cPastDue(c, mk), pending: cPastDue(c, mk),
    closed: cClosedCount(c), noReq: cNoReq(c),
    age: openAgeLabel(c),
    ageDays: daysOpen(c),
    people,
    locs,
    notes: noteCount(cellKey(role.title, mk)),
    reopened: !!c.reopened,
    reopenedFrom: c.reopenedFrom,
  };
}

// All role-month rows that have any record, filtered by the segmented status.
export function rowsForStatus(cells: Cells, status: StatusFilter, search: string, dept: string): PosRow[] {
  const out: PosRow[] = [];
  for (const role of BASE_ROLES) {
    if (dept !== "All" && role.dept !== dept) continue;
    if (search && !role.title.toLowerCase().includes(search.toLowerCase())) continue;
    for (const m of TIMELINE) {
      const c = cells[cellKey(role.title, m.key)];
      if (!c) continue;
      const r = rowFor(role, m.key, c);
      const keep =
        status === "open" ? (r.open + r.pending) > 0 :
        status === "filled" ? r.filled > 0 :
        r.closed > 0;
      if (keep) out.push(r);
    }
  }
  return out;
}

export interface DeptSection { key: string; label: string; rows: PosRow[] }
export function groupByDept(rows: PosRow[]): DeptSection[] {
  const by: Record<string, PosRow[]> = {};
  for (const r of rows) (by[r.dept] ||= []).push(r);
  return DEPT_ORDER.filter((d) => by[d]?.length).map((d) => ({ key: d, label: d, rows: by[d] }));
}

// Individual position records for the detail panel (the grain role-month rows hide).
import { type PosItem } from "@/lib/positions/model";
export interface DetailRecord {
  id: string; status: PosItem["status"]; loc: string;
  person?: { name: string; loc: string; start: string; stage: string };
  noReq?: boolean; closedReason?: string; closedBy?: string; closedTs?: string;
}
export function recordsForRow(cells: Cells, rowId: string): DetailRecord[] {
  const c = cells[rowId];
  if (!c) return [];
  const order: Record<string, number> = { started: 0, accepted: 1, pending: 2, open: 3, closed: 4 };
  return cItems(c)
    .map((p) => ({ id: p.id, status: p.status, loc: p.loc, person: p.person, noReq: p.noReq, closedReason: p.closedReason, closedBy: p.closedBy, closedTs: p.closedTs }))
    .sort((a, b) => order[a.status] - order[b.status]);
}

// Needs review queue at decision grain: one item per role × month × location × kind.
// A location group is the unit you'd actually act on (you never close half of
// "2 Europe past due"), and each row carries the exact record ids it covers so
// the wizards open pre-scoped.
export interface ReviewItem {
  id: string;              // title|mk|loc|kind — unique row key
  rowId: string;           // title|mk — the PosRow this belongs to
  title: string; dept: string; mk: string; monthLabel: string;
  loc: string;
  kind: "noreq" | "pending"; n: number; days: number; age: string;
  recIds: string[];
  reopened?: boolean;                    // cell-level provenance, shown on no-request rows
  reopenedFrom?: string;                 // the human story behind the reopen
}
export function needsReviewItems(cells: Cells): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const role of BASE_ROLES) {
    for (const m of TIMELINE) {
      const c = cells[cellKey(role.title, m.key)];
      if (!c) continue;
      const actionable = cItems(c).filter((p) => p.status === "open" || p.status === "pending");
      const noReqRecs = actionable.filter((p) => p.noReq);
      const pastDueRecs = actionable.filter((p) => !p.noReq && (isPastDueMonth(m.key) || p.status === "pending"));
      const emit = (kind: "noreq" | "pending", recs: typeof actionable) => {
        const byLoc = new Map<string, typeof actionable>();
        recs.forEach((r) => { const k = r.loc || "Unassigned"; if (!byLoc.has(k)) byLoc.set(k, []); byLoc.get(k)!.push(r); });
        for (const [loc, list] of byLoc) {
          out.push({
            id: `${cellKey(role.title, m.key)}|${loc}|${kind}`,
            rowId: cellKey(role.title, m.key),
            title: role.title, dept: role.dept, mk: m.key,
            monthLabel: monthFull(m.key),
            loc, kind, n: list.length,
            days: daysOpen(c), age: openAgeLabel(c),
            recIds: list.map((r) => r.id),
            reopened: kind === "noreq" && !!c.reopened,
            reopenedFrom: kind === "noreq" && c.reopened ? c.reopenedFrom : undefined,
          });
        }
      };
      emit("pending", pastDueRecs);
      emit("noreq", noReqRecs);
    }
  }
  return out.sort((a, b) => b.days - a.days);
}
export const needsReviewCount = (cells: Cells) => needsReviewItems(cells).reduce((s, r) => s + r.n, 0);

// Plan grid: a role's cells across the visible month window.
import { CURRENT_KEY } from "@/lib/positions/time";
import { isPastDueMonth } from "@/lib/positions/model";
export interface GridCell {
  mk: string; total: number; filled: number; open: number; pending: number; noReq: number;
  past: boolean; done: boolean; empty: boolean; reopened: boolean;
  dots: { status: string }[];
}
export interface GridRow { title: string; dept: string; cells: GridCell[] }

export function planGrid(cells: Cells, months: string[], search: string, dept: string, showAll = false): { dept: string; rows: GridRow[] }[] {
  const out: { dept: string; rows: GridRow[] }[] = [];
  for (const d of DEPT_ORDER) {
    if (dept !== "All" && d !== dept) continue;
    if (d === "Exec & Advisory") continue; // not planned here
    const rows: GridRow[] = [];
    for (const role of BASE_ROLES.filter((r) => r.dept === d)) {
      if (search && !role.title.toLowerCase().includes(search.toLowerCase())) continue;
      // only roles that have any position in the window
      // Default view trims the grid to roles with ACTIVE positions in the window —
      // the role list grows to all of Fluxon (incl. ops), so empty rows hide unless
      // "All roles" is on (Kenny, Jul 6). Closed-only cells don't count as planned.
      const hasAny = months.some((mk) => { const c = cells[cellKey(role.title, mk)]; return c && cItems(c).some((p) => p.status !== "closed"); });
      if (!hasAny && !showAll) continue;
      const gcells: GridCell[] = months.map((mk) => {
        const c = cells[cellKey(role.title, mk)];
        const total = c ? cItems(c).filter((p) => p.status !== "closed").length : 0;
        const filled = c ? cFilled(c) : 0;
        const open = c ? cOpenN(c) - cPastDue(c, mk) : 0;
        const pending = c ? cPastDue(c, mk) : 0;
        const noReq = c ? cNoReq(c) : 0;
        // Past-due is month-aware: an open position sitting in a month before the current one is
        // overdue even though its stored status is still "open". Render its dot as past-due so it
        // matches the orange cell, instead of reading as a healthy blue "open" dot.
        // No-request positions read grey everywhere — nothing is being recruited yet.
        const dots = c ? cItems(c).filter((p) => p.status !== "closed").map((p) => ({
          status: ((p.status === "open" || p.status === "pending") && p.noReq) ? "noreq"
            : (isPastDueMonth(mk) && (p.status === "open" || p.status === "pending")) ? "pending"
            : p.status,
        })) : [];
        return { mk, total, filled, open, pending, noReq, past: mk < CURRENT_KEY, done: total > 0 && filled >= total, empty: total === 0, reopened: !!(c && c.reopened), dots };
      });
      rows.push({ title: role.title, dept: d, cells: gcells });
    }
    if (rows.length) out.push({ dept: d, rows });
  }
  return out;
}

// Top metric rollup across the whole cells map.
export interface Rollup { total: number; filled: number; open: number; pending: number; noReq: number; closed: number; needsReview: number }
export function rollup(cells: Cells): Rollup {
  let total = 0, filled = 0, openN = 0, pending = 0, noReq = 0, closed = 0;
  for (const k of Object.keys(cells)) {
    const c = cells[k];
    const mk = k.split("|")[1] || CURRENT_KEY;
    total += cItems(c).filter((p) => p.status !== "closed").length;
    filled += cFilled(c);
    openN += cOpenN(c) - cPastDue(c, mk);
    pending += cPastDue(c, mk);
    noReq += cNoReq(c);
    closed += cClosedCount(c);
  }
  return { total, filled, open: openN, pending, noReq, closed, needsReview: pending + noReq };
}

// Unified Positions table: every role-month with any active (non-closed) position.
// Open and Filled live in one list; the row shows filled/total + a status breakdown.
export function unifiedRows(cells: Cells, search: string, dept: string, onlyOpen: boolean): PosRow[] {
  const out: PosRow[] = [];
  for (const role of BASE_ROLES) {
    if (dept !== "All" && role.dept !== dept) continue;
    if (search && !role.title.toLowerCase().includes(search.toLowerCase())) continue;
    for (const m of TIMELINE) {
      const c = cells[cellKey(role.title, m.key)];
      if (!c) continue;
      const r = rowFor(role, m.key, c);
      if (r.total === 0) continue;            // no active positions
      if (onlyOpen && r.open + r.pending === 0) continue;
      out.push(r);
    }
  }
  return out;
}

// AJ's proposal (third scope pill): the Positions list at individual grain —
// one row per position record instead of role-month aggregates. Age and person
// are per record, which is what makes the "Open for" / "Person" columns well-defined.
export type IndividualStatus = "started" | "accepted" | "open" | "pastdue" | "noreq";
export interface IndividualRow {
  id: string;             // record id
  rowId: string;          // title|mk — parent cell, scopes the panel and wizards
  title: string; dept: string; mk: string; monthLabel: string;
  status: IndividualStatus;
  loc: string;
  person?: { name: string; loc: string; start: string; stage: string };
  age: string; ageDays: number;
  reopened: boolean; reopenedFrom?: string;
}
const INDIV_FILTER: Record<string, IndividualStatus[]> = {
  filled: ["started", "accepted"],
  open: ["open"],
  pending: ["pastdue"],
  noreq: ["noreq"],
};
export function individualRows(cells: Cells, search: string, dept: string, status: string): IndividualRow[] {
  const out: IndividualRow[] = [];
  for (const role of BASE_ROLES) {
    if (dept !== "All" && role.dept !== dept) continue;
    if (search && !role.title.toLowerCase().includes(search.toLowerCase())) continue;
    for (const m of TIMELINE) {
      const c = cells[cellKey(role.title, m.key)];
      if (!c) continue;
      for (const p of cItems(c)) {
        if (p.status === "closed") continue;
        const effective: IndividualStatus =
          (p.status === "open" || p.status === "pending") && p.noReq ? "noreq" :
          p.status === "pending" || (p.status === "open" && isPastDueMonth(m.key)) ? "pastdue" :
          (p.status as IndividualStatus);
        if (status !== "all" && !INDIV_FILTER[status]?.includes(effective)) continue;
        out.push({
          id: p.id,
          rowId: cellKey(role.title, m.key),
          title: role.title, dept: role.dept, mk: m.key, monthLabel: monthFull(m.key),
          status: effective,
          loc: p.loc,
          person: p.person,
          age: effective === "started" || effective === "accepted" ? "—" : openAgeLabel(c),
          ageDays: daysOpen(c),
          reopened: effective === "noreq" && !!c.reopened,
          reopenedFrom: effective === "noreq" && c.reopened ? c.reopenedFrom : undefined,
        });
      }
    }
  }
  return out;
}

// Earliest month index that still has an open/past-due request, for the default window.
export function earliestOpenIdx(cells: Cells): number {
  for (let i = 0; i < TIMELINE.length; i++) {
    const mk = TIMELINE[i].key;
    const hasOpen = BASE_ROLES.some((r) => { const c = cells[cellKey(r.title, mk)]; return c && cOpenN(c) > 0; });
    if (hasOpen) return i;
  }
  return TIMELINE.findIndex((m) => m.key === CURRENT_KEY);
}

// Department rollup for the Plan group headers ("124 filled · 23 open"), within a month window.
export function deptRollup(cells: Cells, dept: string, months: string[]): { filled: number; open: number } {
  let filled = 0, open = 0;
  for (const role of BASE_ROLES.filter((r) => r.dept === dept)) {
    for (const mk of months) {
      const c = cells[cellKey(role.title, mk)];
      if (!c) continue;
      filled += cFilled(c);
      open += cOpenN(c);
    }
  }
  return { filled, open };
}

// Per-role rollup across the window, for the role sub-count line ("42 filled · 12 open").
export function roleRollup(cells: Cells, title: string, months: string[]): { filled: number; open: number } {
  let filled = 0, open = 0;
  for (const mk of months) {
    const c = cells[cellKey(title, mk)];
    if (!c) continue;
    filled += cFilled(c);
    open += cOpenN(c);
  }
  return { filled, open };
}
