# CLAUDE.md — Sanctuary Inventory

Photo-driven inventory & triage app for the FBC Huntersville sanctuary. Staff
photograph assets (closets, rooms, open areas), Claude catalogs them with vision
into a Google Sheet, and staff mark each item **Keep / Donate / Throw Away** in a
web app hosted on GitHub Pages.

## Architecture
- **Photos:** Google Drive folder `Sanctuary Inventory Photos`
  (`1MhwuEVB3y_oGkA1WpT82g2TUSMvHk1OI`) — phone uploads here; sub-folders = Location.
- **Database:** Google Sheet `Sanctuary Inventory`
  (`1azVxnJpIokdII_49P_teNQD_g1U_BKp2V4jLqhQ3eQQ`) — `Inventory` tab + `Reviewers`
  allowlist tab + `Votes` tab (one row per reviewer-per-item).
- **Bridge:** Apps Script (`apps-script/Code.gs`) bound to the Sheet, deployed as a
  Web App. Verifies a Google ID token + Reviewers allowlist on every read/write, and
  computes each item's resolved decision from the votes.
- **Web app:** static site at repo root (`index.html`, `app.js`, `config.js`,
  `styles.css`) → GitHub Pages → custom domain **springclean.mishtoba.com**. Two views:
  **Review** (vote per item) and **Dashboard** (progress, by-location, value, action lists).
- **Skills:** `/inventory-process` (catalog), `/inventory-flush` (reset),
  `/inventory-status` (snapshot).

## Voting model (role override)
Reviewers vote Keep / Donate / Throw Away per item. **Staff/Admin votes are
authoritative; Volunteer votes are recommendations.** Resolution per item:
no votes → Undecided · volunteers only → Proposed (pending staff) · any staff & staff
agree → Confirmed · staff disagree → Needs Resolution, **defaults to Keep** (flagged).
The resolved decision + status are written back to Inventory cols O–R. If you ever
edit `Code.gs`, you MUST re-deploy: Deploy → Manage deployments → ✏️ edit → New version
→ Deploy (keeps the same `/exec` URL, so `config.js` is unchanged).

## Identity (all one account)
Everything lives under **one owner Google account** (the account on the `Reviewers`
tab marked Admin): the Drive folder, the Sheet, and the Apps Script. Photos render in
the app via Drive thumbnail links that work for any signed-in user who has view access
to the photo folder (the owner always does; share the folder with other reviewers
before they use it).

## Access control
The repo is public (required for free GitHub Pages) but the **data is not**. The app
shows nothing until a user signs in with Google AND their email is on the `Reviewers`
tab. Manage access by editing the `Reviewers` tab — column A = email, B = name,
C = role (**Admin**, **Staff**, or **Volunteer**). Role drives vote authority: Admin
and Staff override Volunteers.

## Brand
Navy `#1A3040`, Teal `#0088b8`, Montserrat. (FBC Huntersville standard.)

---

## MANUAL SETUP — one time (only Chad can do these)

These three Google/DNS steps can't be automated. Do them once and the app is live.

### 1. Google OAuth Client ID (for sign-in)
1. Go to **console.cloud.google.com** → create/select any project.
2. **APIs & Services → OAuth consent screen** → External → fill app name
   ("Sanctuary Inventory") + your email → Save. Add yourself as a Test user (or
   Publish). No scopes needed beyond the default sign-in.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Application type **Web application**.
4. Under **Authorized JavaScript origins**, add BOTH:
   - `https://springclean.mishtoba.com`
   - `https://wuffie359.github.io`
5. Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`).
6. Paste it into **`config.js`** (`GOOGLE_CLIENT_ID`) **and** into **`apps-script/Code.gs`**
   (`CLIENT_ID`) — they must match.

### 2. Apps Script Web App (the data bridge)
1. Open the Sheet → **Extensions → Apps Script**.
2. Replace the default `Code.gs` with this repo's `apps-script/Code.gs` (Client ID
   already pasted in from step 1).
3. **Deploy → New deployment → Web app.** Execute as **Me**; Who has access **Anyone**.
4. Authorize when prompted (review the Google consent screen — it's your own script).
5. Copy the **Web app URL** (`.../exec`) → paste into `config.js` (`APPS_SCRIPT_URL`).

### 3. Custom domain DNS (springclean.mishtoba.com)
1. At your DNS host for **mishtoba.com**, add a **CNAME** record:
   - Host/Name: `springclean`
   - Value/Target: `wuffie359.github.io`
   - (TTL default is fine.)
2. The repo already contains a `CNAME` file with `springclean.mishtoba.com`, so GitHub
   Pages will pick it up. In the repo **Settings → Pages**, confirm the custom domain
   shows `springclean.mishtoba.com` and enable **Enforce HTTPS** once the cert issues
   (can take a few minutes to ~1 hour after DNS propagates).

After all three: commit the updated `config.js`, push, and the live app is at
**https://springclean.mishtoba.com**.

---

## Workflow files
- `implementation.md` — strategy/architecture (Chad owns).
- `next_steps.md` — Now / Next / Later backlog.
- `todo_tasks.md` — current task breakdown + session log.

## Conventions
- Don't commit photos or tokens (see `.gitignore`).
- `config.js` values are public by design — do not treat them as secrets, but the
  Staff allowlist is the real gate; keep it tight.
