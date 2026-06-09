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
  GOOGLE_CLIENT_ID: "497949053919-gno0qrkdbvbva2c8vmu5s1v94v29t02c.apps.googleusercontent.com",

  // Apps Script Web App URL (Apps Script editor → Deploy → Web app).
  // Looks like: https://script.google.com/macros/s/AKfyc.../exec
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwRQ2dd0A-J4vvC1nTTElOcWEkDfjdwsRdSI8FhFDiOcFXd56AMJV-JkcgNLuCjxWzjXQ/exec",
};
