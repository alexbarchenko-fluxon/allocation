import { type Cell, type Cells, cellKey, expandCell } from "./model";

const seedCells: Cells = {};
const SC = (title: string, mk: string, total: number, filled = 0, loc: Record<string, number> | null = null, extra: Partial<Cell> | null = null) => {
  seedCells[cellKey(title, mk)] = { total, filled, loc: loc ?? { India: 0, Europe: 0, "North America": total }, items: [], ...(extra || {}) } as Cell;
};

// Standing filled headcount (older months, fully filled)
SC("Staff Software Engineer", "2025-09", 12, 12, { India: 5, Europe: 5, "North America": 2 }, { opened: "2025-08-01" });
SC("Senior Software Engineer", "2025-10", 40, 40, { India: 20, Europe: 16, "North America": 4 }, { opened: "2025-09-01" });
SC("Software Engineer", "2025-11", 55, 55, { India: 30, Europe: 20, "North America": 5 }, { opened: "2025-10-01" });
SC("Engineering Manager", "2025-10", 8, 8, { India: 3, Europe: 4, "North America": 1 }, { opened: "2025-09-01" });
SC("Data Engineer", "2025-12", 6, 6, { India: 3, Europe: 3, "North America": 0 }, { opened: "2025-11-01" });
SC("Senior QA Engineer", "2025-11", 9, 9, { India: 6, Europe: 2, "North America": 1 }, { opened: "2025-10-01" });
SC("Senior Product Manager", "2025-10", 7, 7, { India: 1, Europe: 5, "North America": 1 }, { opened: "2025-09-01" });
SC("Product Manager", "2025-11", 10, 10, { India: 2, Europe: 7, "North America": 1 }, { opened: "2025-10-01" });
SC("Senior Product Designer", "2025-10", 6, 6, { India: 1, Europe: 4, "North America": 1 }, { opened: "2025-09-01" });
SC("Product Designer", "2025-11", 8, 8, { India: 2, Europe: 5, "North America": 1 }, { opened: "2025-10-01" });
SC("Senior Technical Project Manager", "2025-11", 9, 9, { India: 4, Europe: 4, "North America": 1 }, { opened: "2025-10-01" });

// Active planning window
SC("Product Designer", "2026-05", 2, 1, { India: 0, Europe: 1, "North America": 1 }, { opened: "2026-04-02" });
SC("Senior Software Engineer", "2026-05", 3, 0, { India: 1, Europe: 2, "North America": 0 }, { opened: "2026-04-20" });
SC("Senior Software Engineer", "2026-06", 4, 1, { India: 2, Europe: 2, "North America": 0 }, { opened: "2026-05-20", accepted: 1 });
SC("Software Engineer", "2026-06", 3, 1, { India: 2, Europe: 0, "North America": 1 }, { opened: "2026-05-28" });
SC("Engineering Manager", "2026-06", 1, 0, { India: 0, Europe: 1, "North America": 0 }, { reopened: 1, noReq: 1, opened: "2026-06-09", reopenedFrom: "Marta K. left the Engineering Manager role on Jun 9", prior: { chip: "Manager", loc: "Europe" } });
SC("Product Manager", "2026-07", 2, 1, null, { opened: "2026-06-10" });
SC("Senior Software Engineer", "2026-07", 4, 1, { India: 2, Europe: 2, "North America": 0 }, { opened: "2026-06-03" });
SC("Senior QA Engineer", "2026-07", 2, 0, null, { opened: "2026-06-04" });
SC("Senior Software Engineer", "2026-08", 6, 0, { India: 3, Europe: 3, "North America": 0 }, { opened: "2026-06-05" });
SC("Software Engineer", "2026-08", 4, 0, { India: 3, Europe: 1, "North America": 0 }, { opened: "2026-06-05" });
SC("Staff Software Engineer", "2026-08", 2, 0, { India: 2, Europe: 0, "North America": 0 }, { opened: "2026-06-05" });
SC("Engineering Manager", "2026-08", 2, 0, { India: 0, Europe: 1, "North America": 1 }, { opened: "2026-06-05" });
SC("Senior Product Manager", "2026-08", 2, 0, null, { opened: "2026-06-05", noReq: 2 });
SC("Product Designer", "2026-08", 3, 0, null, { opened: "2026-06-05" });
SC("Senior QA Engineer", "2026-08", 3, 0, null, { opened: "2026-06-05" });
SC("Senior Program Manager", "2026-08", 1, 0, null, { opened: "2026-06-05", noReq: 1 });
SC("Product Designer", "2026-09", 1, 0, null, { opened: "2026-06-06" });

