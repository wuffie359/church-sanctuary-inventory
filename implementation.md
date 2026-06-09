# Implementation — Sanctuary Inventory

## Vision (press release)
> FBC Huntersville staff walk the sanctuary with a phone, photographing every
> closet, room, and open area. By the next morning, a private web app shows each
> item — photo, location, condition, and an AI starting recommendation — and any
> staff member can tap **Keep**, **Donate**, or **Throw Away**. Decluttering the
> building becomes a shared, trackable decision instead of a pile of sticky notes.

## Architecture
Phone → Google Drive folder → Claude vision skill → Google Sheet (DB) → Apps Script
(auth bridge) ↔ GitHub Pages web app (staff decisions). One owner Google
account throughout. Public repo, private data (Google Sign-In + Staff allowlist).

## Phases
- **Phase 0 — Plumbing (DONE):** project scaffold, Drive folder, Sheet (Inventory +
  Staff tabs), web app, Apps Script, three skills, public repo, GitHub Pages, custom
  domain CNAME.
- **Phase 1 — Manual Google setup (Chad):** OAuth Client ID, Apps Script deploy, DNS
  CNAME. See CLAUDE.md → Manual Setup.
- **Phase 2 — Tonight's test (home assets):** Chad uploads a handful of home photos →
  `/inventory-process` → verify they appear in the app → tap decisions → confirm
  write-back → `/inventory-flush` to reset.
- **Phase 3 — Real sanctuary inventory:** photograph by room (sub-folders = location),
  process in batches, staff triage. Add staff emails to the allowlist + share the
  photo folder with them.

## Acceptance criteria
- [ ] Unauthenticated visitor to springclean.mistoba.org sees only the sign-in gate.
- [ ] Allowlisted staff member signs in and sees catalogued items with photos.
- [ ] Non-allowlisted Google user is rejected with a clear message.
- [ ] `/inventory-process` turns new Drive photos into accurate Sheet rows (item,
      location, condition, AI suggestion + reasoning).
- [ ] Tapping Keep/Donate/Throw Away writes back to the Sheet and survives refresh.
- [ ] `/inventory-flush` clears all items but preserves headers + Staff allowlist.

## Key decisions
- Google Sheets as DB (no server, Chad-readable, easy flush).
- Apps Script as the only write path → keeps the Sheet ID/permissions off the client
  and enforces auth server-side.
- text/plain POST + GET-with-token to dodge Apps Script's lack of CORS preflight.
- Repo public (free Pages requirement); security moved entirely to the data layer.
- Per-item rows for distinct assets; bulk identical items collapsed to one "lot" row.
