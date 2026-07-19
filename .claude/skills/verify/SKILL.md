---
name: verify
description: Build/launch/drive recipe for verifying UI changes in the Allox prototype (Vite + React).
---

# Verifying Allox UI changes

## Launch

- A dev server is often already running on **http://localhost:5173** (`vite --host`, started by the user from the repo root). It serves the working tree with HMR, so uncommitted edits are live — check it first:
  `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`
- If it's not up: `npm run dev` (Vite picks the next free port if 5173 is taken; read the port from its output).

## Routes

React Router routes live in [src/App.tsx](../../src/App.tsx) — e.g. `/dashboard`, `/people`. Navigate directly to the page under test.

## Drive

Playwright is available via `@vitest/browser-playwright` in `node_modules` (not a root dep). From a script outside the repo, import it by absolute path:

```js
import { chromium } from '/Users/alex_barchenko/ux-allox-2026/node_modules/playwright/index.mjs'
```

Headless chromium works. Radix popovers render into `[data-radix-popper-content-wrapper]` — scope option-row selectors there. Attach `page.on('pageerror')` / console-error listeners to catch runtime errors.

## Gotchas

- `npm run build` / `tsc -b` currently fails on pre-existing errors in dashboard prototype files — don't treat those as regressions; verify in the dev server instead.
- Background the dev server with `run_in_background`, not `(cmd &)` — the latter dies with the shell.
