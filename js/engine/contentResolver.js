// =========================
// 🧠 CONTENT RESOLVER (FINAL FIXED)
// =========================

import { game } from "../core/state.js";

// =========================
// 🔤 NORMALIZE
// =========================
function normalize(val){
  return String(val || "").toLowerCase().trim();
}

// =========================
// 👤 PLAYER LOOKUP (FIXED)
// =========================
function findPlayerById(id){

  if(!id) return null;

  const league = game.league?.current;
  if(!league) return null;

  for(const team of league.teams || []){
    const player = team.players?.find(
      p => String(p.id) === String(id)
    );
    if(player) return player;
  }

  return null;
}

function getPlayerNameById(id){

  const player = findPlayerById(id);

  if(!player){
    console.warn("❌ Player not found:", id);
    return "ein Spieler";
  }

  return player.name || player.Name || "ein Spieler";
}

// =========================
// 🏆 TEAM LOOKUP (FIXED)
// =========================
function findTeamById(id){

  if(!id) return null;

  return game.league?.current?.teams?.find(
    t => String(t.id) === String(id)
  ) || null;
}

function getTeamNameById(id){

  const team = findTeamById(id);

  return team?.name || "ein Team";
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
// 🎯 MAIN RESOLVER
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
// 🔥 ENRICH EVENT (FINAL FIX)
// =========================
function enrichEvent(event){

  if(!event) return event;

  const player = findPlayerById(event.playerId);
  const related = findPlayerById(event.relatedPlayerId);
  const team = findTeamById(event.teamId);

  if(event.playerId && !player){
    console.warn("❌ PLAYER NOT FOUND:", event.playerId);
  }

  return {
    ...event,

    // 👉 echte Objekte
    player,
    relatedPlayer: related,
    team,

    // 👉 direkt usable strings (für commentary)
    playerName: player?.name || player?.Name || "ein Spieler",
    relatedPlayerName: related?.name || related?.Name || null,
    teamName: team?.name || "ein Team"
  };
}

// =========================
// 📦 EXPORTS
// =========================
export {
  resolveEventContent,
  enrichEvent
};

// optional debug
window.resolveEventContent = resolveEventContent;
window.enrichEvent = enrichEvent;
