let insightChart = null;
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================
// STATE
// =====================
const state = {
  campaigns: [],
  events: [],
  gameEvents: [],
  editId: null,
  editEventId: null,
  inlineEditId: null,
  inlineEventEditId: null,

  // 🔥 NEU
  inlineGameEventEditId: null
};
// =====================
// HELPERS
// =====================
const normalize = (v) =>
  (v || "").toString().trim().toLowerCase();
function clearForm(){

  [
    "campaignName",
    "campaignCustomer",
    "campaignBudget",
    "campaignLink",
    "campaignStart",
    "campaignEnd",
    "targetStates",
    "targetCities",
    "targetTeams"
  ].forEach(id => {
    const el = qs(id);
    if(el) el.value = "";
  });

}



function calculateCampaignKPIs(campaign, data){

  if(!data || !data.length) return campaign;

  const adSets = campaign.ad_sets || [];
  const targeting = campaign.targeting || {};

  const updatedSets = adSets.map(set => {

   const relevant = data.filter(e => {

  if (e.ad_type !== set.type) return false;

  if (set.placement && e.placement && e.placement !== set.placement) {
    return false;
  }

  if (targeting.states?.length) {
    const states = targeting.states.map(normalize);
    const eventRegion = normalize(e.region);

    if (!eventRegion || !states.includes(eventRegion)) {
      return false;
    }
  }

  if (targeting.cities?.length) {
    const cities = targeting.cities.map(normalize);
    const eventCity = normalize(e.city);

    if (!eventCity || !cities.includes(eventCity)) {
      return false;
    }
  }

  if (targeting.teams?.length) {
    const teams = targeting.teams.map(normalize);
    const eventTeam = normalize(e.team);

    if (!eventTeam || !teams.includes(eventTeam)) {
      return false;
    }
  }

  return true;
});

// 🔥 DAS HAT GEFEHLT
const impressions = relevant.length;

  // =========================
  // 💰 REVENUE (CPM MODEL)
  // =========================
  const ecpm = 8;

  const revenue = impressions
    ? (impressions / 1000) * ecpm
    : 0;

  return {
    ...set,
    metrics: {
      impressions,
      revenue: Number(revenue.toFixed(2))
    }
  };
});

return {
  ...campaign,
  ad_sets: updatedSets
};
}
const qs = (id) => document.getElementById(id);

function uuid(){
return crypto.randomUUID();
}

function copy(text){
navigator.clipboard.writeText(text);

const el = document.createElement("div");
el.innerText = "Copied";
el.className = "copyToast";
document.body.appendChild(el);

setTimeout(()=> el.remove(), 800);
}

function toggleFullscreen(el){
el.closest(".asset").classList.toggle("fullscreen");
}
function isDebugEnabled(){
  return localStorage.getItem("debugOverlay") === "true";
}

function formatDurationVerbose(seconds){

  if(!seconds || seconds <= 0) return "0s";

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  if(min === 0) return `${sec}s`;

  return `${min}m ${sec}s`;
}

function updateDebugButton(){

  const btn = document.getElementById("toggleDebug");
  if(!btn) return;

  const enabled = isDebugEnabled();

  btn.textContent = enabled
    ? "🐞 Debug ON"
    : "🐞 Debug OFF";

  btn.style.color = enabled ? "#0f0" : "#888";
}

document.getElementById("toggleDebug")?.addEventListener("click", () => {

  const next = !isDebugEnabled();

  localStorage.setItem("debugOverlay", next.toString());

  updateDebugButton();

  // 🔥 optional: direkt reload triggern
  window.dispatchEvent(new StorageEvent("storage", {
    key: "debugOverlay"
  }));
});

function destroyChart(){
  if(insightChart){
    insightChart.destroy();
    insightChart = null;
  }
}


