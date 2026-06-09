---
description: Quick status report on the Sanctuary Inventory (counts, decisions, gaps)
---

# /inventory-status — Inventory snapshot

Read-only. Summarizes the current state of the inventory for a fast check-in.

## Constants
- **Sheet ID:** `1azVxnJpIokdII_49P_teNQD_g1U_BKp2V4jLqhQ3eQQ`

## Steps

1. Read `Inventory!A1:R` from the Google Sheets connection.
2. Report:
   - **Total items** catalogued.
   - **By location** — count per Location.
   - **Resolution progress** — counts by Status column: Confirmed / Needs Resolution /
     Proposed (pending staff) / Undecided. "Staff-decided" = Confirmed + Needs Resolution.
   - **Disposition split** — Keep / Donate / Throw Away counts from Resolved Decision.
   - **Needs attention** — items with Status "Needs Resolution" (staff split) or
     "Proposed" (volunteer vote awaiting staff), plus any "Unidentified" items.
   - **AI vs. resolved** — where the Resolved Decision differs from AI Suggested.
   - **Estimated value** — sum of Est. Value × Qty for Resolved Decision = Keep, and for Donate.
   - **Data gaps** — rows missing a photo, missing a location, or "Unidentified".
3. Read `Reviewers!A2:C` and report who is on the roster with their role (Admin /
   Staff / Volunteer). Optionally read `Votes!A2:D` to show how many votes each reviewer
   has cast.
4. Keep it tight — a scannable briefing, not a wall of text. Bold the headline numbers.
