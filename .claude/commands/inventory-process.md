---
description: Catalog new photos from the Drive folder into the Sanctuary Inventory Sheet
---

# /inventory-process — Photo → Inventory cataloging

Process new photos in the Drive folder, identify each item with vision, and
append rows to the Sanctuary Inventory Sheet. Idempotent: photos already in the
Sheet (matched by Drive File ID) are skipped.

## Constants
- **Drive photo folder ID:** `1MhwuEVB3y_oGkA1WpT82g2TUSMvHk1OI`
- **Sheet ID:** `1azVxnJpIokdII_49P_teNQD_g1U_BKp2V4jLqhQ3eQQ`
- **Inventory tab columns (A→R):** ID, Processed At, Location, Sub-Area, Item Name,
  Category, Description, Condition, Est. Value (USD), Qty, AI Suggested, AI Reasoning,
  Photo File ID, Photo URL, Resolved Decision, Status, Resolved At, Notes
- **Columns O–R are filled by reviewer voting in the app — leave them blank here.**
  New rows start with no votes, so the app shows them as "Undecided."

## Steps

1. **List photos.** Use the Google Drive connection to list image files in the
   folder (recurse one level into sub-folders). A **sub-folder name is the item's
   Location** (e.g. "Main Storage Closet", "Choir Room"). Files at the folder root
   have no location yet — ask Chad once: "What location are the root-level photos?"

2. **Find already-processed.** Read `Inventory!M2:M` (Photo File ID column) from the
   Sheet. Skip any photo whose File ID is already present. Report how many are new.

3. **Catalog each new photo with vision.** View the image and identify what's in it.
   - Catalog each **clearly distinct, meaningful item** as its own row.
   - Group trivial bulk (a box of identical hymnals, a bin of cables) into ONE "lot"
     row with a Qty estimate — don't create 40 rows for 40 identical things.
   - If a photo is blurry/unidentifiable, still log a row with Item Name "Unidentified —
     needs review" so nothing is silently dropped.
   - For each item determine:
     - **Item Name** — concise (e.g. "Upholstered stacking chair", "Brass offering plate").
     - **Category** — Furniture / Electronics / Audio-Visual / Books & Media /
       Decor / Kitchen / Office / Cleaning & Supplies / Tools / Textiles / Musical
       Instruments / Miscellaneous.
     - **Description** — one line: material, color, size, distinguishing marks.
     - **Condition** — New / Good / Fair / Worn / Damaged.
     - **Est. Value (USD)** — rough resale/replacement ballpark; blank if unsure.
     - **Qty** — count if a lot, else 1.
     - **Sub-Area** — if visible (e.g. "top shelf", "behind door").
     - **AI Suggested** — exactly one of: `Keep`, `Donate`, `Throw Away`.
     - **AI Reasoning** — one short sentence on WHY (condition, usefulness, value,
       duplication). Be honest: damaged/obsolete → Throw Away; good but surplus →
       Donate; useful/valuable → Keep. Staff make the final call; this is a starting point.

4. **Build the row.**
   - **ID** — `INV-` + zero-padded running number continuing from the last ID in the
     Sheet (first run starts at `INV-0001`).
   - **Processed At** — today's date (YYYY-MM-DD; ask the harness for current date, do
     not invent).
   - **Photo File ID** — the Drive file ID.
   - **Photo URL** — `https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w600`
   - Resolved Decision / Status / Resolved At / Notes (cols O–R) — leave blank;
     these are set when reviewers vote in the app.

5. **Write rows.** Append via the Google Sheets connection (add_rows to the Inventory
   tab). Batch them in one call when possible.

6. **Report.** Print a table: how many photos scanned, how many new, how many item
   rows added, and a per-location count. Note any photos that need Chad's review.

## Notes
- Don't make church-asset judgments too harsh — when unsure between Donate and Throw
  Away, prefer Donate.
- If a photo shows the SAME physical item as an existing row from a different angle,
  skip it (note it) rather than duplicating — match on visible detail, not just File ID.