// INIT
updateDebugButton();
// =====================
// FILE UPLOAD
// =====================
async function uploadFiles(bucket, files){

let assets = [];

for(const file of files){


const id = uuid();
const fileName = `${id}_${file.name}`;

const { error } = await supabase.storage.from(bucket).upload(fileName, file);

if(error){
  console.error(error);
  continue;
}

const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

assets.push({
  id,
  url: data.publicUrl,
  type: file.type.includes("video") ? "video" : "image"
});


}

return assets;
}

async function createCampaign(){

  const payload = {
    name: qs("campaignName").value,
    customer: qs("campaignCustomer").value,
    budget: Number(qs("campaignBudget").value || 0),
    link: qs("campaignLink").value,

    start_date: qs("campaignStart").value || null,
    end_date: qs("campaignEnd").value || null,

    targeting: {
      states: (qs("targetStates").value || "").split(",").map(s=>s.trim()).filter(Boolean),
      cities: (qs("targetCities").value || "").split(",").map(s=>s.trim()).filter(Boolean),
      teams: (qs("targetTeams").value || "").split(",").map(s=>s.trim()).filter(Boolean)
    },

    ad_sets: [], // 🔥 NEU
    metrics_total: {},

    active: true
  };

  await supabase.from("campaigns").insert(payload);
  clearForm();
  loadCampaigns();
}
async function addAdSet(){

 const campaign = state.campaigns.find(c => c.active);

  if(!campaign){
    alert("❌ Erst Kampagne erstellen");
    return;
  }

  const adSet = {
    id: uuid(),
    type: qs("adType").value,
    placement: qs("adPlacement").value,
    freq_user: Number(qs("freqUser").value || 0),
    freq_day: Number(qs("freqDay").value || 0),
    daily_limit: Number(qs("dailyLimit").value || 0),
    assets: [],
    metrics: {}
  };

  const updated = [...(campaign.ad_sets || []), adSet];

  await supabase
    .from("campaigns")
    .update({ ad_sets: updated })
    .eq("id", campaign.id);

  loadCampaigns();
}
async function addAssets(){

  const files = qs("assetUpload").files;

  if(!files.length){
    alert("❌ Keine Assets ausgewählt");
    return;
  }

  const assets = await uploadFiles("ads", files);

  const campaign = state.campaigns.find(c => c.active);
  if(!campaign) return;

  if(!campaign.ad_sets?.length){
    alert("❌ Erst Ad Type erstellen");
    return;
  }

  // 🔥 Assets in erstes Ad Set (MVP)
const updatedSets = campaign.ad_sets.map((set, i) => {
  if(i === 0){
    return {
      ...set,
      assets: [...(set.assets || []), ...assets]
    };
  }
  return set;
});
  await supabase
    .from("campaigns")
    .update({ ad_sets: updatedSets })
    .eq("id", campaign.id);

  loadCampaigns();
}
// =====================
// INLINE UPDATE CAMPAIGN
// =====================
async function saveInlineCampaign(id){

const row = document.querySelector(`[data-row="${id}"]`);

const payload = {
name: row.querySelector("[data-field='name']").value,
customer: row.querySelector("[data-field='customer']").value,
budget: Number(row.querySelector("[data-field='budget']").value || 0)
};

await supabase.from("campaigns").update(payload).eq("id", id);

state.inlineEditId = null;
loadCampaigns();
}

// =====================
// DELETE
// =====================
async function deleteCampaign(id){
await supabase.from("campaigns").delete().eq("id", id);
loadCampaigns();
}

// =====================
// LOAD
// =====================
async function loadCampaigns(){

  // =========================
  // 🔥 LOAD CAMPAIGNS
  // =========================
  const { data: campaigns, error: cError } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if(cError){
    console.error("❌ Campaign Load Error", cError);
    return;
  }

  if(!campaigns) return;

  // =========================
  // 🔥 LOAD EVENTS (EINMAL!)
  // =========================
  const { data: events, error: eError } = await supabase
    .from("analytics_events")
    .select("*");

  if(eError){
    console.error("❌ Events Load Error", eError);
    return;
  }

  // =========================
  // 🔥 KPI CALC
  // =========================
  const enriched = campaigns.map(c => 
    calculateCampaignKPIs(c, events || [])
  );

  renderCampaigns(enriched);
}

