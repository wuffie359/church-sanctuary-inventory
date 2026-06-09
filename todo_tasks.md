# Active Tasks — Sanctuary Inventory
> Source: next_steps.md → "Stand up + test tonight with home assets"
> Implementation ref: implementation.md → Phases 1–2

## In Progress
- [ ] Chad: 3 manual Google steps (OAuth Client ID, Apps Script deploy, DNS CNAME) — see CLAUDE.md → Manual Setup

## Up Next
- [ ] Chad: upload a few home test photos to the Drive folder
- [ ] Run `/inventory-process` on the test photos — verify Sheet rows are accurate
- [ ] Open springclean.mishtoba.com → sign in → confirm items + photos render
- [ ] Tap Keep/Donate/Throw Away → refresh → confirm decisions persisted
- [ ] Confirm a non-allowlisted Google account is blocked
- [ ] Run `/inventory-flush` to reset after the test

## Done (this cycle)
- [x] Project scaffold + git init — 2026-06-08
- [x] Created Drive photo folder + Google Sheet (Inventory + Staff tabs, headers, Chad as Admin) — 2026-06-08
- [x] Built web app (index.html, app.js, config.js, styles.css) w/ Google Sign-In gate — 2026-06-08
- [x] Wrote Apps Script bridge (token verify + allowlist + read/write) — 2026-06-08
- [x] Wrote 3 skills: /inventory-process, /inventory-flush, /inventory-status — 2026-06-08
- [x] Added CNAME (springclean.mishtoba.com) + .gitignore — 2026-06-08
- [x] Created public GitHub repo + pushed + enabled Pages — 2026-06-08

## Session Log
### 2026-06-08
- Built the entire app end-to-end. ✅ Step 1 OAuth + ✅ Step 2 Apps Script deployed &
  verified. ⏳ Step 3 DNS CNAME added at GoDaddy — propagating (background poll running).
- Added v2: multi-reviewer voting (role override, staff>volunteer, split→Keep) +
  Dashboard (progress, by-location, donation value, needs-attention, action lists).
  Schema: Staff→Reviewers tab, new Votes tab, Inventory O–R repurposed. Visually verified.
- BLOCKED ON CHAD (2 actions): (1) RE-DEPLOY the updated Code.gs (Manage deployments →
  new version, same URL); (2) populate Reviewers tab with the 4 people + roles.
- Pick up at: confirm DNS live + HTTPS, then redeploy + roster, then process test photos.
