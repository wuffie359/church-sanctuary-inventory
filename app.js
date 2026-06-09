// ─────────────────────────────────────────────────────────────────────────
//  Sanctuary Inventory — front-end app
//  Auth: Google Sign-In (ID token) → sent with every request → verified +
//  allowlist-checked server-side by the Apps Script. The token is the key;
//  nothing loads until a signed-in, approved staff member is verified.
// ─────────────────────────────────────────────────────────────────────────

const CFG = window.SANCTUARY_CONFIG || {};
const els = (id) => document.getElementById(id);

let idToken = null;
let allItems = [];

// ── Config sanity ────────────────────────────────────────────────────────────
function configReady() {
  return (
    CFG.GOOGLE_CLIENT_ID && !CFG.GOOGLE_CLIENT_ID.startsWith("PASTE") &&
    CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.startsWith("PASTE")
  );
}

// ── Google Sign-In ───────────────────────────────────────────────────────────
window.onload = function () {
  if (!configReady()) {
    const w = els("config-warning");
    w.textContent =
      "Setup not finished: GOOGLE_CLIENT_ID and APPS_SCRIPT_URL must be filled into config.js before sign-in works.";
    w.classList.remove("hidden");
    return;
  }
  google.accounts.id.initialize({
    client_id: CFG.GOOGLE_CLIENT_ID,
    callback: onCredential,
  });
  google.accounts.id.renderButton(els("gsi-button"), {
    theme: "filled_blue", size: "large", shape: "pill", text: "signin_with",
  });
};

function onCredential(resp) {
  idToken = resp.credential;
  const claims = decodeJwt(idToken);
  els("user-email").textContent = claims.email || "";
  els("gate-msg").textContent = "";
  showApp();
  loadInventory();
}

function decodeJwt(t) {
  try {
    return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch (e) { return {}; }
}

function signOut() {
  idToken = null;
  allItems = [];
  google.accounts.id.disableAutoSelect();
  els("app").classList.add("hidden");
  els("user-box").classList.add("hidden");
  els("gate").classList.remove("hidden");
}

function showApp() {
  els("gate").classList.add("hidden");
  els("app").classList.remove("hidden");
  els("user-box").classList.remove("hidden");
  els("user-box").classList.add("flex");
}

// ── API ──────────────────────────────────────────────────────────────────────
async function apiGet(action) {
  const url = `${CFG.APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}&idToken=${encodeURIComponent(idToken)}`;
  const r = await fetch(url, { method: "GET" });
  return r.json();
}

async function apiPost(payload) {
  // text/plain avoids a CORS preflight that Apps Script cannot answer.
  const r = await fetch(CFG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, idToken }),
  });
  return r.json();
}

// ── Load + render ─────────────────────────────────────────────────────────────
async function loadInventory() {
  showState("loading");
  try {
    const res = await apiGet("list");
    if (!res.ok) {
      if (/not on the staff list/i.test(res.error || "")) {
        signOut();
        els("gate-msg").textContent = res.error;
        return;
      }
      throw new Error(res.error || "Failed to load");
    }
    allItems = res.items || [];
    buildLocationFilter();
    applyFilters();
  } catch (e) {
    showState("error", e.message);
  }
}

function showState(which, msg) {
  ["loading", "empty", "error", "grid"].forEach((id) => els(id).classList.add("hidden"));
  if (which === "grid") els("grid").classList.remove("hidden");
  else if (which) {
    const el = els(which);
    el.classList.remove("hidden");
    if (msg) el.textContent = msg;
  }
}

