#!/usr/bin/env python3
"""
Capture Allox Positions states as self-contained HTML for the html.to.design Figma plugin.
- viewport 1512x982, device scale 1 (whole-pixel computed values)
- inline all CSS, base64 all fonts, rename Geist Sans -> Geist
- snap fractional widths / letter-spacing to integers
Each state is driven by Playwright clicks, then the live DOM is serialized.
"""
import sys, os, base64, re, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8202/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/home/claude/figma_states"
os.makedirs(OUT, exist_ok=True)

# JS run in page to produce a self-contained HTML string of the current DOM.
SERIALIZE = r"""
async () => {
  // 1) inline every stylesheet's rules into a single <style>
  const cssChunks = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
      cssChunks.push(rules);
    } catch (e) { /* cross-origin, skip */ }
  }
  let css = cssChunks.join('\n');

  // 2) inline font files referenced by url(...) as base64 data URIs
  const urlRe = /url\(([^)]+)\)/g;
  const seen = {};
  const urls = new Set();
  let m;
  while ((m = urlRe.exec(css))) {
    let u = m[1].replace(/['"]/g, '').trim();
    if (u.startsWith('data:')) continue;
    urls.add(u);
  }
  for (const u of urls) {
    try {
      const abs = new URL(u, location.href).href;
      const resp = await fetch(abs);
      const buf = await resp.arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const ext = abs.split('.').pop().split('?')[0].toLowerCase();
      const mime = ext === 'woff2' ? 'font/woff2' : ext === 'woff' ? 'font/woff'
                 : ext === 'ttf' ? 'font/ttf' : (ext === 'png' ? 'image/png' : 'application/octet-stream');
      seen[u] = `data:${mime};base64,${b64}`;
    } catch (e) {}
  }
  css = css.replace(urlRe, (full, g1) => {
    const key = g1.replace(/['"]/g, '').trim();
    return seen[key] ? `url('${seen[key]}')` : full;
  });

  // 3) rename Geist Sans -> Geist (Figma knows the family as "Geist")
  css = css.replace(/Geist Sans/g, 'Geist');

  // 4) inline <img> assets as base64
  for (const img of Array.from(document.images)) {
    try {
      if (img.src.startsWith('data:')) continue;
      const resp = await fetch(img.src);
      const buf = await resp.arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      img.setAttribute('src', `data:image/png;base64,${btoa(bin)}`);
    } catch (e) {}
  }

  // 5) Normalise typography for a clean Figma import:
  //    - force the "Geist" family on every element (Geist only — no fallback, no mono),
  //    - bake letter-spacing and fractional line-height to whole px. getComputedStyle
  //      resolves em -> px, so this removes the fractional tracking / line-height that
  //      html.to.design would otherwise import as "weird" decimal values.
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    el.style.fontFamily = 'Geist';
    const ls = cs.letterSpacing;
    if (ls && ls !== 'normal' && ls.endsWith('px')) {
      const n = Math.round(parseFloat(ls));
      el.style.letterSpacing = n === 0 ? 'normal' : n + 'px';
    }
    const lh = cs.lineHeight;
    if (lh && lh.endsWith('px')) {
      const v = parseFloat(lh);
      if (Math.round(v) !== v) el.style.lineHeight = Math.round(v) + 'px';
    }
  }

  const bodyHTML = document.body.innerHTML;
  const lang = document.documentElement.getAttribute('class') || '';
  return { css, bodyHTML, lang };
}
"""

def snap_integers(html):
    # snap fractional px widths and letter-spacing in inline styles to integers
    def fix_px(mm):
        prop, val = mm.group(1), float(mm.group(2))
        return f"{prop}:{round(val)}px"
    html = re.sub(r"(width|min-width|max-width|letter-spacing|gap|left|right):\s*([0-9]+\.[0-9]+)px", fix_px, html)
    return html

def force_geist(html):
    # Resolve font variables to a single literal "Geist" family — no fallback stack,
    # and collapse the mono family to Geist too, so Figma sees "Geist" only.
    html = html.replace("var(--font-sans)", '"Geist"').replace("var(--font-mono)", '"Geist"')
    html = re.sub(r"--font-sans:\s*[^;]+;", '--font-sans:"Geist";', html)
    html = re.sub(r"--font-mono:\s*[^;]+;", '--font-mono:"Geist";', html)
    return html

def wrap(css, body, lang):
    body = force_geist(snap_integers(body))
    css = force_geist(css)
    return f"""<!doctype html>
<html lang="en" class="{lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=1512, initial-scale=1">
<style>{css}</style></head>
<body style="width:1512px">{body}</body></html>"""

def save(page, name):
    # The floating flask is a personal dev toggle — keep it out of design exports.
    page.evaluate("document.querySelectorAll('button[aria-label*=\"list-based\"]').forEach(b => b.remove())")
    page.evaluate("document.querySelectorAll('[title^=\"Prototype scope\"]').forEach(el => el.remove())")
    data = page.evaluate(SERIALIZE)
    html = wrap(data["css"], data["bodyHTML"], data["lang"])
    path = os.path.join(OUT, f"{name}.html")
    open(path, "w", encoding="utf-8").write(html)
    print("saved", name, f"{len(html)//1024}kb")

