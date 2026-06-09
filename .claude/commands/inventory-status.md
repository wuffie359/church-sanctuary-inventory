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
   - **Decision progress** — how many decided vs. needing a decision, and the
     Keep / Donate / Throw Away split (staff decisions).
   - **AI vs. staff** — where staff decisions differ from the AI suggestion (these are
     the interesting overrides).
   - **Estimated value** — sum of Est. Value for items marked Keep, and for Donate.
   - **Data gaps** — rows missing a photo, missing a location, or flagged
     "Unidentified — needs review".
3. Also read `Staff!A2:C` and report who is on the allowlist.
4. Keep it tight — a scannable briefing, not a wall of text. Bold the headline numbers.
