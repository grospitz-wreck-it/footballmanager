
// =========================
// ⚽ MATCH ENGINE (FINAL FIXED IMPORTS)
// =========================

import { game } from "./core/state.js";
import { emit } from "./core/events.js";
import { EVENTS, EVENT_TYPES, EVENT_OUTCOMES } from "./core/events.constants.js";
import { RULES } from "./core/rules.js";

import {
  updateEvents,
  rollRandomEvents
} from "./engine/eventSystem.js";

import { saveGame } from "./services/storage.js"; // 🔥 FIXED

import { getPositionWeights } from "./engine/positionEngine.js";
import { getPlayerRating } from "./engine/playerEngine.js";
import { getTacticModifier } from "./engine/tacticsEngine.js";

import {
  simulateMatchday,
  updateTable,
  simulateLiveMatchMinute
} from "./modules/scheduler.js";


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

function getEventWeights(ctx, mod, attackingTeam){

  const intensity = RULES?.match?.intensity ?? 1;

  const homeId = ctx.match.homeTeamId;
  const awayId = ctx.match.awayTeamId;

  const isHomeAttack = attackingTeam === homeId;

  const homeStrength = getTeamStrength(homeId);
  const awayStrength = getTeamStrength(awayId);

  const strengthDiff =
    (homeStrength - awayStrength) / 100;

  const attackStrength = isHomeAttack
    ? strengthDiff
    : -strengthDiff;

  // =========================
  // ⚙️ BASE WEIGHTS
  // =========================
  let weights = {
    shot: 0.25,
    foul: 0.20,
    corner: 0.15,
    duel: 0.40
  };

  // =========================
  // 🔥 TACTICS INFLUENCE
  // =========================
  weights.shot   += mod.attackBias * 0.5;
  weights.duel   += mod.attackBias * 0.3;

  weights.foul   += mod.controlBonus * 0.4;
  weights.corner += mod.eventRate * 0.2;

  // =========================
  // 💪 STRENGTH INFLUENCE
  // =========================
  weights.shot += attackStrength * 0.3;
  weights.duel -= attackStrength * 0.2;

  // =========================
  // ⚡ MOMENTUM
  // =========================
  weights.shot += momentum * 0.2;
  weights.foul += Math.abs(momentum) * 0.1;

  // =========================
  // 🔁 EVENT CHAINS (NEU)
  // =========================
  const last = game.match?.live?.lastEvent;

  if(last === "duel"){
    weights.shot += 0.1;
  }

  if(last === "corner"){
    weights.shot += 0.2;
  }

  if(last === "shot"){
    weights.duel += 0.2;
  }

  // =========================
  // 🔒 SAFETY (kein negativer Müll)
  // =========================
  Object.keys(weights).forEach(k => {
    weights[k] = Math.max(0.01, weights[k]);
  });

  // =========================
  // 🔄 NORMALIZE (wichtig!)
  // =========================
  const total = Object.values(weights).reduce((a,b)=>a+b,0);

  Object.keys(weights).forEach(k => {
    weights[k] = weights[k] / total;
  });

  return weights;
}

function switchPossession(ctx){
  const live = game.match?.live;
  if(!live) return;

  const home = ctx.match.homeTeamId;
  const away = ctx.match.awayTeamId;

  live.possession =
    live.possession === home ? away : home;
}
  

function pickEventByWeight(weights){

  const r = Math.random();
  let sum = 0;

  for(const key in weights){
    sum += weights[key];
    if(r < sum) return key;
  }

  return "duel";
}
// =========================
// 🆕 EVENT EMITTER
// =========================
function emitMatchEvent(type, payload = {}) {

  const live = game.match?.live;
  const match = game.match?.current;

  if (!live || !match) return;

  const teamId = payload.teamId;

  // 🔥 TEAM NAME RESOLVE (ZENTRAL!)
  let teamName = null;

  if(teamId){
    const isHome = String(teamId) === String(match.homeTeamId);

    teamName = isHome
      ? match.home?.name
      : match.away?.name;
  }

  // 🔥 PLAYER NAME RESOLVE
  let playerName = null;

  if(payload.playerId){
 const pool = game.players || [];
    const player = pool.find(p =>
      String(p.id) === String(payload.playerId)
    );

    playerName = player?.name || null;
  }

  const event = {
    id: crypto.randomUUID(),
    type: type || "UNKNOWN_EVENT",
    minute: live.minute ?? 0,

    // 🔥 ENRICHED DATA
    ...payload,
    teamName,
    playerName
  };

  console.log("📡 FINAL EVENT:", event);

  emit(EVENTS.MATCH_EVENT, event);
}
// =========================
// 🎮 GAME EVENT EFFECT HANDLER
// =========================
function applyGameEventEffect(event, ctx){

  if(!event) return;

  const type = String(event.type || event.effect || "").toLowerCase();

  // =========================
  // ⚽ GOAL EVENT
  // =========================
  if(type === "goal"){

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


    // 🔥 FINAL EMIT
   emitMatchEvent(EVENT_TYPES.GOAL, {
  teamId,
  playerId: player?.id,
  relatedPlayerId: getRandomPlayer(teamId)?.id,
  outcome: EVENT_OUTCOMES.SUCCESS
});
  }
}
// =========================
// 👥 PLAYER ACCESS
// =========================
function getPlayersOfTeam(teamId){

  const nid = normalizeId(teamId);

  const team = game.league?.current?.teams.find(t =>
    normalizeId(t.id) === nid
  );

  const players = team?.players || [];

  console.log("🔍 TEAM ID:", nid);
  console.log("👥 TEAM PLAYERS:", players.length);

  return players;
}

