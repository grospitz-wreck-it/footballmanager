// =========================
// 🧠 CONTENT RESOLVER (MINIMAL FIXED)
// =========================

import { game } from "../core/state.js";

// =========================
// 🔤 NORMALIZE
// =========================
function normalize(val){
  return String(val || "").toLowerCase().trim();
}

// =========================
// 👤 PLAYER
// =========================
function getPlayerNameById(id){

  if(!id) return "ein Spieler";

  const players = window.playerPool || [];

  const p = players.find(p => String(p?.id) === String(id));

  if(!p){
    console.warn("❌ Player not found:", id);
    return "ein Spieler";
  }

  return p.name || "ein Spieler";
}

// =========================
// 🏆 TEAM
// =========================
function getTeamNameById(id){

  if(!id) return "ein Team";

  const teams =
    game?.league?.current?.teams ||
    game?.leagues?.flatMap(l => l.teams) ||
    window.teams ||
    [];

  const t = teams.find(t => String(t.id) === String(id));

  return t?.name || "ein Team";
}

// =========================
// 🔧 URL FIX
// =========================
function fixUrl(url){
  if(!url) return null;

  let fixed = url;

  fixed = fixed.replace("/render/image/public/", "/object/public/");
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
// 🧠 EVENTS SOURCE
// =========================
function getEventDefinitions(){

  const defs =
    game?.data?.eventDefinitions ||
    game?.data?.gameEvents ||
    [];

  if(!Array.isArray(defs)){
    console.warn("⚠️ No event definitions in state");
    return [];
  }

  return defs;
}

// =========================
// 🎯 MAIN RESOLVER (UNVERÄNDERT)
// =========================
function resolveEventContent(event){

  if(!event){
    console.warn("⚠️ resolveEventContent: no event");
    return emptyResult();
  }

  const definitions = getEventDefinitions();
  const type = normalize(event.type);

  console.log("🧠 RESOLVER INPUT:", {
    type,
    definitions: definitions.length
  });

  if(!definitions.length){
    console.warn("⚠️ No events loaded");
    return emptyResult();
  }

  const matches = definitions.filter(e => {

    const possible = [
      e.type,
      e.effect,
      e.event_type,
      e.eventType
    ].map(normalize);

    return possible.includes(type);
  });

  if(!matches.length){
    console.warn("⚠️ No definition match for:", type);
    return emptyResult();
  }

  matches.sort((a,b) => (b.priority || 0) - (a.priority || 0));

  const selected = matches[0];

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
// 🧩 EMPTY
// =========================
function emptyResult(){
  return {
    text: null,
    assets: [],
    config: null
  };
}

// =========================
// 🔥 ENRICH (MINIMAL FIX)
// =========================
function enrichEvent(event){

  if(!event) return event;

  const players =
    (window.playerPool && window.playerPool.length)
      ? window.playerPool
      : (game.players || []);

  const teams = game.teams || [];

  const player = players.find(p =>
    String(p.id) === String(event.playerId)
  ) || null;

  const team = teams.find(t =>
    String(t.id) === String(event.teamId)
  ) || null;

  if(event.playerId && !player){
    console.warn("❌ PLAYER NOT FOUND:", event.playerId);
  }

  return {
    ...event,
    player,
    team
  };
}


// =========================
// 📦 EXPORTS (FIX)
// =========================
export {
  resolveEventContent,
  enrichEvent
};

// optional (für Debug / Legacy Zugriff)
window.resolveEventContent = resolveEventContent;
window.enrichEvent = enrichEvent;
