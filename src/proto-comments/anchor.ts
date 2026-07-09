// Element anchoring for prototype comments: pins attach to DOM elements + %-offset,
// never to raw page coordinates — so they survive scroll, resize and layout shifts,
// and work inside dialogs (a dialog's DOM is an element like any other).

export interface Anchor {
  selector: string;       // resilient selector to the anchor element
  xPct: number;           // click offset inside the element, 0..1
  yPct: number;
  label: string;          // human-readable fallback ("button 'Open 2 requests'")
}

// Prefer stable hooks in this order: data-testid, id, aria-label, role=dialog,
// then fall back to a short nth-child path from the nearest stable ancestor.
function stableStep(el: Element): string | null {
  const t = el.getAttribute('data-testid');
  if (t) return `[data-testid="${CSS.escape(t)}"]`;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const aria = el.getAttribute('aria-label');
  if (aria) return `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(aria)}"]`;
  if (el.getAttribute('role') === 'dialog') return '[role="dialog"]';
  return null;
}

function nthStep(el: Element): string {
  const parent = el.parentElement;
  if (!parent) return el.tagName.toLowerCase();
  const idx = Array.from(parent.children).indexOf(el) + 1;
  return `${el.tagName.toLowerCase()}:nth-child(${idx})`;
}

export function buildAnchor(target: Element, clientX: number, clientY: number): Anchor {
  // Walk up from the target collecting steps until a stable hook or body.
  const steps: string[] = [];
  let el: Element | null = target;
  while (el && el !== document.body) {
    const stable = stableStep(el);
    if (stable) { steps.unshift(stable); break; }
    steps.unshift(nthStep(el));
    el = el.parentElement;
  }
  const selector = steps.join(' > ');
  const rect = target.getBoundingClientRect();
  const label =
    target.textContent?.trim().slice(0, 60) ||
    target.getAttribute('aria-label') ||
    target.tagName.toLowerCase();
  return {
    selector,
    xPct: rect.width ? (clientX - rect.left) / rect.width : 0.5,
    yPct: rect.height ? (clientY - rect.top) / rect.height : 0.5,
    label,
  };
}

export function resolveAnchor(a: Anchor): Element | null {
  try {
    return document.querySelector(a.selector);
  } catch {
    return null;
  }
}