// Pre-closed positions (Closed filter has history immediately)
SC("Software Engineer", "2026-04", 2, 0, { India: 1, Europe: 1, "North America": 0 }, { opened: "2026-03-01", closed: { count: 2, items: [{ n: 2, reason: "Two L2 deals fell through, headcount no longer funded.", ts: "Apr 28", by: "Kenny L." }] } });
SC("Senior Product Manager", "2026-03", 1, 0, null, { opened: "2026-02-01", closed: { count: 1, items: [{ n: 1, reason: "Reprioritised, the PM scope was absorbed by an existing hire.", ts: "Mar 15", by: "Gabe" }] } });
SC("Data Engineer", "2026-05", 1, 0, { India: 1, Europe: 0, "North America": 0 }, { opened: "2026-04-10", closed: { count: 1, items: [{ n: 1, reason: "Role merged into the Platform team, closing the separate req.", ts: "May 20", by: "Kenny L." }] } });

// People on a few filled positions
seedCells[cellKey("Senior Software Engineer", "2026-06")].people = [{ name: "Madelyn Lipshutz", loc: "India", start: "2026-06-15", stage: "Offer accepted" }];
seedCells[cellKey("Software Engineer", "2026-06")].people = [{ name: "Charlie George", loc: "Europe", start: "2026-06-20", stage: "On staff" }];
seedCells[cellKey("Product Manager", "2026-07")].people = [{ name: "Justin Stanton", loc: "Europe", start: "2026-07-01", stage: "On staff" }];

// Expand every seeded count-cell into real individual position records.
Object.keys(seedCells).forEach((k) => {
  const [title, mk] = k.split("|");
  seedCells[k].items = expandCell(title, mk, seedCells[k]);
});

export function makeSeedCells(): Cells {
  // Deep clone so each mount gets a fresh, independently-mutable copy.
  return JSON.parse(JSON.stringify(seedCells));
}

export interface ActivityItem { id: number; actor: string; auto?: boolean; action: string; ts: string }
export const SEED_ACTIVITY: ActivityItem[] = [
  { id: 0, actor: "Allox", auto: true, action: "1 Product Designer hiring request reached its May 2026 target unfilled, marked past due. It stays in May for BizOps to review, Talent keeps working it until closed.", ts: "Jun 1, 00:00" },
  { id: 6, actor: "Allox", auto: true, action: "Engineering Manager position reopened, Marta K. left the role on Jun 9. Awaiting BizOps decision on whether to file a hiring request.", ts: "Jun 9, 17:30" },
  { id: 1, actor: "Greenhouse", auto: true, action: "Offer accepted, Senior Software Engineer marked filled for June 2026 (+1)", ts: "Today, 09:41" },
  { id: 2, actor: "Kenny L.", action: "closed 2 × Senior Software Engineer for August 2026, reduced from 8 to 6", ts: "Yesterday, 16:20" },
  { id: 3, actor: "BizOps (Queenie)", action: "opened 22 positions for August 2026 across Engineering, Product, Design and QA, sent to Spark", ts: "Jun 5, 11:02" },
  { id: 4, actor: "Greenhouse", auto: true, action: "Offer accepted, Product Manager marked filled for July 2026 (+1)", ts: "Jun 4, 15:18" },
  { id: 5, actor: "BizOps (Queenie)", action: "opened 8 positions for June 2026, sent to Spark", ts: "May 18, 09:10" },
];
