/**
 * Sanctuary Inventory — Google Apps Script bridge
 * ----------------------------------------------------------------------------
 * Sits between the public GitHub Pages site and the private Google Sheet.
 * Every request must carry a Google ID token from a signed-in user whose email
 * is on the Staff allowlist tab. Unauthenticated / un-allowlisted requests get
 * nothing. This is what makes the public app safe.
 *
 * SETUP (one time):
 *   1. Open the Sanctuary Inventory Sheet → Extensions → Apps Script.
 *   2. Paste this whole file over the default Code.gs.
 *   3. Set CLIENT_ID below to your OAuth Web Client ID (same one in config.js).
 *   4. Deploy → New deployment → type "Web app".
 *        Execute as: Me.   Who has access: Anyone.
 *      ("Anyone" is fine — the token+allowlist check is the real gate.)
 *   5. Copy the /exec URL into web/config.js as APPS_SCRIPT_URL.
 *
 * No CORS preflight: the client uses GET for reads and POSTs JSON as
 * text/plain, so the browser never sends an OPTIONS request (which Apps
 * Script can't answer).
 */

// Paste the SAME OAuth Web Client ID used in web/config.js:
var CLIENT_ID = "497949053919-gno0qrkdbvbva2c8vmu5s1v94v29t02c.apps.googleusercontent.com";

var SHEET_ID = "1azVxnJpIokdII_49P_teNQD_g1U_BKp2V4jLqhQ3eQQ";
var INVENTORY_SHEET = "Inventory";
var STAFF_SHEET = "Staff";

// ── Entry points ────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var email = requireAllowlistedUser_(e.parameter.idToken);
    var action = e.parameter.action || "list";
    if (action === "list") return json_({ ok: true, items: listInventory_(), user: email });
    return json_({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var email = requireAllowlistedUser_(body.idToken);
    if (body.action === "decide") {
      updateDecision_(body.id, body.decision, body.notes || "", email);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: "Unknown action: " + body.action });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Verifies a Google ID token and confirms the email is on the Staff tab. */
function requireAllowlistedUser_(idToken) {
  if (!idToken) throw new Error("Not signed in.");
  var resp = UrlFetchApp.fetch(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) throw new Error("Invalid sign-in token.");
  var info = JSON.parse(resp.getContentText());
  if (info.aud !== CLIENT_ID) throw new Error("Token audience mismatch.");
  if (info.email_verified !== "true" && info.email_verified !== true)
    throw new Error("Email not verified.");
  var email = String(info.email || "").toLowerCase();
  if (!isAllowlisted_(email)) throw new Error("Access denied: " + email + " is not on the staff list.");
  return email;
}

function isAllowlisted_(email) {
  var values = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STAFF_SHEET)
    .getRange("A2:A").getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === email) return true;
  }
  return false;
}

// ── Data ─────────────────────────────────────────────────────────────────────

function listInventory_() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(INVENTORY_SHEET);
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  return data
    .filter(function (row) { return row[0] !== "" && row[0] !== null; })
    .map(function (row) {
      var o = {};
      headers.forEach(function (h, i) { o[h] = row[i]; });
      return o;
    });
}

/** Writes a staff decision back to the row whose ID matches. */
function updateDecision_(id, decision, notes, email) {
  var valid = { "Keep": 1, "Donate": 1, "Throw Away": 1, "": 1 };
  if (!(decision in valid)) throw new Error("Invalid decision: " + decision);
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(INVENTORY_SHEET);
  var ids = sheet.getRange("A2:A").getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      var rowNum = i + 2; // O=15 Decision, P=16 By, Q=17 At, R=18 Notes
      sheet.getRange(rowNum, 15).setValue(decision);
      sheet.getRange(rowNum, 16).setValue(email);
      sheet.getRange(rowNum, 17).setValue(new Date());
      sheet.getRange(rowNum, 18).setValue(notes);
      return;
    }
  }
  throw new Error("Item not found: " + id);
}

// ── Util ─────────────────────────────────────────────────────────────────────

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