function buildLocationFilter() {
  const sel = els("filter-location");
  const current = sel.value;
  const locs = [...new Set(allItems.map((i) => i.Location).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">All locations</option>' +
    locs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
  sel.value = current;
}

function applyFilters() {
  const loc = els("filter-location").value;
  const status = els("filter-status").value;
  const q = els("filter-search").value.trim().toLowerCase();

  let items = allItems.filter((i) => {
    if (loc && i.Location !== loc) return false;
    const decision = i["Staff Decision"] || "";
    if (status === "undecided" && decision) return false;
    if (status === "decided" && !decision) return false;
    if (["Keep", "Donate", "Throw Away"].includes(status) && decision !== status) return false;
    if (q) {
      const hay = `${i["Item Name"]} ${i.Description} ${i.Category} ${i.Location} ${i["Sub-Area"]}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  renderSummary();
  if (!items.length) { showState("empty"); renderGrid([]); return; }
  showState("grid");
  renderGrid(items);
}

function renderSummary() {
  const total = allItems.length;
  const decided = allItems.filter((i) => i["Staff Decision"]).length;
  const by = (d) => allItems.filter((i) => i["Staff Decision"] === d).length;
  const cards = [
    ["Total items", total, "text-navy"],
    ["Needs decision", total - decided, "text-amber-600"],
    ["Keep", by("Keep"), "text-green-600"],
    ["Donate", by("Donate"), "text-blue-600"],
    ["Throw Away", by("Throw Away"), "text-red-600"],
  ];
  els("summary").innerHTML = cards.map(([label, n, c]) => `
    <div class="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div class="text-2xl font-extrabold ${c}">${n}</div>
      <div class="text-xs text-slate-500 font-medium mt-0.5">${label}</div>
    </div>`).join("");
}

function renderGrid(items) {
  els("grid").innerHTML = items.map(cardHtml).join("");
}

function cardHtml(i) {
  const id = esc(i.ID);
  const decision = i["Staff Decision"] || "";
  const ai = i["AI Suggested"] || "";
  const photo = i["Photo URL"]
    ? `<img src="${esc(i["Photo URL"])}" alt="${esc(i["Item Name"])}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';" /><div class="fallback" style="display:none">Photo unavailable<br><span class="text-[10px]">(share the Drive folder with staff)</span></div>`
    : `<div class="fallback">No photo</div>`;

  const aiBadge = ai ? `<span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${aiColor(ai)}">AI suggests: ${esc(ai)}</span>` : "";
  const val = i["Est. Value (USD)"] ? `· ~$${esc(i["Est. Value (USD)"])}` : "";
  const qty = i.Qty && Number(i.Qty) > 1 ? `· Qty ${esc(i.Qty)}` : "";

  return `
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
    <div class="photo-box">${photo}</div>
    <div class="p-3.5 flex flex-col gap-2 flex-1">
      <div>
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-bold text-sm leading-snug">${esc(i["Item Name"]) || "Untitled item"}</h3>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">${esc(i.Location) || "—"}${i["Sub-Area"] ? " · " + esc(i["Sub-Area"]) : ""}</p>
      </div>
      <p class="text-xs text-slate-600 leading-relaxed line-clamp-3">${esc(i.Description) || ""}</p>
      <p class="text-[11px] text-slate-400">${esc(i.Category) || ""} · ${esc(i.Condition) || "—"} ${val} ${qty}</p>
      <div class="flex flex-wrap gap-1.5 items-center">${aiBadge}</div>
      ${i["AI Reasoning"] ? `<p class="text-[11px] text-slate-400 italic leading-snug">${esc(i["AI Reasoning"])}</p>` : ""}

      <div class="mt-auto pt-2 border-t border-slate-100">
        <div class="flex gap-1.5">
          <button class="disposition-btn ${decision === "Keep" ? "active-keep" : ""}" onclick="decide('${id}','Keep')">Keep</button>
          <button class="disposition-btn ${decision === "Donate" ? "active-donate" : ""}" onclick="decide('${id}','Donate')">Donate</button>
          <button class="disposition-btn ${decision === "Throw Away" ? "active-toss" : ""}" onclick="decide('${id}','Throw Away')">Throw Away</button>
        </div>
        ${decision ? `<p class="text-[10px] text-slate-400 mt-1.5">Decided${i["Decided By"] ? " by " + esc(String(i["Decided By"]).split("@")[0]) : ""}</p>` : ""}
      </div>
    </div>
  </div>`;
}

function aiColor(d) {
  return d === "Keep" ? "bg-green-50 text-green-700"
    : d === "Donate" ? "bg-blue-50 text-blue-700"
    : d === "Throw Away" ? "bg-red-50 text-red-700"
    : "bg-slate-100 text-slate-600";
}

// ── Decide ────────────────────────────────────────────────────────────────────
async function decide(id, decision) {
  const item = allItems.find((i) => String(i.ID) === String(id));
  if (!item) return;
  const prev = item["Staff Decision"] || "";
  const next = prev === decision ? "" : decision; // tap again to clear
  item["Staff Decision"] = next; // optimistic
  applyFilters();
  try {
    const res = await apiPost({ action: "decide", id, decision: next, notes: item["Staff Notes"] || "" });
    if (!res.ok) throw new Error(res.error || "Save failed");
    toast(next ? `Marked “${item["Item Name"]}” → ${next}` : "Decision cleared");
  } catch (e) {
    item["Staff Decision"] = prev; // rollback
    applyFilters();
    toast("Could not save: " + e.message, true);
  }
}

// ── Misc ──────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, isError) {
  const t = els("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  t.classList.toggle("bg-red-600", !!isError);
  t.classList.toggle("bg-navy", !isError);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Events
els("signout-btn").addEventListener("click", signOut);
els("refresh-btn").addEventListener("click", loadInventory);
els("filter-location").addEventListener("change", applyFilters);
els("filter-status").addEventListener("change", applyFilters);
els("filter-search").addEventListener("input", applyFilters);
