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

// =====================
// CREATE / UPDATE CAMPAIGN
// =====================
async function createCampaign(){

const assets = await uploadFiles("ads", qs("image").files);

const scope = qs("scope")?.value || "global";
let scope_ref = qs("scopeRef")?.value || null;

if(scope === "team" && scope_ref){
scope_ref = scope_ref.split(",").map(s => s.trim());
}

const payload = {
name: qs("name").value,
customer: qs("customer").value,
budget: Number(qs("budget").value || 0),
link: qs("link").value,
cpm: Number(qs("cpm").value || 0),
cpc: Number(qs("cpc").value || 0),
ad_format: qs("adFormat").value,
start_date: qs("startDate").value || null,
end_date: qs("endDate").value || null,


scope,
scope_ref


};

if(state.editId){
if(assets.length) payload.assets = assets;
await supabase.from("campaigns").update(payload).eq("id", state.editId);
state.editId = null;
} else {
payload.assets = assets;
payload.active = true;
await supabase.from("campaigns").insert(payload);
}

clearForm();
loadCampaigns();
}

function clearForm(){
document.querySelectorAll("#adsTab input").forEach(i => i.value = "");
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

const { data } = await supabase
.from("campaigns")
.select("*")
.order("created_at", { ascending: false });

renderCampaigns(data || []);
}

