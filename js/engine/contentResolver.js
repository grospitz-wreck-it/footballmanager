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
// 🧠 EVENTS SOURCE (FIX!!!)
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
export function resolveEventContent(event){

  if(!event){
    console.warn("⚠️ resolveEventContent: no event");
    return emptyResult();
  }

  const definitions = getEventDefinitions();
  const type = normalize(event.type);

  // 🔥 DEBUG
  console.log("🧠 RESOLVER INPUT:", {
    type,
    definitions: definitions.length
  });

  if(!definitions.length){
    console.warn("⚠️ No events loaded");
    return emptyResult();
  }

  // =========================
  // 🔍 MATCH
  // =========================
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

  // =========================
  // 🔥 PRIORITY
  // =========================
  matches.sort((a,b) => (b.priority || 0) - (a.priority || 0));

  const selected = matches[0];

  // =========================
  // 🖼 ASSETS
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
// 🔥 ENRICH (FIXED)
// =========================
export function enrichEvent(event){

  if(!event) return event;

  // =========================
  // 🧠 PLAYER POOL (SOURCE OF TRUTH)
  // =========================
  const players =
    (window.playerPool && window.playerPool.length)
      ? window.playerPool
      : (game.players || []);

  const teams = game.teams || [];

  // =========================
  // 🔍 STRICT ID RESOLVE
  // =========================
  export function resolveEventContent(event){

  if(!event) return null;

  const player = event.player;
  const team   = event.team;

  const playerName =
    player?.name ||
    `${player?.first_name || ""} ${player?.last_name || ""}`.trim() ||
    "Unbekannt";

  const teamName =
    team?.name ||
    "Team";

  // =========================
  // 🎯 EVENT TYPES
  // =========================
  switch(event.type){

    case "goal":
      return {
        text: `⚽ ${playerName} trifft für ${teamName}!`,
        assets: [{ url: "/assets/events/goal.webp" }]
      };

    case "shot":
      return {
        text: `🎯 ${playerName} kommt zum Abschluss`,
      };

    case "foul":
      return {
        text: `🟥 Foul von ${playerName}`,
      };

    case "pass":
      return {
        text: `➡️ Pass von ${playerName}`,
      };

    case "save":
      return {
        text: `🧤 Parade von ${playerName}`,
      };

    default:
      return {
        text: event.text || "Spielaktion",
      };
  }
}
