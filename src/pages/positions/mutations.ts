// State mutations on the cells map. Pure: take cells, return new cells.
import { type Cells, type PosItem, cItems, cellKey, pid } from "@/lib/positions/model";
import { CURRENT_KEY, TODAY } from "@/lib/positions/time";

const ACTOR = "Volodymyr S.";

// Extend: move up to n active (open/pending) records from their month to the current month,
// resetting them to open with today's open date (pull-forward-to-current-month, PRD).
// Extend: a past-due request (in a past month) is still needed. Move it forward to the
// current hiring period so it is no longer overdue. Talent keeps working it.
export function extendRequest(cells: Cells, title: string, mk: string, n: number): Cells {
  const fromKey = cellKey(title, mk);
  const toKey = cellKey(title, CURRENT_KEY);
  const from = cells[fromKey];
  if (!from) return cells;
  const moving: PosItem[] = [];
  const remaining: PosItem[] = [];
  for (const p of cItems(from)) {
    if (moving.length < n && (p.status === "pending" || p.status === "open")) moving.push({ ...p, status: "open", opened: TODAY, noReq: false });
    else remaining.push(p);
  }
  const to = cells[toKey] ?? { total: 0, filled: 0, loc: {}, items: [], opened: TODAY };
  const next: Cells = { ...cells, [toKey]: { ...to, opened: to.opened || TODAY, items: [...cItems(to), ...moving] } };
  if (remaining.length === 0) delete next[fromKey]; else next[fromKey] = { ...from, items: remaining };
  return next;
}

// Open request: a no-request position gets a hiring request raised for the current month.
// Clears noReq and stamps today; the record stays in place.
export function openRequest(cells: Cells, title: string, mk: string, n: number): Cells {
  const key = cellKey(title, mk);
  const c = cells[key];
  if (!c) return cells;
  let left = n;
  const items = cItems(c).map((p) => {
    if (left > 0 && p.noReq && (p.status === "open" || p.status === "pending")) { left--; return { ...p, noReq: false, opened: TODAY, status: "open" as const }; }
    return p;
  });
  return { ...cells, [key]: { ...c, items } };
}

// Open a request for a specific no-request record and set its target start date (PRD 2.3).
// The item moves to the target month so the Plan grid reflects the chosen period.
export function openRequestAt(cells: Cells, title: string, mk: string, id: string, targetISO: string): Cells {
  const fromKey = cellKey(title, mk);
  const from = cells[fromKey];
  if (!from) return cells;
  const rec = cItems(from).find((p) => p.id === id);
  if (!rec) return cells;
  const targetMk = targetISO.slice(0, 7);
  const moved = { ...rec, noReq: false, status: "open" as const, opened: TODAY, target: targetISO };
  const remaining = cItems(from).filter((p) => p.id !== id);
  const toKey = cellKey(title, targetMk);
  const to = cells[toKey] ?? { total: 0, filled: 0, loc: {}, items: [], opened: TODAY };
  const next: Cells = { ...cells, [toKey]: { ...to, opened: to.opened || TODAY, items: [...cItems(to), moved] } };
  if (remaining.length === 0) delete next[fromKey]; else next[fromKey] = { ...from, items: remaining };
  return next;
}

// Close: mark n active (open/pending) records closed, retained with the reason.
export function closeRecords(cells: Cells, title: string, mk: string, n: number, reason: string): Cells {
  const key = cellKey(title, mk);
  const c = cells[key];
  if (!c) return cells;
  let left = n;
  const items = cItems(c).map((p) => {
    if (left > 0 && (p.status === "open" || p.status === "pending")) { left--; return { ...p, status: "closed" as const, closedReason: reason, closedBy: ACTOR, closedTs: "Just now" }; }
    return p;
  });
  return { ...cells, [key]: { ...c, items } };
}

// "Extend" was removed per PRD: a late request keeps its target date — the request
// stays open in its target month and simply reads as delayed. Close is the only move.

// By-id variants for the detail panel (act on one specific record).
export function closeOne(cells: Cells, title: string, mk: string, id: string, reason: string): Cells {
  const key = cellKey(title, mk);
  const c = cells[key];
  if (!c) return cells;
  const items = cItems(c).map((p) =>
    p.id === id ? { ...p, status: "closed" as const, closedReason: reason, closedBy: ACTOR, closedTs: "Just now" } : p
  );
  return { ...cells, [key]: { ...c, items } };
}

// Create: open N positions for a role+month, split by location. Always raises a request (MVP).
export function createPositions(
  cells: Cells,
  title: string,
  raiseRequest: boolean,
  startISO: string | null,
  loc: { India: number; Europe: number; "North America": number },
  total?: number,
): Cells {
  const mk = raiseRequest && startISO ? startISO.slice(0, 7) : CURRENT_KEY;
  const opened = raiseRequest && startISO ? startISO : TODAY;
  const key = cellKey(title, mk);
  const existing = cells[key] ?? { total: 0, filled: 0, loc: {}, items: [], opened };
  const add: PosItem[] = [];
  (["India", "Europe", "North America"] as const).forEach((k) => {
    for (let i = 0; i < loc[k]; i++) add.push({ id: pid(), status: "open", loc: k, opened, noReq: !raiseRequest });
  });
  // Positions not assigned to a hub are created as Unassigned.
  const assigned = loc.India + loc.Europe + loc["North America"];
  const unassigned = Math.max(0, (total ?? assigned) - assigned);
  for (let i = 0; i < unassigned; i++) add.push({ id: pid(), status: "open", loc: "Unassigned", opened, noReq: !raiseRequest });
  return { ...cells, [key]: { ...existing, opened: existing.opened || opened, items: [...cItems(existing), ...add] } };
}

// Close specific records by id, with a reason. Used by the close wizard.
export function closeByIds(cells: Cells, title: string, mk: string, ids: string[], reason: string): Cells {
  const key = cellKey(title, mk);
  const c = cells[key];
  if (!c) return cells;
  const idset = new Set(ids);
  const items = cItems(c).map((p) =>
    idset.has(p.id) && (p.status === "open" || p.status === "pending")
      ? { ...p, status: "closed" as const, closedReason: reason, closedBy: "Volodymyr S.", closedTs: "Just now" }
      : p
  );
  return { ...cells, [key]: { ...c, items } };
}
