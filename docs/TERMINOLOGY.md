# Positions — copy & terminology audit

For Kenny's wording pass (design review, Jul 9). Every user-facing term in one place:
review here instead of hunting screens. Comment inline or in the thread; agreed changes
land as one copy commit.

## Canonical vocabulary (as built today)

| Term | Meaning | Where it appears |
|---|---|---|
| Position | A budgeted role need; persistent | everywhere |
| Hiring request | Spark-side request to fill a position; transactional | create modal, wizards, tooltips |
| Plan | Role × month grid tab | tab |
| Positions | List view tab (Full/AJ scope) | tab |
| Needs review | Decision queue tab (past due + no request) | tab, metric card link |
| On staff | Filled, person started | badges, panel |
| Offer accepted | Filled, person not started yet | badges, panel |
| Filled | On staff + Offer accepted (rollup) | metric cards, plan rollups, table |
| Open | Recruiting, request exists | badges, cards, everywhere |
| Past due | Open, target month passed; request unchanged | badges, tooltips |
| No request | Open position without a hiring request | badges, tooltips |
| Reopened | Position vacated, back to open/no-request | badge + provenance tooltip |
| Closed | Deliberately not hiring; reason required | badge, closed section, wizard |
| Target start date | The request's month anchor | open-request wizard |
| Change log | Audit trail of all actions | button, panel |

## Inconsistencies found (decisions needed)

1. **"Start date" vs "Target start date."** Create modal says *Start date*; open-request wizard and PRD say *Target start date*. → Recommend: **Target start date** everywhere.
2. **"Headcount" column** (Positions table). Kenny already flagged: values are individual hiring requests, not headcount. → Recommend: **Total** (or drop when the list goes individual-grain).
3. **Open-request wizard mixes objects**: title says "Open *positions*", footer button says "Open 2 *requests*". The action creates requests for existing positions. → Recommend: title **"Open hiring requests"**, button **"Open N requests"**.
4. **Create modal title/button**: button "New position" (singular) opens modal "New positions" (plural) with footer "Open N positions". → Recommend: keep button singular (it's the entry point), modal + footer plural — but confirm.
5. **Reopened tooltip has two phrasings**: "after someone vacated the role" (Plan grid) vs "after the previous person left the role" (tables/queue). → Pick one; recommend the second (plainer).
6. **No-request tooltip has two phrasings**: "No hiring request raised yet" (Plan grid) vs "No hiring request yet — nothing is being recruited until one is opened" (tables). → Recommend the long one everywhere; it explains the consequence.
7. **Metric card link "8 need review →" vs tab "Needs review".** Grammatically fine (count verb vs tab noun) but reads inconsistent. → Confirm or change link to "8 in Needs review".
8. **"Raise hiring requests"** (create-modal toggle) vs **"Open a hiring request"** (queue action). Two verbs for the same act. → Recommend **open** everywhere; "raise" only reads natural in the batch toggle — Kenny's call.
9. **Close wizard second-step CTA** — earlier open question ("Continue to reason") still awaiting Kenny's word.

## Notes

- "Role" vs "Job title" — already unified to **Role** (Jul 8).
- Statuses, colours and dots share one token language across cards, grid, tables, panel — renaming a status is copy-only, no design impact.
