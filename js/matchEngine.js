// =========================
// ⚽ MATCH ENGINE (ID BASED - FINAL + PRIO1) - STRICT NO LOSS
// =========================

import { game } from "./core/state.js";
import { emit } from "./core/events.js";
import { EVENTS, EVENT_TYPES, EVENT_OUTCOMES } from "./core/events.constants.js";
import { RULES } from "./core/rules.js";

import {
  updateEvents,
  rollRandomEvents
} from "./engine/eventSystem.js";

import { saveGame } from "../js/services/storage.js";
import { getPositionWeights } from "./engine/positionEngine.js";
import { getPlayerRating } from "./engine/playerEngine.js";

// =========================
// 🧠 INTERNAL
// =========================
let matchInterval = null;

// =========================
// 🧠 ID HELPERS (ADD ONLY)
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

// =========================
// 🧠 HELPERS
// =========================
function getTeamById(id){
  const nid = normalizeId(id);
  return (game.data?.teams || []).find(t => normalizeId(t.id) === nid);
}

function getTeamNameById(id){
  return getTeamById(id)?.name || "Unbekannt";
}

function getPlayerName(p){
  if(!p) return "Unbekannt";

  return (
    p.Name ||
    p.name ||
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    "Spieler"
  );
}

// =========================
// 🆕 EVENT EMITTER (UNVERÄNDERT)
// =========================
function emitMatchEvent(type, payload = {}) {
const live = game.match?.live;
if (!live) return;

// 🔒 payload absichern (kein Crash bei undefined)
const safePayload = payload || {};

// 🔒 fallback type (failsafe)
const safeType = type || "UNKNOWN_EVENT";

const event = {
  id: crypto.randomUUID(),
  type: safeType,
  minute: live.minute ?? 0,
  ...safePayload,
  text: safePayload.text ?? null
};

// 🔥 Debug bleibt, aber stabiler
if (process?.env?.NODE_ENV !== "production") {
  console.log("📡 Event:", event);
}

emit(EVENTS.MATCH_EVENT, event);
}
// =========================
// 👥 PLAYER ACCESS
// =========================
function getPlayersOfTeam(teamId){

  const nid = normalizeId(teamId);
  const pool = window.playerPool || [];

  return pool.filter(p => normalizeId(p.team_id) === nid);
}

function getRandomPlayer(teamId){

  const nid = normalizeId(teamId);
  const current = game.match?.current;

  if(current){

    if(normalizeId(current.homeTeamId) === nid && current.homePlayers?.length){
      return current.homePlayers[Math.floor(Math.random() * current.homePlayers.length)];
    }

    if(normalizeId(current.awayTeamId) === nid && current.awayPlayers?.length){
      return current.awayPlayers[Math.floor(Math.random() * current.awayPlayers.length)];
    }
  }

  const list = getPlayersOfTeam(nid);

  if(!list.length){
    console.warn("⚠️ Keine Spieler für Team-ID:", nid);
    return null;
  }

  return list[Math.floor(Math.random() * list.length)];
}

// =========================
// 🧠 MATCH CHECK
// =========================
function isMyMatch(match){

  const myTeamId =
    normalizeId(game.team?.id) ||
    normalizeId(game.team?.selectedId);

  if(!myTeamId) return true;

  return (
    normalizeId(match.homeTeamId) === myTeamId ||
    normalizeId(match.awayTeamId) === myTeamId
  );
}