// =====================
// RENDER CAMPAIGNS
// =====================
function renderCampaigns(list){

  state.campaigns = list;

  const container = qs("campaignList");
  container.innerHTML = "";

  list.forEach(c => {

    const adSets = c.ad_sets || [];

    // =========================
    // 🔥 KPI CALC
    // =========================
    let totalRevenue = 0;

    adSets.forEach(s => {
      totalRevenue += s.metrics?.revenue || 0;
    });

    // =========================
    // 🎯 BREAKDOWN UI
    // =========================
    const breakdownHTML = adSets.map(set => {

      const revenue = set.metrics?.revenue || 0;
      const impressions = set.metrics?.impressions || 0;

      const share = totalRevenue
        ? Math.round((revenue / totalRevenue) * 100)
        : 0;

      return `
        <div style="margin-top:6px;">
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <span>${set.type.toUpperCase()}</span>
            <span>€${revenue} • ${share}%</span>
          </div>

          <div style="
            height:6px;
            background:#0f172a;
            border-radius:4px;
            overflow:hidden;
            margin-top:3px;
          ">
            <div style="
              width:${share}%;
              height:100%;
              background:linear-gradient(90deg,#22c55e,#3b82f6);
            "></div>
          </div>

          <div style="font-size:11px; color:#94a3b8;">
            IMP ${impressions}
          </div>
        </div>
      `;
    }).join("");

    // =========================
    // 🎮 ASSETS
    // =========================

  const adSetHTML = adSets.map(set => {

  const assets = set.assets || [];

  const assetHTML = assets.map(a=>`
    <div class="asset small">
      ${
        a.type==="video"
        ? `<video src="${a?.url || ''}" muted></video>`
        : `<img src="${a?.url || ''}">`
      }
    </div>
  `).join("");

  return `
    <div class="box" style="margin-top:10px;">
      <strong>${set.type.toUpperCase()}</strong><br>
      🎯 ${set.placement || "-"} • 🔁 ${set.freq_user || 0}/user

      <div class="assetRow">${assetHTML}</div>
    </div>
  `;

}).join("");
    

    // =========================
    // 🎯 TARGETING
    // =========================
    const targeting = c.targeting?.states?.length
      ? c.targeting.states.join(", ")
      : "Alle";

    // =========================
    // 🎯 CARD
    // =========================
    const div = document.createElement("div");
    div.className = "adRow";

    div.innerHTML = `
      <div style="width:100%">

        <div class="adLeft">
          <div>
            <strong>${c.customer}</strong><br>
            ${c.name}<br>
            💰 ${c.budget}€
          </div>

          <div class="scopeTag">
            🎯 ${targeting}
          </div>
        </div>

        <!-- 🔥 KPI BREAKDOWN -->
        <div style="margin-top:10px;">
          ${breakdownHTML}
        </div>

        <!-- 🔽 AD TYPES -->
        <div style="margin-top:10px;">
          ${adSetHTML}
        </div>

        <div style="margin-top:10px;">
          <button data-action="delete" data-id="${c.id}">🗑️</button>
        </div>

      </div>
    `;

    container.appendChild(div);
  });
}
// =====================
// EVENTS
// =====================
async function saveEvent(){

  const files = qs("eventMedia").files;

  // ❌ KEIN FILE → BLOCKIEREN
  if(!files || !files.length){
    alert("❌ Bitte mindestens ein Asset hochladen (WEBP)");
    return;
  }

  const assets = await uploadFiles("events", files);

  // ❌ Upload fehlgeschlagen
  if(!assets.length){
    alert("❌ Upload fehlgeschlagen");
    return;
  }

  const scope = qs("eventScope")?.value || "global";
  let scope_ref = qs("eventScopeRef")?.value || null;

  if(scope === "team" && scope_ref){
    scope_ref = scope_ref.split(",").map(s => s.trim());
  }

  const payload = {
    title: qs("eventTitle").value,
    description: qs("eventDescription").value,

    probability: Number(qs("eventProbability").value || 0),
    duration: Number(qs("eventDuration").value || 0),

    effect_type: qs("eventEffectType").value,
    effect_target: qs("eventTarget").value,
    effect_value: Number(qs("eventValue").value || 0),

    modifier_attack: Number(qs("eventAttack").value || 0),
    modifier_defense: Number(qs("eventDefense").value || 0),

    // 🔥 WICHTIG
    assets: assets,

    scope,
    scope_ref
  };

  console.log("🚀 SAVE EVENT:", payload);

  if(state.editEventId){
    await supabase.from("events").update(payload).eq("id", state.editEventId);
    state.editEventId = null;
  } else {
    await supabase.from("events").insert(payload);
  }

  clearEventForm();
  loadEvents();
}
function clearEventForm(){
document.querySelectorAll("#eventsTab input, #eventsTab textarea, #eventsTab select")
.forEach(i => i.value = "");
}


