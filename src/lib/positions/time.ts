export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export interface TMonth { key: string; label: string; year: number; full: string }

export const TIMELINE: TMonth[] = (() => {
  const arr: TMonth[] = [];
  for (let y = 2026; y <= 2027; y++) for (let m = 0; m < 12; m++) {
    if (y === 2026 && m < 2) continue;
    if (y === 2027 && m > 5) break;
    arr.push({ key: `${y}-${String(m + 1).padStart(2, "0")}`, label: MONTH_NAMES[m], year: y, full: `${MONTH_FULL[m]} ${y}` });
  }
  return arr;
})();

export const TODAY = "2026-06-10";
export const CURRENT_KEY = "2026-06";
export const NOW_DATE = new Date(TODAY + "T00:00:00Z");
export const IDX_NOW = TIMELINE.findIndex((m) => m.key === CURRENT_KEY);

export const monthFull = (k: string) => TIMELINE.find((m) => m.key === k)?.full ?? k;
export const fmtFull = (k: string) => `${+k.slice(8,10)} ${MONTH_NAMES[+k.slice(5,7)-1]} ${k.slice(0,4)}`;
export const monthLabel = (mk: string) => MONTH_NAMES[Number(mk.slice(5,7)) - 1].toUpperCase();
