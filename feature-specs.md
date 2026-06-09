# Feature Specs — Sanctuary Inventory

Implementation-ready specs for the next round of features, written so they can be
picked up cold on the laptop. Each spec notes **where** in the code to work, the
**approach**, rough **effort**, and — critically — whether a change requires
**re-deploying the Apps Script** (any edit to `apps-script/Code.gs` does; front-end
edits to `index.html`/`app.js`/`styles.css` ship automatically via GitHub Pages).

> Reminder (from CLAUDE.md): re-deploy = Apps Script → **Deploy → Manage deployments
> → ✏️ edit → New version → Deploy**. Keeps the same `/exec` URL, so `config.js` is
> unchanged.

---

## 1. Photo tap-to-zoom (lightbox)
**Front-end only — no redeploy. Effort: Low.**

**Why:** Item cards render small Drive thumbnails (`&sz=w600`). To vote honestly a
reviewer often needs a closer look (read a label, judge condition/damage). There's
currently no way to enlarge a photo.

**Where:**
- Photo markup is built in `cardHtml()` — `app.js:205-206`.
- Add the modal/overlay container to `index.html` (near the `#toast` div, with the
  `no-print` class).
- Styles in `styles.css`.

**Approach:**
- Add a click/tap handler on the card photo (`.photo-box img`). On activate, open a
  full-screen overlay showing the larger image.
- Build the large URL by swapping the thumbnail size on the existing Photo URL:
  `&sz=w600` → `&sz=w1600` (the Photo URL is `drive.google.com/thumbnail?id=...&sz=w600`).
- Keep `referrerpolicy="no-referrer"` on the big `<img>` too (same Drive
  cookie/CORS behavior as the cards).
- Build the big image lazily — only create/load it when the overlay opens; clear it
  on close so we don't hold large images in memory.
- Close on overlay tap, an explicit ✕ button, and the `Esc` key.
- Reuse the existing fallback pattern (`onerror` → "Photo unavailable") for the
  large image.

**Notes:** Pure presentation; no data or auth changes. Watch for event-bubbling into
the vote buttons — the zoom handler should be scoped to the photo element only.

---

## 2. Room-first overview + review flow
**Front-end only — no redeploy. Effort: Medium.** (Already listed in `next_steps.md`
under "Next".)

**Why:** People work the building room by room ("I'm doing the Choir Room today").
The default all-items grid forces scrolling past everything. A room picker that opens
with a clear overview — what's in each room and across the whole inventory — matches
the real workflow and orients reviewers before they start.

**Where:**
- Review view markup in `index.html` (`#review-view`, `#summary`, filter bar, `#grid`).
- Filtering logic in `applyFilters()` — `app.js:139-160`.
- Per-location counts/progress: reuse the logic that powers the dashboard's
  by-location block, `locationBlock()` — `app.js:315-345` (decided/total per location).
- All aggregation reads from the in-memory `allItems` using existing fields:
  **Location** (col C), **Category** (col F), **Est. Value** (col I), **Qty** (col J).
  No schema change.

**Approach:**
- Add a **room-picker landing sub-view** with two parts:
  1. **Inventory summary strip** (top): total item count, total estimated value, and
     a "types of stuff" breakdown — counts grouped by **Category** across all rooms
     (e.g. `Seating 42 · Electronics 11 · Tables 9 · Décor 7`). Group/sum from
     `allItems` (same value math as `valueBlock()` `app.js:347-363`, grouped by
     category instead of decision).
  2. **Room cards** (list/grid): one per Location, each showing item count, total
     value, decided/total progress + a small progress bar (reuse `locationBlock()`
     math), and a short top-categories summary for that room
     (e.g. "8 chairs · 3 electronics · 2 tables").
- Tapping a room card sets the location filter and switches to the existing grid,
  scoped to that room.
- Add a "← All rooms" affordance to return to the picker. Keep the existing
  all-items + search experience available as a secondary toggle (don't remove it).
- State is client-side only (which room is selected) — no schema or server change.
  Consider remembering the last room in `sessionStorage` for convenience.

**Implementation hint:** a single helper that reduces `allItems` into
`{ byLocation: {loc: {count, value, decided, total, byCategory}}, totals: {count,
value, byCategory} }` feeds both the summary strip and the room cards in one pass.

**Notes:** No data/auth/schema change. Mostly a routing/view-state addition on top of
filters that already exist.

---

## 3. Notes + inline AI-data correction
**Needs `Code.gs` change + REDEPLOY. Effort: Medium.**

**Why:** The Inventory sheet's column **R ("Notes")** is reserved but unused, and the
AI cataloger sometimes mislabels an item's **name / value / quantity**. Today the
only way to fix either is to hand-edit the Google Sheet. Let staff add a note and
correct catalog data from inside the app.

**Where:**
- Edit UI on each card: `cardHtml()` — `app.js` (the metadata block around
  `app.js:205-235`).
- New authenticated write path in `apps-script/Code.gs` — mirror the existing
  auth + write pattern of `castVote_()` / `resolveAndPersist_()` (verify token via
  `requireReviewer_()`, then write cells). Add e.g. an `updateItem_()` handler and a
  new POST `action`.

**Approach:**
- **Notes (col R):** add an editable note field per item; persist on blur/save.
- **Catalog correction:** allow editing Item Name (col E), Est. Value (col I), and
  Qty (col J). These feed the dashboard value rollups, so correcting them keeps the
  donation receipt accurate.
- **Authorization:** restrict edits to **Staff/Admin** using the existing
  `isStaff()` check (`app.js:89`, `Code.gs`); volunteers see the fields read-only.
- **Persistence:** new POST action (e.g. `{ action: "updateItem", id, fields }`) →
  `updateItem_()` writes the targeted cells by item ID, returns the updated row.
  Recompute/refresh value rollups on next load.
- Keep `ID` (A), `Photo File ID` (M), `Photo URL` (N) immutable.

**Notes:** This is the only one of the three that touches `Code.gs`, so after
deploying the front-end you must **re-deploy the Apps Script** (see reminder at top)
for the writes to work. Consider light validation (value/qty numeric) server-side.

---

## Suggested build order
1. **Photo tap-to-zoom** — fastest win, pure front-end, immediately useful on phones.
2. **Room-first overview + review flow** — front-end, biggest workflow improvement for
   triage day (room picker + inventory/category summaries).
3. **Notes + inline edit** — last, since it's the only one needing an Apps Script
   re-deploy and a new server write path.