import { EVENT_REGISTRY } from "./engine/eventRegistry.js";

function loadEventTypes(){

  const select = qs("geType");
  select.innerHTML = "";

  Object.values(EVENT_REGISTRY).forEach(e => {

    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = e.label;

    select.appendChild(opt);
  });
}


async function loadInsights(){

  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_name, session_id, created_at");

  if(!events || !events.length) return;

  // =========================
  // 🧠 SESSION BUILD
  // =========================
  const sessions = {};

  events.forEach(e => {

    if(!sessions[e.session_id]){
      sessions[e.session_id] = {
        start: e.created_at,
        end: e.created_at,
        events: []
      };
    }

    sessions[e.session_id].events.push(e.event_name);

    if(e.created_at < sessions[e.session_id].start){
      sessions[e.session_id].start = e.created_at;
    }

    if(e.created_at > sessions[e.session_id].end){
      sessions[e.session_id].end = e.created_at;
    }
  });

  const sessionList = Object.values(sessions);

  // =========================
  // 🔥 KPI CALC
  // =========================
  const dau = new Set(events.map(e => e.session_id)).size;

  const matches = events.filter(e => e.event_name === "match_start").length;

  const durations = sessionList.map(s =>
    (new Date(s.end) - new Date(s.start)) / 1000
  );

  const avgSession = durations.length
    ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length)
    : 0;

  const matchesPerSession = sessionList.length
    ? (matches / sessionList.length).toFixed(2)
    : 0;

  // =========================
  // 🎯 SEGMENTATION
  // =========================
  let casual = 0;
  let core = 0;
  let hardcore = 0;

  sessionList.forEach(s => {

    const matchCount = s.events.filter(e => e === "match_start").length;

    if(matchCount <= 1) casual++;
    else if(matchCount <= 4) core++;
    else hardcore++;
  });

  // =========================
  // 💰 MONETIZATION (🔥 NEU)
  // =========================
  const adInterval = 120; // Sekunden pro Ad

  const adsPerSession = Math.floor(avgSession / adInterval);

  const totalImpressions = adsPerSession * sessionList.length;

  const avgCPM = 8; // € – später dynamisch möglich
  const revenue = ((totalImpressions / 1000) * avgCPM).toFixed(2);

  // =========================
  // 🔁 RETENTION PROXY
  // =========================
  const returningUsers = sessionList.filter(s => s.events.length > 5).length;

  const retention = sessionList.length
    ? ((returningUsers / sessionList.length) * 100).toFixed(1)
    : 0;

  // =========================
  // 🧠 ENGAGEMENT SCORE
  // =========================
  const engagementScore = avgSession > 600
    ? "🔥 HIGH"
    : avgSession > 300
    ? "⚡ MEDIUM"
    : "🧊 LOW";

  // =========================
  // ⏱ FORMAT DURATION
  // =========================
  function formatDuration(seconds){

    if(!seconds || seconds <= 0) return "0:00";

    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);

    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  // =========================
  // 🔥 UI UPDATE
  // =========================
  qs("insightDAU").textContent = dau;
  qs("insightSessions").textContent = sessionList.length;
  qs("insightMatches").textContent = matches;
  qs("insightAvg").textContent = formatDurationVerbose(avgSession);
  
  const mps = qs("insightMPS");
  if(mps) mps.textContent = matchesPerSession;

  const eng = qs("insightEngagement");
  if(eng) eng.textContent = engagementScore;

  const seg = qs("insightSegments");
  if(seg){
    seg.innerHTML = `
      Casual: ${casual}<br>
      Core: ${core}<br>
      Hardcore: ${hardcore}
    `;
  }

  // =========================
  // 💰 MONETIZATION UI
  // =========================
  const monet = qs("insightMonetization");

  if(monet){
    monet.innerHTML = `
      📺 Ads / Session: ${adsPerSession}<br>
      👁 Impressions: ${totalImpressions}<br>
      💰 Revenue: €${revenue}<br>
      🔁 Retention: ${retention}%
    `;
  }
}