def reset(page):
    # Reload to a clean Plan view so no overlay from a prior state leaks into the next capture.
    page.goto(BASE, wait_until="networkidle"); page.wait_for_timeout(600)
    try:
        page.get_by_role("link", name="Positions").first.click(timeout=2500); page.wait_for_timeout(600)
    except Exception:
        pass

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1512, "height": 982}, device_scale_factor=1)
    pg.goto(BASE, wait_until="networkidle"); pg.wait_for_timeout(700)
    try:
        pg.get_by_role("link", name="Positions").first.click(timeout=2500); pg.wait_for_timeout(700)
    except Exception as e: print("nav:", e)

    # 01 Plan
    save(pg, "01_plan")

    # 02 Positions tab
    reset(pg)
    try:
        pg.get_by_role("tab", name="Positions").first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "02_positions")
    except Exception as e: print("positions tab:", e)

    # 03 Needs review tab
    reset(pg)
    try:
        pg.get_by_role("tab", name=re.compile("Needs review")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "03_needs_review")
    except Exception as e: print("needs tab:", e)

    # 04 Detail panel (click first populated cell)
    reset(pg)
    try:
        pg.get_by_text(re.compile(r"^[0-9]+ / [0-9]+$")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "04_detail_panel")
    except Exception as e: print("panel:", e)

    # 05 Change log
    reset(pg)
    try:
        pg.get_by_role("button", name=re.compile("Change log")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "05_change_log")
    except Exception as e: print("log:", e)

    # 06 Create modal
    reset(pg)
    try:
        pg.get_by_role("button", name=re.compile("New position")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "06_create_modal")
    except Exception as e: print("create:", e)

    # 07 Open-request modal (from Needs review; Extend was removed per PRD)
    reset(pg)
    try:
        pg.get_by_role("tab", name=re.compile("Needs review")).first.click(timeout=2500); pg.wait_for_timeout(600)
        pg.get_by_role("button", name=re.compile("Open request")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "07_open_request_modal")
    except Exception as e: print("open request:", e)

    # 08 Close modal (from Needs review — per-row close is an icon labelled "Close <role>")
    reset(pg)
    try:
        pg.get_by_role("tab", name=re.compile("Needs review")).first.click(timeout=2500); pg.wait_for_timeout(600)
        pg.get_by_role("button", name=re.compile(r"^Close .")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "08_close_modal")
    except Exception as e: print("close:", e)

    # 09 Range picker open
    reset(pg)
    try:
        pg.get_by_text(re.compile(r"'26 . .*'26")).first.click(timeout=2500); pg.wait_for_timeout(600)
        save(pg, "09_range_picker_open")
    except Exception as e: print("range:", e)

    # 10 Dept select open
    reset(pg)
    try:
        pg.get_by_text("All departments").first.click(timeout=2500); pg.wait_for_timeout(600)
        save(pg, "10_dept_select_open")
    except Exception as e: print("dept:", e)

    # 12 Detail panel over Plan — a past-due cell (Senior Software Engineer, May 0/3):
    # Filled/Open/Past due sections, grouped by location, Extend/Close per group + bulk footer.
    reset(pg)
    try:
        pg.get_by_text(re.compile(r"^0 / 3$")).first.click(timeout=2500); pg.wait_for_timeout(800)
        save(pg, "12_detail_panel_pastdue")
    except Exception as e: print("detail pastdue:", e)

    # 13 Detail panel over Plan — an open (not past-due) cell (Senior Software Engineer, Aug 0/6):
    # the Open section with grouped locations, per-row Close, and a Close-all footer.
    reset(pg)
    try:
        pg.get_by_text(re.compile(r"^0 / 6$")).first.click(timeout=2500); pg.wait_for_timeout(800)
        save(pg, "13_detail_panel_open")
    except Exception as e: print("detail open:", e)

    # 14 List-based create modal (experimental, AJ's proposal) — default single line.
    reset(pg)
    try:
        pg.get_by_role("button", name=re.compile("New position")).first.click(timeout=2500); pg.wait_for_timeout(700)
        save(pg, "14_create_list_modal")
    except Exception as e: print("list modal:", e)

    # 15 List-based create modal — multi-line batch (3 lines, one count bumped).
    reset(pg)
    try:
        pg.get_by_role("button", name=re.compile("New position")).first.click(timeout=2500); pg.wait_for_timeout(600)
        pg.get_by_role("button", name="Add position").click(timeout=2500); pg.wait_for_timeout(300)
        pg.get_by_role("button", name="Add position").click(timeout=2500); pg.wait_for_timeout(300)
        pg.get_by_label("More").first.click(timeout=2500); pg.wait_for_timeout(400)
        save(pg, "15_create_list_modal_batch")
    except Exception as e: print("list modal batch:", e)

    b.close()
print("DONE")
