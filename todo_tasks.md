# Active Tasks — Sanctuary Inventory
> Source: next_steps.md → "Stand up + test tonight with home assets"
> Implementation ref: implementation.md → Phases 1–2

## In Progress
- [ ] Chad: 3 manual Google steps (OAuth Client ID, Apps Script deploy, DNS CNAME) — see CLAUDE.md → Manual Setup

## Up Next
- [ ] Chad: upload a few home test photos to the Drive folder
- [ ] Run `/inventory-process` on the test photos — verify Sheet rows are accurate
- [ ] Open springclean.mistoba.org → sign in → confirm items + photos render
- [ ] Tap Keep/Donate/Throw Away → refresh → confirm decisions persisted
- [ ] Confirm a non-allowlisted Google account is blocked
- [ ] Run `/inventory-flush` to reset after the test

## Done (this cycle)
- [x] Project scaffold + git init — 2026-06-08
- [x] Created Drive photo folder + Google Sheet (Inventory + Staff tabs, headers, Chad as Admin) — 2026-06-08
- [x] Built web app (index.html, app.js, config.js, styles.css) w/ Google Sign-In gate — 2026-06-08
- [x] Wrote Apps Script bridge (token verify + allowlist + read/write) — 2026-06-08
- [x] Wrote 3 skills: /inventory-process, /inventory-flush, /inventory-status — 2026-06-08
- [x] Added CNAME (springclean.mistoba.org) + .gitignore — 2026-06-08
- [x] Created public GitHub repo + pushed + enabled Pages — 2026-06-08

## Session Log
### 2026-06-08
- Built the entire app end-to-end in one session. All cloud artifacts created under
  one owner Google account. Repo pushed, Pages enabled, custom domain set.
- BLOCKED ON CHAD: the 3 manual Google steps (can't be automated) before first sign-in.
- Pick up at: walk Chad through OAuth + Apps Script deploy + DNS, then process home
  test photos and verify the loop.