function autoFillLineup(teamId){

  if(!game.team.lineup){
    game.team.lineup = { formation: "4-4-2", slots: {} };
  }

  if(!game.team.lineup.slots){
    game.team.lineup.slots = {};
  }

  const nid = normalizeId(teamId);
  const myTeamId =
    normalizeId(game.team?.selectedId) ||
    normalizeId(game.team?.id);

  if(nid !== myTeamId) return;

  const pool = getPlayersOfTeam(teamId);
  if(!pool.length) return;

  const lineup = game.team.lineup;

  const byPos = {
    GK: [],
    DEF: [],
    MID: [],
    ST: []
  };

  pool.forEach(p => {
    const pos = (p.position_type || "").toUpperCase();

    if(pos.includes("GK")) byPos.GK.push(p);
    else if(pos.includes("DEF")) byPos.DEF.push(p);
    else if(pos.includes("MID")) byPos.MID.push(p);
    else if(pos.includes("ST")) byPos.ST.push(p);
  });

  function pick(arr){
    return arr.shift()?.id || null;
  }

  Object.keys(lineup.slots).forEach(slot => {

    if(lineup.slots[slot]) return; // schon gesetzt

    if(slot === "GK") lineup.slots[slot] = pick(byPos.GK);

    else if(slot.startsWith("DEF")) lineup.slots[slot] = pick(byPos.DEF);

    else if(slot.startsWith("MID")) lineup.slots[slot] = pick(byPos.MID);

    else if(slot.startsWith("ST")) lineup.slots[slot] = pick(byPos.ST);
  });
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

  // 🔥 FIX: game.match absichern
  if(!game.match){
    game.match = {};
  }

  // 🔥 RESET MATCH LOOP
  if(matchInterval){
    clearInterval(matchInterval);
    matchInterval = null;
  }

  // ❗ Erst prüfen
  if(!round?.length) return false;


  // =========================
  // 🧠 DANACH dein Spiel suchen
  // =========================
  const playerMatch = round.find(m => isMyMatch(m));

// =========================
// ⚽ BYE HANDLING (FIX)
// =========================
if(!playerMatch){
  console.warn("⚽ BYE: Team hat spielfrei", round);

  // 🔥 Match-State sauber setzen (wichtig!)
  game.match._scheduleRef = null;

  game.match.current = null;

  game.match.live = {
    minute: 0,
    running: false,
    score: { home: 0, away: 0 },
    events: [],
    phase: "bye"
  };

  game.match.home = null;
  game.match.away = null;

  game.match.score = {
    home: 0,
    away: 0
  };

  return {
    isBye: true
  };
}

// =========================
// ⚽ NORMAL MATCH
// =========================
const homeId = normalizeId(playerMatch.homeTeamId);
const awayId = normalizeId(playerMatch.awayTeamId);

// 🔥 STRICT: KEIN FALLBACK MEHR
if(!homeId || !awayId){
  console.error("❌ MATCH INIT FAILED (STRICT ID)", playerMatch);
  return false;
}

game.match._scheduleRef = playerMatch;

game.match.current = {
  id: playerMatch.id,

  homeTeamId: homeId,
  awayTeamId: awayId,

  home: playerMatch.home,
  away: playerMatch.away,

  result: null
};

try {

  autoFillLineup(homeId);
  autoFillLineup(awayId);

  function getPlayersFromLineup(teamId){

  const nid = normalizeId(teamId);

  const myTeamId =
    normalizeId(game.team?.selectedId) ||
    normalizeId(game.team?.id);

  // 👉 Gegner-Team
  if(nid !== myTeamId){
    return getPlayersOfTeam(teamId);
  }

  const slots = game.team?.lineup?.slots || {};
  const ids = Object.values(slots).filter(Boolean);

  // 👉 kein Lineup gesetzt → alle Spieler
  if(!ids.length){
    return getPlayersOfTeam(teamId);
  }

  // 🔥 HIER IST FIX 3
  const pool = game.players || [];

  return pool.filter(p =>
    ids.includes(normalizeId(p.id))
  );
}

  game.match.current.homePlayers = getPlayersFromLineup(homeId);
  game.match.current.awayPlayers = getPlayersFromLineup(awayId);

} catch(e){
  console.warn("⚠️ Player init failed", e);
}

  game.match.live = {
  minute: 0,
  running: true,
  score: { home: 0, away: 0 },
  events: [],
  phase: "first_half",

  // 🔥 NEU
  possession: Math.random() < 0.5
    ? playerMatch.homeTeamId
    : playerMatch.awayTeamId,

  lastEvent: null
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

  const nid = normalizeId(teamId);

  const myTeamId =
    normalizeId(game.team?.selectedId) ||
    normalizeId(game.team?.id);

  let players;

  // 🔥 nur dein Team nutzt Lineup
  if(nid === myTeamId){

    // 🔥 HIER IST DER FIX
    autoFillLineup(teamId);

    const slots = game.team?.lineup?.slots || {};
    const ids = Object.values(slots).filter(Boolean);

    if(ids.length){

 const pool = game.players || [];
      
      players = pool.filter(p =>
        ids.includes(normalizeId(p.id))
      );

    } else {
      players = getPlayersOfTeam(teamId);
    }

  } else {
    players = getPlayersOfTeam(teamId);
  }

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

  // =========================
  // ⚙️ TACTICS
  // =========================
  const mod = getTacticModifier();

  // =========================
  // 🎯 ATTACKING TEAM
  // =========================
  const bias = mod.attackBias;

  let attackingTeam = game.match?.live?.possession;

// fallback
if (!attackingTeam) {
  attackingTeam =
    Math.random() < (adjustedHomeChance + bias)
      ? homeId
      : awayId;
}

  // =========================
  // 🔥 HIGH LINE RISIKO
  // =========================
  if (mod.line > 1 && Math.random() < 0.15) {
    attackingTeam = attackingTeam === homeId ? awayId : homeId;
  }

  // =========================
  // ⚙️ EVENT SYSTEM
  // =========================
  const weights = getEventWeights(ctx, mod, attackingTeam);
  const eventType = pickEventByWeight(weights);

  // =========================
  // 🎮 EXECUTE
  // =========================
  switch (eventType) {

    case "shot":
      createShot({ match: ctx.match, teamId: attackingTeam });
      break;

    case "foul":
      createFoul(ctx);
      break;

    case "corner":
      createCorner(ctx);
      break;

    case "duel":
    default:
      createDuel(ctx);
      break;
  }

  // =========================
  // 🔁 POSSESSION FLOW
  // =========================
  const live = game.match?.live;

  if (live) {

    live.lastEvent = eventType;

    if (eventType === "shot") {
      switchPossession(ctx);
    }
    else if (eventType === "duel") {
      if (Math.random() < 0.5) {
        switchPossession(ctx);
      }
    }

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
// 🔁 LOOP
// =========================
function runMatchLoop({ onTick, onEnd } = {}){

  if(matchInterval) return;

  let lastTime = performance.now();
  let accumulator = 0;
  const STEP = 1000;

  matchInterval = setInterval(() => {

    const live = game.match?.live;
    const currentMatch = game.match?.current;

    if(!live || !currentMatch) return;
    if(live.phase === "bye") return;
    if(live.running === false) return;

    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    accumulator += delta;

    let safety = 0;

    while(accumulator >= STEP && safety < 10){

  live.minute++;

  // =========================
  // ⚡ ANDERE MATCHES LIVE
  // =========================
  const league = game.league?.current;
  const round = league?.schedule?.[league.currentRound];

  simulateLiveMatchMinute(round, live.minute);

  const ctx = {
    match: currentMatch,
    requestGoal: (data = {}) => {
      game.match.flags = game.match.flags || {};
      game.match.flags.goalRequested = true;
      game.match.flags.goalData = data;
    }
  };

      try {
        rollRandomEvents(ctx);
        simulateLiveEvent(ctx);
        updateEvents();
      } catch(e){
        console.warn("⚠️ Simulation error", e);
      }

const gameEvents = game.data?.gameEvents;
      
      if(Array.isArray(gameEvents)){
        gameEvents.forEach(ev => {

    if(ev.active === false) return;
          
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
          if(game.match?.live){
            game.match.live.running = true;
            game.match.live.phase = "second_half";
          }
        }, 1000);

        saveGame();
      }

      if(live.minute >= 90){

  live.running = false;

  // =========================
  // 🔥 TABLE UPDATE (DEIN MATCH)
  // =========================
  const league = game.league?.current;
  const match = game.match?.current;

  if(league && match){

    const home = league.teams.find(t => String(t.id) === match.homeTeamId);
    const away = league.teams.find(t => String(t.id) === match.awayTeamId);

    const hg = game.match.score.home;
    const ag = game.match.score.away;

    updateTable(home, away, hg, ag);
  }

  clearInterval(matchInterval);
  matchInterval = null;

  onEnd?.();
  return;
}

      accumulator -= STEP;
      safety++;
    }

    onTick?.();

  }, 50);
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initMatch,
  runMatchLoop,
  pauseMatch,
  resumeMatch,
  
};