async function getChartData(){

  const { data } = await supabase
    .from("analytics_events")
    .select("created_at, session_id")
    .order("created_at", { ascending: true });

  const map = {};

  data?.forEach(e => {

    const date = new Date(e.created_at).toLocaleDateString();

    if(!map[date]){
      map[date] = new Set();
    }

    map[date].add(e.session_id);
  });

  // 🔥 Sets → Zahlen
  const labels = Object.keys(map);
  const values = labels.map(d => map[d].size);

  return { labels, values };
}

async function loadChart(){

  const ctx = document.getElementById("insightChart");

  // 🔥 FIX 1: Canvas existiert?
  if(!ctx) return;

  // 🔥 FIX 2: alten Chart sauber zerstören
  if(insightChart){
    insightChart.destroy();
    insightChart = null;
  }

  const data = await getChartData();

  insightChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [{
        label: "Events",
        data: data.values
      }]
    }
  });
}

async function getGeoData(){

  const { data } = await supabase
    .from("analytics_events")
    .select("region_id");

  const map = {};

  (data || []).forEach(e => {
  if(!e.region_id) return;

    map[e.region_id] = (map[e.region_id] || 0) + 1;
  });

  return map;
}

let geoMap = null;

async function loadGeoMap(){

  const container = document.getElementById("geoMap");
  if(!container) return;

  if(geoMap){
    geoMap.remove();
  }

  geoMap = L.map("geoMap").setView([51.2, 10.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(geoMap);

  const geoData = await getGeoData();

  const res = await fetch("./admin/data/germany.json");
  const germany = await res.json();

  function getColor(value){
    if(value > 200) return "#800026";
    if(value > 100) return "#BD0026";
    if(value > 50) return "#E31A1C";
    if(value > 20) return "#FC4E2A";
    if(value > 10) return "#FD8D3C";
    if(value > 5) return "#FEB24C";
    if(value > 0) return "#FED976";
    return "#EEE";
  }

  function style(feature){
    const regionId = feature.properties.id;
    const value = geoData[regionId] || 0;

    return {
      fillColor: getColor(value),
      weight: 1,
      opacity: 1,
      color: "#333",
      fillOpacity: 0.7
    };
  }

  const geoLayer = L.geoJSON(germany, {

    style,

    onEachFeature: (feature, layer) => {

      const regionId = feature.properties.id;
      const value = geoData[regionId] || 0;

      layer.bindTooltip(`
        <strong>${feature.properties.name}</strong><br>
        👥 ${value} Nutzer
      `);

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            weight: 2,
            color: "#000",
            fillOpacity: 0.9
          });
          l.bringToFront();
        },
        mouseout: (e) => {
          geoLayer.resetStyle(e.target);
        }
      });
    }

  }).addTo(geoMap);

  // 🔥 BONUS: Top Regionen anzeigen
  renderTopRegions(geoData);
}


  function renderTopRegions(geoData){

  const container = document.getElementById("topRegions");
  if(!container) return;

  const sorted = Object.entries(geoData)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  if(!sorted.length){
    container.innerHTML = "Keine Daten";
    return;
  }

  container.innerHTML = sorted.map(([id, val], i) => `
    <div class="regionRow">
      <span>#${i+1} Region ${id}</span>
      <strong>${val}</strong>
    </div>
  `).join("");
}

