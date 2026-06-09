// ─────────────────────────────────────────────────────────────────────────
//  Sanctuary Inventory — front-end app (v2: multi-reviewer voting + dashboard)
// ─────────────────────────────────────────────────────────────────────────

const CFG = window.SANCTUARY_CONFIG || {};
const els = (id) => document.getElementById(id);

let idToken = null;
let me = null;                 // { email, role }
let allItems = [];             // inventory rows (with live Resolved Decision/Status)
let votesByItem = {};          // { itemId: [{ Email, Role, Vote }] }
let currentView = "review";

// ── Config + Google Sign-In ───────────────────────────────────────────────────
function configReady() {
  return (
    CFG.GOOGLE_CLIENT_ID && !CFG.GOOGLE_CLIENT_ID.startsWith("PASTE") &&
    CFG.APPS_SCRIPT_URL && !CFG.APPS_SCRIPT_URL.startsWith("PASTE")
  );
}

window.onload = function () {
  if (!configReady()) {
    const w = els("config-warning");
    w.textContent = "Setup not finished: GOOGLE_CLIENT_ID and APPS_SCRIPT_URL must be filled into config.js before sign-in works.";
    w.classList.remove("hidden");
    return;
  }
  google.accounts.id.initialize({ client_id: CFG.GOOGLE_CLIENT_ID, callback: onCredential });
  google.accounts.id.renderButton(els("gsi-button"), { theme: "filled_blue", size: "large", shape: "pill", text: "signin_with" });
};

function onCredential(resp) {
  idToken = resp.credential;
  els("gate-msg").textContent = "";
  loadInventory();
}

function signOut() {
  idToken = null; me = null; allItems = []; votesByItem = {};
  google.accounts.id.disableAutoSelect();
  ["review-view", "dashboard-view", "user-box"].forEach((id) => els(id).classList.add("hidden"));
  els("gate").classList.remove("hidden");
}

// ── API ──────────────────────────────────────────────────────────────────────
async function apiGet() {
  const url = `${CFG.APPS_SCRIPT_URL}?action=list&idToken=${encodeURIComponent(idToken)}`;
  return (await fetch(url)).json();
}
async function apiPost(payload) {
  const r = await fetch(CFG.APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, idToken }),
  });
  return r.json();
}

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadInventory() {
  showApp();
  showState("loading");
  try {
    const res = await apiGet();
    if (!res.ok) {
      if (/not on the reviewer list/i.test(res.error || "")) { signOut(); els("gate-msg").textContent = res.error; return; }
      throw new Error(res.error || "Failed to load");
    }
    me = res.me;
    allItems = res.items || [];
    votesByItem = {};
    (res.votes || []).forEach((v) => { (votesByItem[v.ItemID] ||= []).push(v); });
    allItems.forEach(syncItemFromVotes);     // keep resolved fields fresh from votes
    els("user-chip").textContent = `${me.email.split("@")[0]} · ${me.role}`;
    buildLocationFilter();
    setView(currentView);
  } catch (e) {
    showState("error", e.message);
  }
}

function showApp() {
  els("gate").classList.add("hidden");
  const ub = els("user-box"); ub.classList.remove("hidden"); ub.classList.add("flex");
}

// ── Resolution (mirrors the Apps Script) ──────────────────────────────────────
const isStaff = (role) => ["staff", "admin"].includes(String(role).toLowerCase());

function tally(votes) {
  const c = { "Keep": 0, "Donate": 0, "Throw Away": 0 };
  votes.forEach((v) => { if (v.Vote in c) c[v.Vote]++; });
  let top = "", max = -1, tie = false;
  ["Keep", "Donate", "Throw Away"].forEach((k) => {
    if (c[k] > max) { max = c[k]; top = k; tie = false; }
    else if (c[k] === max && max > 0) { tie = true; }
  });
  return { top, tie };
}

