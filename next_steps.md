# Next Steps — Sanctuary Inventory

## Now (current focus)
1. **Stand up + test tonight with home assets** — finish the 3 manual Google steps,
   process a few home photos, confirm the full loop (catalog → app → decide →
   write-back), then flush. Done = Chad has seen it work end-to-end.

## Next (queue)
> Implementation-ready specs for the next UI features (photo tap-to-zoom, room-first
> flow, notes + inline edit) live in `feature-specs.md`.

2. **Location-first "pick a room" review flow** — replace the all-items grid as the
   default with a room picker: reviewer lands on a list of locations (with per-room
   progress), taps one, and reviews ONLY that room's items on its own page. Makes it
   easy to say "I'm working the Choir Room today" instead of scrolling everything.
   Keep the all-items/search view available as a secondary option. (Chad's idea, 2026-06-08.)
   See `feature-specs.md` for the implementation-ready spec (front-end only).
3. **Real sanctuary inventory, room by room** — photograph by location (sub-folders),
   process in batches, staff triage. Add staff to allowlist + share photo folder.
3. **Decision export / report** — a "what we're donating / tossing" summary view or
   printout for the cleanup day.

## Later (parking lot)
- In-app photo upload (skip the Drive step).
- **(C) Auto-cropped per-item thumbnails** — crop each item out of a shared photo so every
  card shows just its item (vs. today's shared photo + locator hint). Needs an image-crop
  step in the pipeline + crop storage.
- **Duplicate-asset handling** — flag suspected same-asset-across-photos as "possible
  duplicate" in Needs-attention; add a staff "merge" action. No auto-merge (vision can't
  reliably tell a re-shoot from an identical second item).
- Per-item multi-photo support (attach multiple angles/labels to one asset).
- "Assigned to" column so tasks can be split across volunteers.
- Value rollups for a donation receipt.

## Decisions & Context
- 2026-06-08: Chose Drive-folder pipeline, interactive web app w/ Apps Script
  write-back, full cloud now, Google Sign-In + Staff allowlist.
- 2026-06-08: Custom domain springclean.mishtoba.com (Chad owns mishtoba.com) via CNAME.
- 2026-06-08: All artifacts confirmed under one owner Google account (unified identity).
- Repo is PUBLIC (free Pages); data protected by sign-in + allowlist, not by privacy
  of the repo. Acceptable for non-sensitive asset photos; home test data gets flushed.