// =====================
// 🎮 GAME EVENTS (NEU)
// =====================

async function saveGameEvent(){

  const files = qs("geMedia")?.files;

  if(!files || !files.length){
    alert("❌ Game Event braucht Asset!");
    return;
  }

  const assets = await uploadFiles("game-events", files);

  if(!assets.length){
    alert("❌ Upload failed");
    return;
  }

  const payload = {
    title: qs("geTitle")?.value,
    type: qs("geType")?.value,
    trigger: qs("geTrigger")?.value,
    probability: Number(qs("geProbability")?.value || 0),
    value: Number(qs("geValue")?.value || 0),
    duration: Number(qs("geDuration")?.value || 0),

    // 🔥 WICHTIG
    assets: assets,

    active: true
  };

  console.log("🎮 SAVE GAME EVENT:", payload);

  await supabase.from("game_events").insert(payload);

  loadGameEvents();
}

async function loadGameEvents(){

  const { data } = await supabase
    .from("game_events")
    .select("*")
    .order("created_at", { ascending: false });

  renderGameEvents(data || []);
}


async function deleteGameEvent(id){
  await supabase.from("game_events").delete().eq("id", id);
  loadGameEvents();
}


// =====================
// INLINE EVENT UPDATE
// =====================
async function saveInlineEvent(id){

  const row = document.querySelector(`[data-event-row="${id}"]`);
  if(!row) return;

  const payload = {
    title: row.querySelector("[data-field='title']").value,
    description: row.querySelector("[data-field='description']").value,

    effect_type: row.querySelector("[data-field='effect_type']").value,
    effect_target: row.querySelector("[data-field='effect_target']").value,

    effect_value: Number(row.querySelector("[data-field='effect_value']").value || 0),
    probability: Number(row.querySelector("[data-field='probability']").value || 0),
    duration: Number(row.querySelector("[data-field='duration']").value || 0)
  };

  await supabase.from("events").update(payload).eq("id", id);

  state.inlineEventEditId = null;
  loadEvents();
}

async function saveInlineGameEvent(id){

  const row = document.querySelector(`[data-id="${id}"]`);
  if(!row) return;

  const payload = {
    title: row.querySelector("[data-field='title']").value,
    type: row.querySelector("[data-field='type']").value,
    trigger: row.querySelector("[data-field='trigger']").value,

    probability: Number(row.querySelector("[data-field='probability']").value || 0),
    value: Number(row.querySelector("[data-field='value']").value || 0),
    duration: Number(row.querySelector("[data-field='duration']").value || 0)
  };

  await supabase.from("game_events").update(payload).eq("id", id);

  state.inlineGameEventEditId = null;
  loadGameEvents();
}

// =====================
// LOAD EVENTS
// =====================
async function loadEvents(){

const { data } = await supabase.from("events").select("*");

renderEvents(data || []);
}