function resolveLocal(votes) {
  const staff = votes.filter((v) => isStaff(v.Role));
  const vols = votes.filter((v) => !isStaff(v.Role));
  if (!staff.length) {
    if (!vols.length) return { decision: "", status: "Undecided" };
    const t = tally(vols);
    return t.tie ? { decision: "", status: "Proposed" } : { decision: t.top, status: "Proposed" };
  }
  const distinct = [...new Set(staff.map((v) => v.Vote))];
  if (distinct.length === 1) return { decision: distinct[0], status: "Confirmed" };
  return { decision: "Keep", status: "Needs Resolution" };
}

function syncItemFromVotes(item) {
  const r = resolveLocal(votesByItem[item.ID] || []);
  item["Resolved Decision"] = r.decision;
  item["Status"] = r.status;
}

const myVote = (id) => (votesByItem[id] || []).find((v) => v.Email.toLowerCase() === me.email)?.Vote || "";

// ── Views ──────────────────────────────────────────────────────────────────────
function setView(view) {
  currentView = view;
  els("review-view").classList.toggle("hidden", view !== "review");
  els("dashboard-view").classList.toggle("hidden", view !== "dashboard");
  document.querySelectorAll(".view-tab").forEach((b) => b.classList.toggle("bg-white/15", b.dataset.view === view));
  if (view === "review") applyFilters(); else renderDashboard();
}

function showState(which, msg) {
  ["loading", "empty", "error", "grid"].forEach((id) => els(id).classList.add("hidden"));
  if (which === "grid") els("grid").classList.remove("hidden");
  else if (which) { const el = els(which); el.classList.remove("hidden"); if (msg) el.textContent = msg; }
}

