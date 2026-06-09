# Active Tasks — Sanctuary Inventory
> Source: next_steps.md → "Stand up + test tonight with home assets"
> Implementation ref: implementation.md → Phases 1–2

## In Progress
- [ ] Chad: add staff + 2nd reviewer to the `Reviewers` tab (tomorrow, once emails known)

## Up Next
- [ ] Confirm a vote persists across refresh on the live site
- [ ] (Optional) Confirm a non-allowlisted Google account is blocked
- [ ] Run `/inventory-flush` to clear the 13 home-test items before real church inventory
- [ ] When real reviewers added: share the Drive photo folder with them (so photos render)

## Done (this cycle)
- [x] Project scaffold + git init — 2026-06-08
- [x] Created Drive photo folder + Google Sheet (Inventory + Staff tabs, headers, Chad as Admin) — 2026-06-08
- [x] Built web app (index.html, app.js, config.js, styles.css) w/ Google Sign-In gate — 2026-06-08
- [x] Wrote Apps Script bridge (token verify + allowlist + read/write) — 2026-06-08
- [x] Wrote 3 skills: /inventory-process, /inventory-flush, /inventory-status — 2026-06-08
- [x] Added CNAME (springclean.mishtoba.com) + .gitignore — 2026-06-08
- [x] Created public GitHub repo + pushed + enabled Pages — 2026-06-08

## Session Log
### 2026-06-08 (evening — full loop working ✅)
- LIVE at https://springclean.mishtoba.com (DNS + HTTPS enforced). OAuth origin fixed
  by Chad (mistoba.org→mishtoba.com); Code.gs v2 (voting) re-deployed.
- END-TO-END TEST PASSED: Chad uploaded a home living-room photo → cataloged 13 distinct
  items (multi-item split + in-frame position hints) → photos render in the app. Chad:
  "seem to work well."
- Images confirmed NOT in GitHub — served from private Drive via thumbnail URLs; Sheet
  stores only file ID + URL text.
- Pick up at: vote-persistence check; add real reviewers + share photo folder; flush
  the 13 test items before real church inventory.

### 2026-06-08
- Built the entire app end-to-end. ✅ Step 1 OAuth + ✅ Step 2 Apps Script deployed &
  verified. ⏳ Step 3 DNS CNAME added at GoDaddy — propagating (background poll running).
- Added v2: multi-reviewer voting (role override, staff>volunteer, split→Keep) +
  Dashboard (progress, by-location, donation value, needs-attention, action lists).
  Schema: Staff→Reviewers tab, new Votes tab, Inventory O–R repurposed. Visually verified.
- BLOCKED ON CHAD (2 actions): (1) RE-DEPLOY the updated Code.gs (Manage deployments →
  new version, same URL); (2) populate Reviewers tab with the 4 people + roles.
- Pick up at: confirm DNS live + HTTPS, then redeploy + roster, then process test photos.
