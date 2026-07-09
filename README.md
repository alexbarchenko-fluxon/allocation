# Allox — design prototype (Positions + prior tabs)

Working design prototype for Allox internal tools, built by the design team.
Primary feature: **Positions** — headcount planning for BizOps (see the
[Positions PRD] and the MVP working spec). Also contains the earlier design
work (Deals, People, Dashboard…) merged into one product so every tab can be
walked and compared against live Allox.

## Quick start

```bash
npm install
npm run dev        # app on http://localhost:5173
npm run storybook  # component reference with all states
```

No accounts, no env vars — seeded mock data, deterministic.

## What to treat as reference (agreed Jul 9)

- **If it exists in Figma → Figma.** Figma holds the curated main screens,
  pixel-perfect, exported from this build.
- **If it doesn't → this prototype.** Flows, interactions, edge and empty
  states, micro-behaviour. The prototype is the intended behaviour spec.
- **Components → Storybook.** Every Positions component with its real states;
  if a state exists in a story, it must exist in production.
- Copy/wording is under review — see [docs/TERMINOLOGY.md](docs/TERMINOLOGY.md).

## Scope switch (bottom-left pill)

- **MVP** — what engineering builds now: Plan grid, create positions
  (list-based modal), close with reason, Needs review queue, Change log.
- **Full** — adds future concepts: Notes, the Positions list tab.
- **AJ** — Full, with the Positions list and detail panel at individual-record
  grain (flat lists, no grouping) — direction agreed in the Jul 9 review,
  pending a usability A/B.

## Where things live

```
src/pages/PositionsPage.tsx      # page composition, scope switch, wizards wiring
src/pages/positions/             # all Positions components + *.stories.tsx
src/lib/positions/               # model, selectors, seed data, time helpers
src/index.css                    # design tokens (colours, status ramps, locations)
docs/TERMINOLOGY.md              # copy audit for the wording pass
scripts_capture.py               # exports canonical screens to Figma (html.to.design)
```

Design tokens are the contract: no hardcoded hex in components. Status colours,
location colours and spacing all resolve through `src/index.css` and match the
Figma variables — a rebrand or rename lands in one place.

## Tech

Vite · React 18 · TypeScript · Tailwind · shadcn/ui · Storybook. Deployed on
Vercel (see repo sidebar for the production link).