// =========================
// 🎮 INIT MATCH (FIXED MINIMAL)
// =========================
function initMatch(round){

  if(!round?.length) return false;

  const playerMatch = round.find(m => isMyMatch(m)) || round[0];
  if(!playerMatch) return false;

  // 🔥 MINIMAL FIX: fallback wenn IDs fehlen
  let homeId = normalizeId(playerMatch.homeTeamId);
  let awayId = normalizeId(playerMatch.awayTeamId);

  if(!homeId && playerMatch.home){
    const t = (game.data?.teams || []).find(
      t => t.name === (playerMatch.home.name || playerMatch.home)
    );
    homeId = normalizeId(t?.id);
  }

  if(!awayId && playerMatch.away){
    const t = (game.data?.teams || []).find(
      t => t.name === (playerMatch.away.name || playerMatch.away)
    );
    awayId = normalizeId(t?.id);
  }

  if(!homeId || !awayId){
    console.error("❌ MATCH INIT FAILED (IDs fehlen)", playerMatch);
    return false;
  }

  game.match._scheduleRef = playerMatch;

  game.match.current = {
    id: playerMatch.id || crypto.randomUUID(),
    homeTeamId: homeId,
    awayTeamId: awayId,
    homeName: getTeamNameById(homeId),
    awayName: getTeamNameById(awayId),
    result: null
  };

  try {
    game.match.current.homePlayers = getPlayersOfTeam(homeId);
    game.match.current.awayPlayers = getPlayersOfTeam(awayId);
  } catch(e){
    console.warn("⚠️ Player init failed", e);
  }

  game.match.live = {
    minute: 0,
    running: true,
    score: { home: 0, away: 0 },
    events: [],
    phase: "first_half"
  };

  game.match.home = {
    id: homeId,
    name: getTeamNameById(homeId)
  };

  game.match.away = {
    id: awayId,
    name: getTeamNameById(awayId)
  };

  game.match.score = {
    home: 0,
    away: 0
  };

  console.log("✅ MATCH INIT:", {
    home: game.match.home,
    away: game.match.away
  });

  return true;
}

// =========================
// ⚽ EVENTS (UNVERÄNDERT)
// =========================
function createShot(ctx){

  const isHome = Math.random() < 0.5;

  const teamId = isHome ? ctx.match.homeTeamId : ctx.match.awayTeamId;
  const opponentId = isHome ? ctx.match.awayTeamId : ctx.match.homeTeamId;

  const shooter = getRandomPlayer(teamId);
  const keeper = getRandomPlayer(opponentId);

  const w = getPositionWeights(shooter);
  if(Math.random() > w.shot) return;

  const r = Math.random();
  const goalChance = 0.2;
  const saveChance = 0.5;

  if(r < goalChance){

    if(isHome){
      game.match.live.score.home++;
      game.match.score.home++;
    } else {
      game.match.live.score.away++;
      game.match.score.away++;
    }

    emitMatchEvent(EVENT_TYPES.GOAL || "GOAL", {
      teamId,
      playerId: shooter?.id,
      relatedPlayerId: getRandomPlayer(teamId)?.id,
      outcome: EVENT_OUTCOMES?.SUCCESS || "success"
    });

    return;
  }

  if(r < goalChance + saveChance){
    emitMatchEvent(EVENT_TYPES.SHOT_SAVED || "SHOT_SAVED", {
      teamId: opponentId,
      playerId: keeper?.id,
      outcome: EVENT_OUTCOMES?.SAVED || "saved"
    });
    return;
  }

  emitMatchEvent(EVENT_TYPES.SHOT || "SHOT", {
    teamId,
    playerId: shooter?.id,
    outcome: EVENT_OUTCOMES?.FAIL || "fail"
  });
}

function createFoul(ctx){
  const teamId = Math.random() < 0.5
    ? ctx.match.homeTeamId
    : ctx.match.awayTeamId;

  const player = getRandomPlayer(teamId);

  emitMatchEvent(EVENT_TYPES.FOUL || "FOUL", {
    teamId,
    playerId: player?.id,
    outcome: EVENT_OUTCOMES?.NEUTRAL || "neutral"
  });
}

function createCorner(ctx){
  const teamId = Math.random() < 0.5
    ? ctx.match.homeTeamId
    : ctx.match.awayTeamId;

  emitMatchEvent(EVENT_TYPES.CORNER || "CORNER", {
    teamId
  });
}

function createDuel(ctx){

  const p1 = getRandomPlayer(ctx.match.homeTeamId);
  const p2 = getRandomPlayer(ctx.match.awayTeamId);

  emitMatchEvent(EVENT_TYPES.DUEL || "DUEL", {
    playerId: p1?.id,
    relatedPlayerId: p2?.id
  });
}

