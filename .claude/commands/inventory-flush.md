---
description: Wipe all inventory data to start fresh (keeps headers + Staff allowlist)
---

# /inventory-flush — Reset inventory to empty

Clears all catalogued items so you can start a clean run (e.g. after tonight's
home-asset test, before the real sanctuary inventory). **Destructive — always
confirm first.**

## Constants
- **Sheet ID:** `1azVxnJpIokdII_49P_teNQD_g1U_BKp2V4jLqhQ3eQQ`
- **Drive photo folder ID:** `1MhwuEVB3y_oGkA1WpT82g2TUSMvHk1OI`

## Steps

1. **Show what will be wiped.** Read `Inventory!A2:E` and report the count of item
   rows and a quick breakdown by Location. State clearly: "This permanently clears
   N inventory rows AND all reviewer votes. The Reviewers allowlist and column
   headers are preserved."

2. **Confirm with Chad.** Use AskUserQuestion. Offer:
   - **Clear Sheet rows only** (recommended) — empties the Inventory + Votes tabs,
     leaves the photos in Drive untouched.
   - **Clear Sheet rows AND delete Drive photos** — also removes the photo files from
     the Drive folder. Use only when you truly want a from-scratch reset.
   - **Cancel.**

3. **Execute the chosen scope.**
   - Sheet: clear every row below the header on BOTH the `Inventory` tab
     (`Inventory!A2:R<lastRow>`) and the `Votes` tab (`Votes!A2:E<lastRow>`). Do NOT
     touch row 1 (headers) of either, and do NOT touch the `Reviewers` tab.
   - Drive (only if chosen): list files in the folder and delete each. Confirm count
     deleted.

4. **Verify + report.** Re-read `Inventory!A2:A` and `Votes!A2:A` to confirm both are
   empty. Report: inventory rows cleared, votes cleared, photos deleted (if any), and
   that headers + Reviewers allowlist remain intact. The web app will now show the
   empty state.

## Guardrails
- NEVER delete or clear the `Reviewers` tab or its emails.
- NEVER delete the Sheet itself or the Drive folder — only their contents.
- If the user picked "delete Drive photos," double-confirm before deleting, since
  those originals are not recoverable from here.
