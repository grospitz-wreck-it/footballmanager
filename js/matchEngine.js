// =========================
// ⚽ MATCH ENGINE (STRICT ID ONLY - FINAL)
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
// 🧠 ID HELPERS
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

  const leagueTeams = game.league?.current?.teams || [];

  const leagueMatch = leagueTeams.find(
    t => normalizeId(t.id) === nid
  );

  if(leagueMatch){
    return leagueMatch;
  }

  // 🔥 bleibt erhalten (kein Name-Fallback!)
  return (game.data?.teams || []).find(
    t => normalizeId(t.id) === nid
  );
}

function getTeamNameById(id){
  return getTeamById(id)?.name || "Unbekannt";
}

// =========================
// 🆕 EVENT EMITTER
// =========================
function emitMatchEvent(type, payload = {}) {

  const live = game.match?.live;
  if (!live) return;

  const event = {
    id: crypto.randomUUID(),
    type: type || "UNKNOWN_EVENT",
    minute: live.minute ?? 0,

    // 🔥 PAYLOAD zuerst
    ...payload,

    // 🔥 SAFETY: TEXT fallback (payload darf NICHT überschrieben werden)
    text: payload?.text ?? payload?.title ?? null,

    // 🔥 ASSETS sauber absichern (kein undefined / kein Müll)
    assets: Array.isArray(payload?.assets) ? payload.assets : []
  };

  emit(EVENTS.MATCH_EVENT, event);
}

// =========================
// 🎮 GAME EVENT EFFECT HANDLER
// =========================
function applyGameEventEffect(event, ctx){

  if(!event) return;

  // 🔥 GOAL EFFECT
  if(event.effect === "goal"){

    const isHome = Math.random() < 0.5;
    const teamId = isHome
      ? ctx.match.homeTeamId
      : ctx.match.awayTeamId;

    const player = getRandomPlayer(teamId);

    // 🔥 SCORE UPDATE
    if(isHome){
      game.match.live.score.home++;
      game.match.score.home++;
    } else {
      game.match.live.score.away++;
      game.match.score.away++;
    }

    // 🔥 TEXT + ASSETS aus Admin übernehmen
    emitMatchEvent(EVENT_TYPES.GOAL, {
      teamId,
      playerId: player?.id,
      outcome: EVENT_OUTCOMES.SUCCESS,

      // 👉 Text kommt jetzt aus deinem Admin Event
      text: event.title || "⚽ Tor!",

      // 👉 WEBP / Images
      assets: event.assets || [],

      // 👉 optional für später
      eventId: event.id,
      eventType: event.type
    });
  }
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
    normalizeId(game.team?.selectedId) ||
    normalizeId(game.team?.id);

  if(!myTeamId) return true;

  return (
    normalizeId(match.homeTeamId) === myTeamId ||
    normalizeId(match.awayTeamId) === myTeamId
  );
}

// =========================
// 🎮 INIT MATCH (STRICT ID)
// =========================
function initMatch(round){
  // 🔥 RESET MATCH LOOP
if(matchInterval){
  clearInterval(matchInterval);
  matchInterval = null;
}
  if(!round?.length) return false;

const playerMatch = round.find(m => isMyMatch(m));

if(!playerMatch){
  console.error("❌ Kein Match für dein Team gefunden!", round);
  return false;
}

  const homeId = normalizeId(playerMatch.homeTeamId);
  const awayId = normalizeId(playerMatch.awayTeamId);

  // 🔥 STRICT: KEIN FALLBACK MEHR
  if(!homeId || !awayId){
    console.error("❌ MATCH INIT FAILED (STRICT ID)", playerMatch);
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
// ⚽ EVENTS
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

    emitMatchEvent(EVENT_TYPES.GOAL, {
      teamId,
      playerId: shooter?.id,
      relatedPlayerId: getRandomPlayer(teamId)?.id,
      outcome: EVENT_OUTCOMES.SUCCESS
    });

    return;
  }

  if(r < goalChance + saveChance){
    emitMatchEvent(EVENT_TYPES.SHOT_SAVED, {
      teamId: opponentId,
      playerId: keeper?.id,
      outcome: EVENT_OUTCOMES.SAVED
    });
    return;
  }

  emitMatchEvent(EVENT_TYPES.SHOT, {
    teamId,
    playerId: shooter?.id,
    outcome: EVENT_OUTCOMES.FAIL
  });
}

function createFoul(ctx){
  const teamId = Math.random() < 0.5
    ? ctx.match.homeTeamId
    : ctx.match.awayTeamId;

  const player = getRandomPlayer(teamId);

  emitMatchEvent(EVENT_TYPES.FOUL, {
    teamId,
    playerId: player?.id,
    outcome: EVENT_OUTCOMES.NEUTRAL
  });
}

function createCorner(ctx){
  const teamId = Math.random() < 0.5
    ? ctx.match.homeTeamId
    : ctx.match.awayTeamId;

  emitMatchEvent(EVENT_TYPES.CORNER, { teamId });
}

function createDuel(ctx){

  const p1 = getRandomPlayer(ctx.match.homeTeamId);
  const p2 = getRandomPlayer(ctx.match.awayTeamId);

  emitMatchEvent(EVENT_TYPES.DUEL, {
    playerId: p1?.id,
    relatedPlayerId: p2?.id
  });
}

// =========================
// 🔁 SIMULATION
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
// ▶️ CONTROL
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
// 🤖 OTHER MATCHES
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
// 🔁 LOOP
// =========================
function runMatchLoop({ onTick, onEnd } = {}){

  if(matchInterval) return;

  let lastTime = performance.now();
  let accumulator = 0;
  const STEP = 1500;

  matchInterval = setInterval(() => {

    // ✅ LIVE ZUERST HOLEN
    const live = game.match?.live;
    if(!live) return;

    // ✅ DEBUG (jetzt safe)
    console.log("⏱", {
      minute: live.minute,
      running: live.running,
      phase: live.phase
    });

    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    accumulator += delta;

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

      // =========================
      // 🎮 GAME EVENTS

      // =========================
// 🎮 GAME EVENTS TRIGGER
// =========================
const gameEvents = game.data?.gameEvents;

if(Array.isArray(gameEvents)){
  gameEvents.forEach(ev => {

    if(!ev.active) return;

    if(ev.trigger === "always"){
      if(live.minute % 5 === 0){
        applyGameEventEffect(ev, ctx);
      }
    }

    if(ev._lastTrigger === undefined){
      ev._lastTrigger = -999;
    }

    if(ev.trigger === "random"){
      if(
        live.minute - ev._lastTrigger > 1 &&
        Math.random() < (ev.probability || 0)
      ){
        ev._lastTrigger = live.minute;
        applyGameEventEffect(ev, ctx);
      }
    }

  });
}
      
     if(live.minute === 45 && live.phase === "first_half"){
  live.phase = "halftime";
  live.running = false;

  setTimeout(() => {
    live.running = true;
    live.phase = "second_half";
  }, 1000); // optional länger

  saveGame();
}

      if(live.minute >= 90){

  live.running = false; // 🔥 DAS FEHLT NOCH

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
// 🏁 END
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
