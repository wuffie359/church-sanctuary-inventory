/**
 * Sanctuary Inventory — Google Apps Script bridge (v2: multi-reviewer voting)
 * ----------------------------------------------------------------------------
 * Public GitHub Pages site ↔ private Google Sheet. Every request carries a
 * Google ID token; only emails on the Reviewers tab get through.
 *
 * Voting model (role override):
 *   - Each reviewer votes Keep / Donate / Throw Away per item.
 *   - Staff/Admin votes are authoritative; Volunteer votes are recommendations.
 *   - Resolution per item:
 *       no votes ............................ Undecided
 *       volunteers only ..................... Proposed (pending staff)
 *       any staff, staff agree .............. Confirmed
 *       staff disagree ...................... Needs Resolution → defaults to Keep
 *   - Resolved decision + status are written back to Inventory cols O–Q.
 *
 * RE-DEPLOY AFTER EDITING: Deploy → Manage deployments → ✏️ edit → Version:
 * "New version" → Deploy. Keeps the SAME /exec URL (config.js unchanged).
 */

var CLIENT_ID = "497949053919-gno0qrkdbvbva2c8vmu5s1v94v29t02c.apps.googleusercontent.com";
var SHEET_ID = "1azVxnJpIokdII_49P_teNQD_g1U_BKp2V4jLqhQ3eQQ";
var INVENTORY_SHEET = "Inventory";
var REVIEWERS_SHEET = "Reviewers";
var VOTES_SHEET = "Votes";

// ── Entry points ────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var me = requireReviewer_(e.parameter.idToken);
    if ((e.parameter.action || "list") === "list") {
      return json_({ ok: true, me: me, items: listInventory_(), votes: listVotes_() });
    }
    return json_({ ok: false, error: "Unknown action." });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var me = requireReviewer_(body.idToken);
    if (body.action === "vote") {
      var resolved = castVote_(body.id, me, body.vote || "");
      return json_({ ok: true, id: body.id, resolved: resolved, votes: votesForItem_(body.id) });
    }
    return json_({ ok: false, error: "Unknown action." });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ── Auth + roles ──────────────────────────────────────────────────────────────

/** Verifies the Google ID token and returns {email, role} from Reviewers. */
function requireReviewer_(idToken) {
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
  var role = reviewerRole_(email);
  if (!role) throw new Error("Access denied: " + email + " is not on the reviewer list.");
  return { email: email, role: role };
}

/** Returns the role for an email, or null if not a reviewer. */
function reviewerRole_(email) {
  var rows = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEWERS_SHEET)
    .getRange("A2:C").getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === email) {
      var r = String(rows[i][2] || "Volunteer").trim();
      return r || "Volunteer";
    }
  }
  return null;
}

function isStaffRole_(role) {
  var r = String(role).toLowerCase();
  return r === "staff" || r === "admin";
}

// ── Reads ─────────────────────────────────────────────────────────────────────

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

function listVotes_() {
  var data = SpreadsheetApp.openById(SHEET_ID).getSheetByName(VOTES_SHEET)
    .getRange("A2:D").getValues();
  return data
    .filter(function (r) { return r[0] !== "" && r[0] !== null; })
    .map(function (r) { return { ItemID: String(r[0]), Email: String(r[1]), Role: String(r[2]), Vote: String(r[3]) }; });
}

function votesForItem_(id) {
  return listVotes_().filter(function (v) { return v.ItemID === String(id); });
}

// ── Voting + resolution ───────────────────────────────────────────────────────

/** Upserts the reviewer's vote (empty vote clears it), recomputes, persists. */
function castVote_(id, me, vote) {
  id = String(id);
  var valid = { "Keep": 1, "Donate": 1, "Throw Away": 1, "": 1 };
  if (!(vote in valid)) throw new Error("Invalid vote: " + vote);

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(VOTES_SHEET);
  var rows = sheet.getRange("A2:E").getValues();
  var foundRow = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === id && String(rows[i][1]).toLowerCase() === me.email) { foundRow = i + 2; break; }
  }
  if (vote === "") {
    if (foundRow > 0) sheet.deleteRow(foundRow);
  } else if (foundRow > 0) {
    sheet.getRange(foundRow, 3, 1, 3).setValues([[me.role, vote, new Date()]]);
  } else {
    sheet.appendRow([id, me.email, me.role, vote, new Date()]);
  }
  return resolveAndPersist_(id);
}

/** Computes the resolved decision for an item and writes it to Inventory O–Q. */
function resolveAndPersist_(id) {
  var votes = votesForItem_(id);
  var resolved = resolve_(votes);

  var inv = SpreadsheetApp.openById(SHEET_ID).getSheetByName(INVENTORY_SHEET);
  var ids = inv.getRange("A2:A").getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      var rowNum = i + 2; // O=15 decision, P=16 status, Q=17 resolved-at
      inv.getRange(rowNum, 15).setValue(resolved.decision);
      inv.getRange(rowNum, 16).setValue(resolved.status);
      inv.getRange(rowNum, 17).setValue(resolved.decision || resolved.status === "Proposed" ? new Date() : "");
      break;
    }
  }
  return resolved;
}

/** Pure resolution logic shared in spirit with the client. */
function resolve_(votes) {
  var staff = votes.filter(function (v) { return isStaffRole_(v.Role); });
  var vols = votes.filter(function (v) { return !isStaffRole_(v.Role); });

  if (staff.length === 0) {
    if (vols.length === 0) return { decision: "", status: "Undecided" };
    var t = tally_(vols);
    if (t.tie) return { decision: "", status: "Proposed" };
    return { decision: t.top, status: "Proposed" };
  }
  var distinct = {};
  staff.forEach(function (v) { distinct[v.Vote] = 1; });
  var keys = Object.keys(distinct);
  if (keys.length === 1) return { decision: keys[0], status: "Confirmed" };
  return { decision: "Keep", status: "Needs Resolution" }; // staff split → default Keep
}

function tally_(votes) {
  var c = { "Keep": 0, "Donate": 0, "Throw Away": 0 };
  votes.forEach(function (v) { if (v.Vote in c) c[v.Vote]++; });
  var top = "", max = -1, tie = false;
  ["Keep", "Donate", "Throw Away"].forEach(function (k) {
    if (c[k] > max) { max = c[k]; top = k; tie = false; }
    else if (c[k] === max && max > 0) { tie = true; }
  });
  return { top: top, tie: tie };
}

// ── Util ──────────────────────────────────────────────────────────────────────

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
