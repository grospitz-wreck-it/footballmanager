import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================
// STATE
// =====================
const state = {
campaigns: [],
events: [],
editId: null,
editEventId: null,
inlineEditId: null,
inlineEventEditId: null
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

const assets = await uploadFiles("events", qs("eventMedia").files);

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

assets,
scope,
scope_ref


};

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


import { EVENT_REGISTRY } from "./eventRegistry.js";

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

if(tab === "ads"){
qs("adsTab").classList.add("active");
qs("tabAds").classList.add("active");
}

if(tab === "events"){
qs("eventsTab").classList.add("active");
qs("tabEvents").classList.add("active");
loadEvents();
}

if(tab === "insights"){
qs("insightsTab").classList.add("active");
qs("tabInsights").classList.add("active");
}
}

// =====================
// GLOBAL CLICK HANDLER
// =====================
document.addEventListener("click", (e)=>{

const a = e.target.dataset.action;
if(!a) return;

if(a==="copy") copy(e.target.dataset.id);

if(a==="delete") deleteCampaign(e.target.dataset.id);
if(a==="editInline") state.inlineEditId = e.target.dataset.id, loadCampaigns();
if(a==="saveInline") saveInlineCampaign(e.target.dataset.id);
if(a==="cancelInline") state.inlineEditId = null, loadCampaigns();

if(a==="fullscreen"){
e.target.closest(".asset").classList.toggle("fullscreen");
}

if(a==="editInlineEvent") state.inlineEventEditId = e.target.dataset.id, loadEvents();
if(a==="saveInlineEvent") saveInlineEvent(e.target.dataset.id);
if(a==="cancelInlineEvent") state.inlineEventEditId = null, loadEvents();
if(a==="deleteEvent") deleteEvent(e.target.dataset.id);
});

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {

qs("saveBtn")?.addEventListener("click", createCampaign);
qs("createEventBtn")?.addEventListener("click", saveEvent);

qs("tabAds")?.addEventListener("click", () => switchTab("ads"));
qs("tabEvents")?.addEventListener("click", () => switchTab("events"));
qs("tabInsights")?.addEventListener("click", () => switchTab("insights"));

switchTab("ads");
loadCampaigns();
});