// ── Review view ─────────────────────────────────────────────────────────────────
function buildLocationFilter() {
  const sel = els("filter-location"); const current = sel.value;
  const locs = [...new Set(allItems.map((i) => i.Location).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">All locations</option>' + locs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
  sel.value = current;
}

function applyFilters() {
  if (currentView !== "review") return;
  const loc = els("filter-location").value, status = els("filter-status").value, q = els("filter-search").value.trim().toLowerCase();
  const items = allItems.filter((i) => {
    if (loc && i.Location !== loc) return false;
    if (status === "mine") { if (myVote(i.ID)) return false; }
    else if (status && i["Status"] !== status) return false;
    if (q && !`${i["Item Name"]} ${i.Description} ${i.Category} ${i.Location} ${i["Sub-Area"]}`.toLowerCase().includes(q)) return false;
    return true;
  });
  renderSummary();
  if (!items.length) { showState("empty"); els("grid").innerHTML = ""; return; }
  showState("grid");
  els("grid").innerHTML = items.map(cardHtml).join("");
}

function renderSummary() {
  const n = (s) => allItems.filter((i) => i["Status"] === s).length;
  const cards = [
    ["Total", allItems.length, "text-navy"],
    ["Undecided", n("Undecided"), "text-slate-500"],
    ["Pending staff", n("Proposed"), "text-blue-600"],
    ["Needs resolution", n("Needs Resolution"), "text-amber-600"],
    ["Confirmed", n("Confirmed"), "text-green-600"],
  ];
  els("summary").innerHTML = cards.map(([l, c, cl]) => `
    <div class="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <div class="text-2xl font-extrabold ${cl}">${c}</div>
      <div class="text-xs text-slate-500 font-medium mt-0.5">${l}</div>
    </div>`).join("");
}

function statusBadge(item) {
  const s = item["Status"], d = item["Resolved Decision"];
  const map = {
    "Confirmed": ["bg-green-100 text-green-800", `✓ Confirmed: ${esc(d)}`],
    "Proposed": ["bg-blue-100 text-blue-800", d ? `Proposed: ${esc(d)} · pending staff` : "Volunteers split · pending staff"],
    "Needs Resolution": ["bg-amber-100 text-amber-900", "⚠ Staff split → defaulted to Keep"],
    "Undecided": ["bg-slate-100 text-slate-500", "Undecided"],
  };
  const [cls, label] = map[s] || map["Undecided"];
  return `<span class="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}">${label}</span>`;
}

function voteDot(v) { return v === "Keep" ? "bg-green-500" : v === "Donate" ? "bg-blue-500" : v === "Throw Away" ? "bg-red-500" : "bg-slate-300"; }

function whoVoted(id) {
  const votes = votesByItem[id] || [];
  if (!votes.length) return `<span class="text-[11px] text-slate-400">No votes yet</span>`;
  return votes.map((v) => {
    const initials = String(v.Email).split("@")[0].slice(0, 8);
    const star = isStaff(v.Role) ? "★" : "";
    return `<span class="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-1.5 py-0.5" title="${esc(v.Email)} (${esc(v.Role)})">
      <span class="w-2 h-2 rounded-full ${voteDot(v.Vote)}"></span>${star}${esc(initials)}</span>`;
  }).join(" ");
}

function cardHtml(i) {
  const id = esc(i.ID), mine = myVote(i.ID), ai = i["AI Suggested"] || "";
  const photo = i["Photo URL"]
    ? `<img src="${esc(i["Photo URL"])}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"/><div class="fallback" style="display:none">Photo unavailable</div>`
    : `<div class="fallback">No photo</div>`;
  const aiBadge = ai ? `<span class="text-[11px] text-slate-400">AI suggests <b class="font-semibold">${esc(ai)}</b></span>` : "";
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
      <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">${esc(i.Description) || ""}</p>
      <p class="text-[11px] text-slate-400">${esc(i.Category) || ""} · ${esc(i.Condition) || "—"} ${val} ${qty}</p>
      <div>${statusBadge(i)}</div>
      <div class="flex flex-wrap gap-1 items-center min-h-[1.25rem]">${whoVoted(i.ID)}</div>
      <div class="mt-auto pt-2 border-t border-slate-100">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] text-slate-400">${mine ? "Your vote: " + esc(mine) : "Your vote"}</span>
          ${aiBadge}
        </div>
        <div class="flex gap-1.5">
          <button class="disposition-btn ${mine === "Keep" ? "active-keep" : ""}" onclick="vote('${id}','Keep')">Keep</button>
          <button class="disposition-btn ${mine === "Donate" ? "active-donate" : ""}" onclick="vote('${id}','Donate')">Donate</button>
          <button class="disposition-btn ${mine === "Throw Away" ? "active-toss" : ""}" onclick="vote('${id}','Throw Away')">Throw Away</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Voting ──────────────────────────────────────────────────────────────────────
async function vote(id, choice) {
  const list = (votesByItem[id] ||= []);
  const existing = list.find((v) => v.Email.toLowerCase() === me.email);
  const next = existing && existing.Vote === choice ? "" : choice; // tap again to clear
  const snapshot = JSON.parse(JSON.stringify(list));

  // optimistic
  const without = list.filter((v) => v.Email.toLowerCase() !== me.email);
  votesByItem[id] = next ? [...without, { Email: me.email, Role: me.role, Vote: next }] : without;
  const item = allItems.find((i) => String(i.ID) === String(id));
  if (item) syncItemFromVotes(item);
  rerender();

  try {
    const res = await apiPost({ action: "vote", id, vote: next });
    if (!res.ok) throw new Error(res.error || "Save failed");
    votesByItem[id] = (res.votes || []).map((v) => ({ Email: v.Email, Role: v.Role, Vote: v.Vote }));
    if (item && res.resolved) { item["Resolved Decision"] = res.resolved.decision; item["Status"] = res.resolved.status; }
    rerender();
    toast(next ? `Your vote: ${item ? item["Item Name"] : id} → ${next}` : "Vote cleared");
  } catch (e) {
    votesByItem[id] = snapshot;            // rollback
    if (item) syncItemFromVotes(item);
    rerender();
    toast("Could not save: " + e.message, true);
  }
}

function rerender() { if (currentView === "review") applyFilters(); else renderDashboard(); }

// ── Dashboard view ───────────────────────────────────────────────────────────────
const num = (v) => Number(String(v == null ? "" : v).replace(/[^0-9.]/g, "")) || 0;
const money = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

function renderDashboard() {
  if (currentView !== "dashboard") return;
  if (!allItems.length) { els("dash-content").innerHTML = `<div class="py-20 text-center text-slate-400 text-sm">No inventory yet — catalog some photos first.</div>`; return; }

  const total = allItems.length;
  const cnt = (s) => allItems.filter((i) => i["Status"] === s).length;
  const decided = cnt("Confirmed") + cnt("Needs Resolution");
  const pct = Math.round((decided / total) * 100);

  els("dash-content").innerHTML = `
    ${progressBlock(total, decided, pct, cnt)}
    ${locationBlock()}
    ${valueBlock()}
    ${needsAttentionBlock()}
    ${actionListsBlock()}
  `;
}

function progressBlock(total, decided, pct, cnt) {
  return `
  <section class="bg-white rounded-xl border border-slate-200 p-5 mb-5">
    <div class="flex items-end justify-between mb-2">
      <h2 class="font-bold text-lg">Progress</h2>
      <span class="text-sm text-slate-500"><b class="text-navy">${decided}</b> of ${total} staff-decided · ${pct}%</span>
    </div>
    <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
      <div class="bg-green-500" style="width:${(cnt("Confirmed") / total) * 100}%" title="Confirmed"></div>
      <div class="bg-amber-400" style="width:${(cnt("Needs Resolution") / total) * 100}%" title="Needs resolution"></div>
      <div class="bg-blue-400" style="width:${(cnt("Proposed") / total) * 100}%" title="Pending staff"></div>
      <div class="bg-slate-200" style="width:${(cnt("Undecided") / total) * 100}%" title="Undecided"></div>
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-500">
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>Confirmed ${cnt("Confirmed")}</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Needs resolution ${cnt("Needs Resolution")}</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>Pending staff ${cnt("Proposed")}</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-slate-200"></span>Undecided ${cnt("Undecided")}</span>
    </div>
  </section>`;
}

function locationBlock() {
  const locs = [...new Set(allItems.map((i) => i.Location || "— No location"))].sort();
  const rows = locs.map((loc) => {
    const items = allItems.filter((i) => (i.Location || "— No location") === loc);
    const t = items.length;
    const by = (d) => items.filter((i) => i["Resolved Decision"] === d).length;
    const open = items.filter((i) => !i["Resolved Decision"]).length;
    const seg = (c, n, label) => n ? `<div class="${c}" style="width:${(n / t) * 100}%" title="${label}: ${n}"></div>` : "";
    return `
      <div class="mb-3 last:mb-0">
        <div class="flex justify-between text-xs mb-1"><span class="font-semibold">${esc(loc)}</span><span class="text-slate-400">${t - open}/${t} decided</span></div>
        <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
          ${seg("bg-green-500", by("Keep"), "Keep")}
          ${seg("bg-blue-500", by("Donate"), "Donate")}
          ${seg("bg-red-500", by("Throw Away"), "Throw Away")}
          ${seg("bg-slate-200", open, "Open")}
        </div>
      </div>`;
  }).join("");
  return `
  <section class="bg-white rounded-xl border border-slate-200 p-5 mb-5">
    <h2 class="font-bold text-lg mb-3">By location</h2>
    ${rows}
    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-500">
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>Keep</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Donate</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>Throw Away</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-slate-200"></span>Open</span>
    </div>
  </section>`;
}

function valueBlock() {
  const sum = (d) => allItems.filter((i) => i["Resolved Decision"] === d).reduce((a, i) => a + num(i["Est. Value (USD)"]) * (Number(i.Qty) || 1), 0);
  const tiles = [
    ["Donation value", sum("Donate"), "text-blue-700", "for your tax-deductible receipt"],
    ["Value kept", sum("Keep"), "text-green-700", "staying with the church"],
    ["Discarded value", sum("Throw Away"), "text-red-700", "written off"],
  ];
  return `
  <section class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
    ${tiles.map(([l, v, c, sub]) => `
      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="text-2xl font-extrabold ${c}">${money(v)}</div>
        <div class="text-sm font-semibold mt-0.5">${l}</div>
        <div class="text-[11px] text-slate-400">${sub}</div>
      </div>`).join("")}
  </section>`;
}

function needsAttentionBlock() {
  const flagged = allItems.map((i) => {
    let reason = "";
    if (i["Status"] === "Needs Resolution") reason = "Staff split (defaulted to Keep)";
    else if (i["Status"] === "Proposed") reason = "Volunteer vote awaiting staff";
    else if (/unidentified/i.test(i["Item Name"] || "")) reason = "Needs identification";
    return reason ? { i, reason } : null;
  }).filter(Boolean);

  const body = flagged.length
    ? flagged.map(({ i, reason }) => `
      <li class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
        <div class="min-w-0"><span class="font-medium text-sm">${esc(i["Item Name"])}</span>
          <span class="text-[11px] text-slate-400"> · ${esc(i.Location) || "—"}</span></div>
        <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">${esc(reason)}</span>
      </li>`).join("")
    : `<li class="py-3 text-sm text-slate-400">Nothing needs attention — every item is confirmed or untouched. 🎉</li>`;

  return `
  <section class="bg-white rounded-xl border border-slate-200 p-5 mb-5">
    <h2 class="font-bold text-lg mb-1">Needs attention <span class="text-sm font-normal text-slate-400">(${flagged.length})</span></h2>
    <ul>${body}</ul>
  </section>`;
}

function actionListsBlock() {
  const group = (decision) => {
    const items = allItems.filter((i) => i["Resolved Decision"] === decision);
    if (!items.length) return `<p class="text-sm text-slate-400">None yet.</p>`;
    const byLoc = {};
    items.forEach((i) => { (byLoc[i.Location || "— No location"] ||= []).push(i); });
    return Object.keys(byLoc).sort().map((loc) => `
      <div class="mb-2">
        <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">${esc(loc)}</p>
        <ul class="text-sm space-y-0.5">
          ${byLoc[loc].map((i) => `<li class="flex justify-between gap-2"><span>${esc(i["Item Name"])}${i.Qty && Number(i.Qty) > 1 ? ` <span class="text-slate-400">×${esc(i.Qty)}</span>` : ""}</span>${i["Est. Value (USD)"] ? `<span class="text-slate-400">~$${esc(i["Est. Value (USD)"])}</span>` : ""}</li>`).join("")}
        </ul>
      </div>`).join("");
  };
  const col = (title, decision, color) => `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <h3 class="font-bold mb-3 flex items-center gap-2"><span class="w-3 h-3 rounded-full ${color}"></span>${title}
        <span class="text-sm font-normal text-slate-400">(${allItems.filter((i) => i["Resolved Decision"] === decision).length})</span></h3>
      ${group(decision)}
    </div>`;
  return `
  <section class="mb-2">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-lg">Action lists</h2>
      <button onclick="window.print()" class="no-print text-sm px-3 py-2 rounded-lg bg-navy text-white hover:bg-navy/90 transition font-medium">Print</button>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      ${col("Donate", "Donate", "bg-blue-500")}
      ${col("Throw Away", "Throw Away", "bg-red-500")}
      ${col("Keep", "Keep", "bg-green-500")}
    </div>
  </section>`;
}

// ── Misc ──────────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, isError) {
  const t = els("toast");
  t.textContent = msg; t.classList.remove("hidden");
  t.classList.toggle("bg-red-600", !!isError); t.classList.toggle("bg-navy", !isError);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Events
els("signout-btn").addEventListener("click", signOut);
els("refresh-btn").addEventListener("click", loadInventory);
els("filter-location").addEventListener("change", applyFilters);
els("filter-status").addEventListener("change", applyFilters);
els("filter-search").addEventListener("input", applyFilters);
document.querySelectorAll(".view-tab").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