// =====================
// RENDER CAMPAIGNS
// =====================
function renderCampaigns(list){

state.campaigns = list;

const container = qs("list");
container.innerHTML = "";

list.forEach(c => {


const isEdit = state.inlineEditId === c.id;
const assets = c.assets || [];

const assetHTML = assets.map(a=>`
  <div class="asset">
    ${a.type==="video"
      ? `<video src="${a?.url || ''}" data-action="fullscreen" muted></video>`
      : `<img src="${a?.url || ''}" data-action="fullscreen">`
    }
    <button 
      class="assetIdBtn" 
      data-action="copy" 
      data-id="${a.id}"
    >
      📋 ${a.id.slice(0,6)}
    </button>
  </div>
`).join("");

const div = document.createElement("div");
div.className = "adRow";
div.dataset.row = c.id;

div.innerHTML = `
  <div class="adLeft">
    <div class="assetRow">${assetHTML}</div>

    ${
      isEdit
      ? `
        <input data-field="customer" value="${c.customer}">
        <input data-field="name" value="${c.name}">
        <input data-field="budget" value="${c.budget}">
      `
      : `
        <strong>${c.customer}</strong><br>
        ${c.name}<br>
        💰 ${c.budget}€
      `
    }

    <div class="scopeTag">🌍 ${c.scope || "global"}</div>

    <div class="idRow">
      <button data-action="copy" data-id="${c.id}">
        ${c.id.slice(0,6)}
      </button>
    </div>
  </div>

  <div>
    ${
      isEdit
      ? `
        <button data-action="saveInline" data-id="${c.id}">💾</button>
        <button data-action="cancelInline">❌</button>
      `
      : `
        <button data-action="editInline" data-id="${c.id}">✏️</button>
        <button class="danger" data-action="delete" data-id="${c.id}">🗑️</button>
      `
    }
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

  // 🔹 DAU
  const { data: dauData } = await supabase
    .from("analytics_events")
    .select("session_id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 24*60*60*1000).toISOString());

  // 🔹 Sessions
  const { data: sessionsData } = await supabase
    .from("analytics_events")
    .select("session_id", { count: "exact", head: true });

  // 🔹 Matches
  const { count: matches } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_name", "match_start");

  // 🔹 Avg Session
  const { data: sessions } = await supabase
    .from("analytics_events")
    .select("session_id, created_at");

  const map = {};

  sessions.forEach(e => {
    if(!map[e.session_id]){
      map[e.session_id] = {
        min: e.created_at,
        max: e.created_at
      };
    } else {
      if(e.created_at < map[e.session_id].min) map[e.session_id].min = e.created_at;
      if(e.created_at > map[e.session_id].max) map[e.session_id].max = e.created_at;
    }
  });

  const durations = Object.values(map).map(s =>
    (new Date(s.max) - new Date(s.min)) / 1000
  );

  const avg = durations.length
    ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length)
    : 0;

  // 🔥 UI UPDATE
  document.getElementById("insightDAU").textContent = dauData?.length || 0;
  document.getElementById("insightSessions").textContent = sessionsData?.length || 0;
  document.getElementById("insightMatches").textContent = matches || 0;
  document.getElementById("insightAvg").textContent = avg + "s";
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

  // 🔥 reset map (wichtig bei tab switch)
  if(geoMap){
    geoMap.remove();
  }

  geoMap = L.map("geoMap").setView([51.2, 10.4], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(geoMap);

  const geoData = await getGeoData();

  const res = await fetch("admin/data/germany.json");
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

    const regionId = feature.properties.id; // ⚠️ muss passen!
    const value = geoData[regionId] || 0;

    return {
      fillColor: getColor(value),
      weight: 1,
      opacity: 1,
      color: "#333",
      fillOpacity: 0.7
    };
  }

  function onEachFeature(feature, layer){

    const regionId = feature.properties.id;
    const value = geoData[regionId] || 0;

    layer.bindPopup(`
      <strong>${feature.properties.name}</strong><br>
      Nutzer: ${value}
    `);
  }

  L.geoJSON(germany, {
    style,
    onEachFeature
  }).addTo(geoMap);
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
          ? `<input data-field="title" value="${e.title}">`
          : `<strong>${e.title}</strong>`
        }
        <br>
        🧠 ${e.type} | 🎯 ${e.trigger}<br>
        ⚡ ${e.probability} | ⏳ ${e.duration}
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

async function deleteGameEvent(id){
  await supabase.from("game_events").delete().eq("id", id);
  loadGameEvents();
}


// =====================
// INLINE EVENT UPDATE
// =====================
async function saveInlineEvent(id){

const row = document.querySelector(`[data-event-row="${id}"]`);

const payload = {
title: row.querySelector("[data-field='title']").value,
description: row.querySelector("[data-field='description']").value
};

await supabase.from("events").update(payload).eq("id", id);

state.inlineEventEditId = null;
loadEvents();
}

async function saveInlineGameEvent(id){

  const row = document.querySelector(`[data-id="${id}"]`);
  if(!row) return;

  const payload = {
    title: row.querySelector("[data-field='title']").value
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
      <textarea data-field="description">${e.description}</textarea>
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

// =====================
// DELETE EVENT
// =====================
async function deleteEvent(id){
await supabase.from("events").delete().eq("id", id);
loadEvents();
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
  // GENERIC
  // =====================
  if(a==="copy") copy(e.target.dataset.id);

  if(a==="fullscreen"){
    e.target.closest(".asset")?.classList.toggle("fullscreen");
  }

  // =====================
  // CAMPAIGNS
  // =====================
  if(a==="delete") deleteCampaign(e.target.dataset.id);
  if(a==="editInline"){
    state.inlineEditId = e.target.dataset.id;
    loadCampaigns();
  }
  if(a==="saveInline") saveInlineCampaign(e.target.dataset.id);
  if(a==="cancelInline"){
    state.inlineEditId = null;
    loadCampaigns();
  }

  // =====================
  // EVENTS
  // =====================
  if(a==="editInlineEvent"){
    state.inlineEventEditId = e.target.dataset.id;
    loadEvents();
  }
  if(a==="saveInlineEvent") saveInlineEvent(e.target.dataset.id);
  if(a==="cancelInlineEvent"){
    state.inlineEventEditId = null;
    loadEvents();
  }
  if(a==="deleteEvent") deleteEvent(e.target.dataset.id);

  // =====================
  // 🎮 GAME EVENTS (FIX)
  // =====================
  if(a==="deleteGameEvent") deleteGameEvent(e.target.dataset.id);

  if(a==="editGameEventInline"){
    state.inlineGameEventEditId = e.target.dataset.id;
    loadGameEvents();
  }

  if(a==="saveGameEventInline"){
    saveInlineGameEvent(e.target.dataset.id);
  }

  if(a==="cancelGameEventInline"){
    state.inlineGameEventEditId = null;
    loadGameEvents();
  }

});

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {

  qs("saveBtn")?.addEventListener("click", createCampaign);
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