// =========================
// 🔁 SIMULATION (UNVERÄNDERT)
// =========================
let momentum = 0;

function updateMomentum(){
  momentum += (Math.random() - 0.5) * 0.2;
  momentum = Math.max(-1, Math.min(1, momentum));
}

function getTeamStrength(teamId){

  const players = getPlayersOfTeam(teamId);

  if(!players?.length) return 50;

  const avg =
    players.reduce((sum, p) => sum + getPlayerRating(p), 0) /
    players.length;

  return avg;
}

function simulateLiveEvent(ctx){

  updateMomentum();

  const intensity = RULES?.match?.intensity ?? 1;

  const homeId = ctx.match.homeTeamId;
  const awayId = ctx.match.awayTeamId;

  const homeStrength = getTeamStrength(homeId);
  const awayStrength = getTeamStrength(awayId);

  const total = homeStrength + awayStrength;

  const homeBias = homeStrength / total;
  const adjustedHomeChance = homeBias + momentum * 0.2;

  const r = Math.random();

  let attackingTeam =
    Math.random() < adjustedHomeChance
      ? homeId
      : awayId;

  const shotChance = 0.06 * intensity;
  const foulChance = 0.12;
  const cornerChance = 0.08;
  const duelChance = 0.15;

  if(r < shotChance){
    createShot({ match: ctx.match, teamId: attackingTeam });
  }
  else if(r < shotChance + foulChance){
    createFoul(ctx);
  }
  else if(r < shotChance + foulChance + cornerChance){
    createCorner(ctx);
  }
  else if(r < shotChance + foulChance + cornerChance + duelChance){
    createDuel(ctx);
  }
}

// =========================
// ▶️ CONTROL (UNVERÄNDERT)
// =========================
function pauseMatch(){
  if(game.match?.live){
    game.match.live.running = false;
  }
}

function resumeMatch(){
  if(game.match?.live){
    game.match.live.running = true;
  }
}

// =========================
// 🤖 OTHER MATCHES (UNVERÄNDERT)
// =========================
function simulateOtherMatches(round){

  round.forEach(match => {

    if(isMyMatch(match)) return;
    if(match._processed) return;

    match.result = {
      home: Math.floor(Math.random() * 5),
      away: Math.floor(Math.random() * 5)
    };

    match._processed = true;
  });
}

// =========================
// 🔁 LOOP (UNVERÄNDERT)
// =========================
function runMatchLoop({ onTick, onEnd } = {}){

  if(matchInterval) return;

  let lastTime = performance.now();
  let accumulator = 0;
  const STEP = 400;

  matchInterval = setInterval(() => {

    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    accumulator += delta;

    const live = game.match?.live;
    if(!live) return;

    let safety = 0;

    while(accumulator >= STEP && safety < 10){

      if(!live.running){
        break;
      }

      live.minute++;

      const ctx = { match: game.match.current };

      rollRandomEvents(ctx);
      simulateLiveEvent(ctx);
      updateEvents();

      if(live.minute === 45 && live.phase === "first_half"){
        live.phase = "halftime";
        live.running = false;
        saveGame();
      }

      if(live.minute >= 90){
        clearInterval(matchInterval);
        matchInterval = null;
        endMatch(onEnd);
        break;
      }

      accumulator -= STEP;
      safety++;
    }

    onTick?.();

  }, 50);
}

// =========================
// 🏁 END (UNVERÄNDERT)
// =========================
function endMatch(onEnd){

  const match = game.match?.current;
  const live = game.match?.live;

  if(!match || !live) return;

  const result = {
    home: live.score.home,
    away: live.score.away
  };

  match.result = result;
  match._processed = true;

  if(game.match._scheduleRef){
    game.match._scheduleRef.result = result;
    game.match._scheduleRef._processed = true;
  }

  emit(EVENTS.MATCH_FINISHED, { score: result });

  saveGame();
  onEnd?.();
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initMatch,
  runMatchLoop,
  pauseMatch,
  resumeMatch,
  simulateOtherMatches
};