// =====================
// RENDER EVENTS
// =====================
function renderEvents(list){

  state.events = list;

  const container = qs("eventList");
  container.innerHTML = "";

  list.forEach(e => {

    const isEdit = state.inlineEventEditId === e.id;
    const assets = e.assets || [];

    const assetHTML = assets.map(a=>`
      <div class="asset small">
        ${
          a.type==="video"
          ? `<video src="${a?.url || ''}" muted></video>`
          : `<img src="${a?.url || ''}">`
        }
      </div>
    `).join("");

    const div = document.createElement("div");
    div.className = "eventRow";
    div.dataset.eventRow = e.id;

    div.innerHTML = `
      ${
        isEdit
        ? `
          <input data-field="title" value="${e.title}">
          <textarea data-field="description">${e.description || ""}</textarea>

          <select data-field="effect_type">
            <option value="goal" ${e.effect_type==="goal"?"selected":""}>⚽ Tor</option>
            <option value="modifier" ${e.effect_type==="modifier"?"selected":""}>📊 Modifier</option>
            <option value="pause" ${e.effect_type==="pause"?"selected":""}>⏸ Pause</option>
            <option value="resume" ${e.effect_type==="resume"?"selected":""}>▶️ Resume</option>
            <option value="end" ${e.effect_type==="end"?"selected":""}>🏁 Ende</option>
          </select>

          <select data-field="effect_target">
            <option value="home" ${e.effect_target==="home"?"selected":""}>Home</option>
            <option value="away" ${e.effect_target==="away"?"selected":""}>Away</option>
            <option value="both" ${e.effect_target==="both"?"selected":""}>Beide</option>
          </select>

          <input data-field="effect_value" type="number" value="${e.effect_value || 0}">
          <input data-field="probability" type="number" step="0.01" value="${e.probability || 0}">
          <input data-field="duration" type="number" value="${e.duration || 0}">
        `
        : `
          <strong>${e.title}</strong><br>
          ${e.description || ""}
        `
      }

      <div class="metaRow">
        🎯 ${e.effect_type} | ${e.effect_target} | ${e.effect_value}<br>
        ⚡ ${e.probability} | ⏳ ${e.duration}
      </div>

      <div class="assetRow">${assetHTML}</div>

      <div>
        ${
          isEdit
          ? `
            <button data-action="saveInlineEvent" data-id="${e.id}">💾</button>
            <button data-action="cancelInlineEvent">❌</button>
          `
          : `
            <button data-action="editInlineEvent" data-id="${e.id}">✏️</button>
            <button class="danger" data-action="deleteEvent" data-id="${e.id}">🗑️</button>
          `
        }
      </div>
    `;

    container.appendChild(div);
  });
}

function renderGameEvents(list){

  state.gameEvents = list;

  const container = qs("gameEventList");
  if(!container) return;

  container.innerHTML = "";

  list.forEach(e => {

    const isEdit = state.inlineGameEventEditId === e.id;
    const assets = e.assets || [];

    const assetHTML = assets.map(a=>`
      <div class="asset small">
        ${
          a.type==="video"
          ? `<video src="${a?.url || ''}" muted></video>`
          : `<img src="${a?.url || ''}">`
        }
      </div>
    `).join("");

    const div = document.createElement("div");
    div.className = "eventRow";
    div.dataset.id = e.id;

    div.innerHTML = `
      <div>
        ${
          isEdit
          ? `
            <input data-field="title" value="${e.title}">

            <input data-field="type" value="${e.type}">
            <input data-field="trigger" value="${e.trigger}">

            <input data-field="probability" type="number" step="0.01" value="${e.probability || 0}">
            <input data-field="value" type="number" value="${e.value || 0}">
            <input data-field="duration" type="number" value="${e.duration || 0}">
          `
          : `
            <strong>${e.title}</strong><br>
            🧠 ${e.type} | 🎯 ${e.trigger}<br>
            ⚡ ${e.probability} | ⏳ ${e.duration}
          `
        }
      </div>

      <div class="assetRow">${assetHTML}</div>

      <div>
        ${
          isEdit
          ? `
            <button data-action="saveGameEventInline" data-id="${e.id}">💾</button>
            <button data-action="cancelGameEventInline">❌</button>
          `
          : `
            <button data-action="editGameEventInline" data-id="${e.id}">✏️</button>
            <button class="danger" data-action="deleteGameEvent" data-id="${e.id}">🗑️</button>
          `
        }
      </div>
    `;

    container.appendChild(div);
  });
}


// =====================
// DELETE EVENT
// =====================
async function deleteEvent(id){
await supabase.from("events").delete().eq("id", id);
loadEvents();
}

