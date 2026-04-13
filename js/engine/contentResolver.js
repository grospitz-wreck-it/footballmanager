// =========================
// 🧠 CONTENT RESOLVER (PRO)
// =========================

import { game } from "../core/state.js";

// =========================
// 🔤 NORMALIZE
// =========================
function normalize(val){
  return String(val || "").toLowerCase().trim();
}

// =========================
// 🔧 URL FIXER (ROBUST)
// =========================
function fixUrl(url){
  if(!url) return null;

  let fixed = url;

  // 🔥 Supabase Transform entfernen
  fixed = fixed.replace("/render/image/public/", "/object/public/");

  // 🔥 Encode (fix für Leerzeichen etc.)
  fixed = encodeURI(fixed);

  return fixed;
}

// =========================
// 🧼 VALIDATE ASSET
// =========================
function isValidAsset(asset){
  return asset && typeof asset.url === "string" && asset.url.length > 10;
}

// =========================
// 🧠 GET EVENTS (SAFE + FUTURE READY)
// =========================
function getGameEvents(){

  const events = game?.data?.gameEvents;

  if(!Array.isArray(events)){
    console.warn("⚠️ No gameEvents in state");
    return [];
  }

  return events;
}

// =========================
// 🎯 MAIN RESOLVER
// =========================
export function resolveEventContent(event){

  if(!event){
    console.warn("⚠️ resolveEventContent: no event");
    return emptyResult();
  }

  const events = getGameEvents();
  const type = normalize(event.type);

  if(!events.length){
    console.warn("⚠️ No events loaded");
    return emptyResult();
  }

  // =========================
  // 🔍 MATCH EVENTS
  // =========================
  const matches = events.filter(e => {

    const possible = [
      e.type,
      e.effect,
      e.eventType
    ].map(normalize);

    return possible.includes(type);
  });

  // =========================
  // ❌ NO MATCH
  // =========================
  if(!matches.length){
    console.warn("⚠️ No match for event:", type);
    return emptyResult();
  }

  // =========================
  // 🔥 PRIORITY SORT (STABLE)
  // =========================
  matches.sort((a,b) => {
    return (b.priority || 0) - (a.priority || 0);
  });

  const selected = matches[0];

  // =========================
  // 🖼 ASSETS PIPELINE
  // =========================
  let assets = [];

  if(Array.isArray(selected.assets)){

    assets = selected.assets
      .flat()
      .filter(isValidAsset)
      .map(asset => ({
        ...asset,
        url: fixUrl(asset.url)
      }));

  }

  // =========================
  // 🧾 DEBUG (nur bei Bedarf)
  // =========================
  if(game.debug?.events){
    console.log("🎯 RESOLVED EVENT:", {
      input: event,
      selected,
      assets
    });
  }

  // =========================
  // 🧾 RETURN
  // =========================
  return {
    text: selected.title || null,

    assets,

    config: {
      id: selected.id,
      category: selected.category || "default",
      priority: selected.priority || 0
    }
  };
}

// =========================
// 🧩 EMPTY RESULT
// =========================
function emptyResult(){
  return {
    text: null,
    assets: [],
    config: null
  };
}
