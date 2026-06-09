// ─────────────────────────────────────────────────────────────────────────
//  Sanctuary Inventory — front-end configuration
//  Fill these two values in after the one-time Google setup (see project
//  CLAUDE.md → "Manual Setup"). Nothing here is a secret: the OAuth Client ID
//  and the Apps Script URL are public by design. Access is enforced server-
//  side by the Staff allowlist, not by hiding these values.
// ─────────────────────────────────────────────────────────────────────────

window.SANCTUARY_CONFIG = {
  // Google OAuth 2.0 Web Client ID (Google Cloud Console → Credentials).
  // Looks like: 1234567890-abc123def456.apps.googleusercontent.com
  GOOGLE_CLIENT_ID: "PASTE_GOOGLE_CLIENT_ID_HERE",

  // Apps Script Web App URL (Apps Script editor → Deploy → Web app).
  // Looks like: https://script.google.com/macros/s/AKfyc.../exec
  APPS_SCRIPT_URL: "PASTE_APPS_SCRIPT_URL_HERE",
};