// =====================
// Edit Assets
// =====================
async function removeAssetFromEvent(eventId, assetId, table){

  const { data } = await supabase
    .from(table)
    .select("assets")
    .eq("id", eventId)
    .single();

  if(!data) return;

  const updated = (data.assets || []).filter(a => a.id !== assetId);

  await supabase
    .from(table)
    .update({ assets: updated })
    .eq("id", eventId);

  if(table === "events") loadEvents();
  if(table === "game_events") loadGameEvents();
}
async function uploadInlineAssets(eventId, files, table){

  const bucket = table === "events" ? "events" : "game-events";

  const newAssets = await uploadFiles(bucket, files);

  if(!newAssets.length) return;

  const { data } = await supabase
    .from(table)
    .select("assets")
    .eq("id", eventId)
    .single();

  const updated = [
    ...(data.assets || []),
    ...newAssets
  ];

  await supabase
    .from(table)
    .update({ assets: updated })
    .eq("id", eventId);

  if(table === "events") loadEvents();
  if(table === "game_events") loadGameEvents();
}


// =====================
// TABS
// =====================
function switchTab(tab){

  document.querySelectorAll(".tabContent").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));

  // 🔥 FIX: ADS TAB (fehlte)
  if(tab === "ads"){
    qs("adsTab")?.classList.add("active");
    qs("tabAds")?.classList.add("active");
    loadCampaigns();
  }

  if(tab === "game"){
    qs("gameEventsTab")?.classList.add("active");
    qs("tabGameEvents")?.classList.add("active");
    loadGameEvents();
  }

  if(tab === "events"){
    qs("eventsTab")?.classList.add("active");
    qs("tabEvents")?.classList.add("active");
    loadEvents();
  }

if(tab === "insights"){

  qs("insightsTab")?.classList.add("active");
  qs("tabInsights")?.classList.add("active");

  destroyChart();

  loadInsights();
  loadChart();
  loadGeoMap(); // 🔥 DAS HAT GEFEHLT
}
}

// =====================
// GLOBAL CLICK HANDLER
// =====================
document.addEventListener("click", (e)=>{

  const a = e.target.dataset.action;
  if(!a) return;

  // =====================
  // 🖼 ASSET ACTIONS (NEU)
  // =====================
  if(a==="deleteAsset"){
    removeAssetFromEvent(
      e.target.dataset.eventId,
      e.target.dataset.assetId,
      e.target.dataset.table
    );
  }

  if(a==="uploadAssetInline"){
    const input = document.querySelector(
      `input[data-upload="${e.target.dataset.id}"]`
    );

    if(!input || !input.files.length){
      alert("Kein File");
      return;
    }

    uploadInlineAssets(
      e.target.dataset.id,
      input.files,
      e.target.dataset.table
    );
  }

  // =====================
  // CAMPAIGNS
  // =====================
  if(a==="delete") deleteCampaign(e.target.dataset.id);

  // =====================
  // EVENTS
  // =====================
  if(a==="editInlineEvent"){
    state.inlineEventEditId = e.target.dataset.id;
    loadEvents();
  }

  if(a==="saveInlineEvent") saveInlineEvent(e.target.dataset.id);

  // =====================
  // GAME EVENTS
  // =====================
  if(a==="editGameEventInline"){
    state.inlineGameEventEditId = e.target.dataset.id;
    loadGameEvents();
  }

});

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {

  qs("createCampaignBtn")?.addEventListener("click", createCampaign);
  qs("addAdSetBtn")?.addEventListener("click", addAdSet);
  qs("addAssetBtn")?.addEventListener("click", addAssets);
  qs("createEventBtn")?.addEventListener("click", saveEvent);

  // 🔥 GAME EVENTS
  qs("saveGameEventBtn")?.addEventListener("click", saveGameEvent);

  qs("tabAds")?.addEventListener("click", () => switchTab("ads"));
  qs("tabEvents")?.addEventListener("click", () => switchTab("events"));
  qs("tabInsights")?.addEventListener("click", () => switchTab("insights"));
  qs("tabGameEvents")?.addEventListener("click", () => switchTab("game"));

  // 🔥 INIT LOADS
  loadGameEvents();
  loadEventTypes();

  switchTab("ads");
  loadCampaigns();
});
