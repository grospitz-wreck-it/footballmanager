// =========================
// 📦 IMPORTS
// =========================
import { game } from "./state.js";
import { on, emit } from "./events.js";
import { EVENTS } from "./events.constants.js";
import { resolveEventContent } from "../engine/contentResolver.js";
import { generateText as generateCommentary } from "../engine/commentaryEngine.js";

// =========================
// 🧠 HELPERS
// =========================

function enrichMeta(event) {
  return {
    priority: event.meta?.priority ?? getPriority(event.type),
    ...event.meta
  };
}

function getPriority(type) {
  switch(type){
    case "GOAL": return 100;
    case "PENALTY_GOAL": return 110;
    case "RED_CARD": return 95;
    case "INJURY": return 80;
    case "HALFTIME": return 60;
    case "FULLTIME": return 70;
    default: return 10;
  }
}

// =========================
// 🧠 🔥 LOOKUP FIX
// =========================

function findPlayer(players, id){
  if(!id) return null;

  return players.find(p =>
    p?.id == id ||
    p?.Id == id ||
    p?.player_id == id ||
    p?.ID == id
  );
}

function findTeam(teams, id){
  if(!id) return null;

  return teams.find(t =>
    t?.id == id ||
    t?.Id == id ||
    t?.team_id == id
  );
}

// =========================
// 🧠 🔥 NAME FIX (DER WICHTIGE TEIL)
// =========================

function buildPlayerName(player){

  if(!player) return "ein Spieler";

  return (
    player.name ||
    `${player.firstName || player.first_name || ""} ${player.lastName || player.last_name || ""}`.trim() ||
    "ein Spieler"
  );
}

// =========================
// 🔥 OLD Commentary Generator
// =========================
function generateText(event) {

  const players = game.players || [];
  const teams = game.data?.teams || [];

  const player = findPlayer(players, event?.playerId);
  const team = findTeam(teams, event?.teamId);

  const playerName = buildPlayerName(player);

  const teamName = team?.name || "Ein Team";

  switch(event?.type){

    case "GOAL":
      return `⚽ ${playerName} trifft für ${teamName}!`;

    case "SHOT":
      return `🎯 ${playerName} schießt für ${teamName}`;

    case "SHOT_SAVED":
      return `🧤 Parade von ${playerName}!`;

    case "FOUL":
      return `🚫 Foul von ${playerName} (${teamName})`;

    case "CORNER":
      return `📐 Ecke für ${teamName}`;

    case "DUEL":
      return `⚔️ Zweikampf im Mittelfeld`;

    default:
      return `${teamName} im Angriff...`;
  }
}

// 🔥 ID Generator
function ensureId(event){
  return event?.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}

// =========================
// 🧠 CORE STORE LOGIC
// =========================

on(EVENTS.GAME_EVENT, (event) => {

  if(!event) return;

  if(!game.events){
    game.events = { history: [] };
  }

  if(!game.events.history){
    game.events.history = [];
  }

  const players = game.players || [];
  const teams = game.data?.teams || [];

  const player = findPlayer(players, event.playerId);
  const relatedPlayer = findPlayer(players, event.relatedPlayerId);
  const team = findTeam(teams, event.teamId);

  const playerName = buildPlayerName(player);
  const relatedPlayerName = relatedPlayer ? buildPlayerName(relatedPlayer) : null;

  const teamName =
    team?.name ||
    team?.Name ||
    "ein Team";

  const enrichedInput = {
    ...event,
    playerName,
    relatedPlayerName,
    teamName
  };

  let text = null;

  try {
    text = generateCommentary(enrichedInput);
  } catch(e){
    console.error("❌ Commentary Engine Crash:", e);
  }

  const enrichedEvent = {
    ...enrichedInput,

    // 🔥 FIX: Assets übernehmen
    assets: Array.isArray(event.assets) ? event.assets : [],

    id: ensureId(event),
    text: text || generateText(event),
    meta: enrichMeta(event)
  };

  console.log("🎮 FINAL GAME EVENT:", enrichedEvent);

  game.events.history.push(enrichedEvent);

  emit(EVENTS.STATE_CHANGED, game.events.history);
});


// =========================
// 💰 AD EVENTS HOOK
// =========================

on(EVENTS.AD_REWARD, (ad) => {

  if(!ad) return;

  if(ad.reward?.type === "money"){
    if(!game.team) game.team = {};
    game.team.money = (game.team.money || 0) + ad.reward.value;
  }

  if(ad.reward?.type === "boost"){
    game.team.boost = true;
  }

  emit(EVENTS.STATE_CHANGED, game);
});

// =========================
// 🧪 DEBUG LOGGING
// =========================

on(EVENTS.MATCH_EVENT, (event) => {
  console.log("📥 EventStore received MATCH_EVENT:", event);
});

on(EVENTS.GAME_EVENT, (event) => {
  console.log("🎮 Game Event received:", event);
});

on(EVENTS.AD_REWARD, (ad) => {
  console.log("💰 Ad Reward applied:", ad);
});
