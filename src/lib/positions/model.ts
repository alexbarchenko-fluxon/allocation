// Version A model: a cell's counts expand into discrete individual position records.
// cell.items is the source of truth; all counts derive from it via the getters below.
import { NOW_DATE, CURRENT_KEY } from "./time";

export type PosStatus = "started" | "accepted" | "open" | "pending" | "closed";

export interface PersonRec { name: string; loc: string; start: string; stage: string }
export interface PosItem {
  id: string;
  status: PosStatus;
  loc: string;
  person?: PersonRec;
  opened?: string;
  target?: string;   // YYYY-MM-DD target start date for the hiring request
  noReq?: boolean;
  closedReason?: string;
  closedBy?: string;
  closedTs?: string;
}
export interface Cell {
  total: number;
  filled: number;
  loc: Record<string, number>;
  items: PosItem[];
  opened?: string;
  accepted?: number;
  pending?: number;
  carried?: number;
  noReq?: number;
  reopened?: number;
  reopenedFrom?: string;
  prior?: { chip?: string; loc?: string };
  people?: PersonRec[];
  closed?: { count: number; items: { n: number; reason: string; ts: string; by: string }[] };
}
export type Cells = Record<string, Cell>;

// Per-position state metadata. Dots map to design-system tokens, not hex.
export const POS_STATE: Record<string, { label: string; tone: string }> = {
  started:  { label: "On staff",       tone: "started" },
  accepted: { label: "Offer accepted", tone: "accepted" },
  pending:  { label: "Past due",       tone: "pending" },
  open:     { label: "Open",           tone: "open" },
};

const FILL_NAMES = ["Madelyn Lipshutz","Charlie George","Justin Stanton","Lucas Reed","Olivia Brooks","Noah Turner","Sofia Martinez","Ethan Lee","Ava Wilson","Mason Brown","Isabella Johnson","Logan Davis","Mia Thomas","Liam Anderson","Ella Jackson","Oliver White","Charlotte Harris","James Clark","Ryan Chen","Sarah Kim","David Park","Emma Walsh","Tom Bradley","James Foster"];
let _fillSeq = 0;
const nextFillName = () => { const n = FILL_NAMES[_fillSeq % FILL_NAMES.length]; _fillSeq++; return n; };
let _pidSeq = 1;
export const pid = () => "p" + (_pidSeq++);

export function expandCell(_title: string, mk: string, c: Cell): PosItem[] {
  const items: PosItem[] = [];
  const accepted = c.accepted || 0;
  const started = Math.max(0, c.filled - accepted);
  const pending = c.pending || c.carried || 0;
  const closedCount = c.closed ? c.closed.count : 0;
  const openNow = Math.max(0, (c.total - c.filled - closedCount) - pending);
  const noReq = c.noReq || 0;
  const seq: string[] = [];
  const l = c.loc || {};
  (["India","Europe","North America"]).forEach((k) => { for (let n = 0; n < (l[k] || 0); n++) seq.push(k); });
  let li = 0;
  const locNext = () => seq[li++] || "North America";
  const seededPeople = c.people ? [...c.people] : [];
  const personFor = (loc: string, stage: string): PersonRec => {
    const sp = seededPeople.shift();
    if (sp) return { name: sp.name, loc: sp.loc || loc, start: sp.start, stage: sp.stage || stage };
    return { name: nextFillName(), loc, start: mk + "-01", stage };
  };
  for (let i = 0; i < started; i++) { const loc = locNext(); items.push({ id: pid(), status: "started", loc, person: personFor(loc, "On staff"), opened: c.opened }); }
  for (let i = 0; i < accepted; i++) { const loc = locNext(); items.push({ id: pid(), status: "accepted", loc, person: personFor(loc, "Offer accepted"), opened: c.opened }); }
  for (let i = 0; i < pending; i++) { const loc = locNext(); items.push({ id: pid(), status: "pending", loc, opened: c.opened, noReq: i < noReq }); }
  for (let i = 0; i < openNow; i++) { const loc = locNext(); items.push({ id: pid(), status: "open", loc, opened: c.opened, noReq: (pending + i) < noReq }); }
  if (closedCount > 0 && c.closed) {
    const ci = (c.closed.items && c.closed.items[0]) || ({} as { reason?: string; by?: string; ts?: string });
    for (let i = 0; i < closedCount; i++) { const loc = locNext(); items.push({ id: pid(), status: "closed", loc, opened: c.opened, closedReason: ci.reason, closedBy: ci.by, closedTs: ci.ts }); }
  }
  return items;
}

// ── Derived getters ───────────────────────────────────────────────────────────
export const cItems = (c?: Cell) => (c && c.items) || [];
export const cTotalActive = (c?: Cell) => cItems(c).filter((p) => p.status !== "closed").length;
export const cFilled = (c?: Cell) => cItems(c).filter((p) => p.status === "started" || p.status === "accepted").length;
export const cOpenN = (c?: Cell) => cItems(c).filter((p) => p.status === "open" || p.status === "pending").length;
export const cPending = (c?: Cell) => cItems(c).filter((p) => p.status === "pending").length;
export const cNoReq = (c?: Cell) => cItems(c).filter((p) => (p.status === "open" || p.status === "pending") && p.noReq).length;
export const cClosedCount = (c?: Cell) => cItems(c).filter((p) => p.status === "closed").length;
export const cAccepted = (c?: Cell) => cItems(c).filter((p) => p.status === "accepted").length;

// Month-aware past-due: an open/pending item whose target month is before the current month.
export const isPastDueMonth = (mk: string) => mk < CURRENT_KEY;
export const cPastDue = (c: Cell | undefined, mk: string) =>
  isPastDueMonth(mk) ? cItems(c).filter((p) => p.status === "open" || p.status === "pending").length : cItems(c).filter((p) => p.status === "pending").length;
export const cLoc = (c?: Cell) => { const o: Record<string, number> = { India: 0, Europe: 0, "North America": 0 }; cItems(c).forEach((p) => { if (p.status !== "closed") o[p.loc] = (o[p.loc] || 0) + 1; }); return o; };

export const cellKey = (title: string, mk: string) => title + "|" + mk;

export function daysOpen(cell?: Cell) {
  if (!cell || !cell.opened) return 0;
  return Math.max(0, Math.round((NOW_DATE.getTime() - new Date(cell.opened).getTime()) / 86400000));
}
export function staleTier(cell?: Cell) {
  if (!cell || cOpenN(cell) <= 0) return 0;
  const d = daysOpen(cell);
  if (d > 60) return 2;
  if (d > 30) return 1;
  return 0;
}
export function openAgeLabel(cell?: Cell) {
  if (!cell || !cell.opened) return "—";
  const d = daysOpen(cell);
  // Always a duration so the column scans consistently. "Open for: ___"
  if (d >= 60) return `${Math.round(d / 30)} months`;
  if (d >= 30) return `${Math.round(d / 7)} weeks`;
  if (d >= 14) return `${Math.round(d / 7)} weeks`;
  if (d >= 7) return `${Math.floor(d / 7)} week`;
  if (d >= 2) return `${d} days`;
  if (d === 1) return `1 day`;
  return `today`;
}
