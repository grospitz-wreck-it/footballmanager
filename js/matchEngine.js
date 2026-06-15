// =========================
// ⚽ MATCH ENGINE (FINAL FIXED IMPORTS)
// =========================

import { game } from "./core/state.js";
import { emit } from "./core/events.js";
import {
  EVENTS,
  EVENT_TYPES,
  EVENT_OUTCOMES,
} from "./core/events.constants.js";
import { RULES } from "./core/rules.js";
import {
  addSuspension,
  addInjury,
  isPlayerAvailable,
} from "./modules/playerAvailability.js";
import { updateEvents, rollRandomEvents } from "./engine/eventSystem.js";
import { playIdleBroadcast } from "./ui/ui.js";
import { saveGame } from "./services/storage.js"; // 🔥 FIXED

import { getPositionWeights } from "./engine/positionEngine.js";
import { getPlayerRating } from "./engine/playerEngine.js";
import { resolveFoul } from "./engine/resolver.js";
import { getTacticModifier } from "./engine/tacticsEngine.js";

import {
  simulateMatchday,
  updateTable,
  simulateLiveMatchMinute,
} from "./modules/scheduler.js";

// =========================
// 🧠 INTERNAL
// =========================
let matchInterval = null;

function determineRedCardBan() {
  const r = Math.random();

  if (r < 0.15) return 1;
  if (r < 0.85) return 2;
  if (r < 0.95) return 3;
  if (r < 0.99) return 4;

  return 5;
}

function maybeTriggerInjury(teamId) {
  if (!teamId) return;

  // 🔥 Sehr selten
  if (Math.random() > 0.015) return;

  const player = getRandomPlayer(teamId);
  if (!player?.id) return;

  const r = Math.random();

  let matches = 1;
  let type = "minor";

  if (r < 0.75) {
    matches = 1;
    type = "minor";
  } else if (r < 0.9) {
    matches = 3;
    type = "medium";
  } else if (r < 0.98) {
    matches = 6;
    type = "serious";
  } else {
    matches = 12;
    type = "severe";
  }

  addInjury(player.id, matches, type);

  emitMatchEvent("INJURY", {
    teamId,
    playerId: player.id,
    injuryType: type,
    matchesOut: matches,
  });
}

// =========================
// 🧠 ID HELPERS
// =========================
function normalizeId(id) {
  if (id === null || id === undefined) return null;
  return String(id);
}

// =========================
// 🧠 HELPERS
// =========================

function getTeamById(id) {
  const nid = normalizeId(id);

  const leagueTeams = game.league?.current?.teams || [];

  const leagueMatch = leagueTeams.find((t) => normalizeId(t.id) === nid);

  if (leagueMatch) {
    return leagueMatch;
  }

  // 🔥 bleibt erhalten (kein Name-Fallback!)
  return (game.data?.teams || []).find((t) => normalizeId(t.id) === nid);
}

function getTeamNameById(id) {
  return getTeamById(id)?.name || "Unbekannt";
}

function getEventWeights(ctx, mod, attackingTeam) {
  const intensity = RULES?.match?.intensity ?? 1;

  const homeId = ctx.match.homeTeamId;
  const awayId = ctx.match.awayTeamId;

  const isHomeAttack = attackingTeam === homeId;

  const homeStrength = getTeamStrength(homeId);
  const awayStrength = getTeamStrength(awayId);

  const strengthDiff = (homeStrength - awayStrength) / 100;

  const attackStrength = isHomeAttack ? strengthDiff : -strengthDiff;

  // =========================
  // ⚙️ BASE WEIGHTS
  // =========================
  let weights = {
    shot: 0.42,
    foul: 0.15,
    corner: 0.1,
    duel: 0.25,
    pass: 0.15,
    dribble: 0.1,
    interception: 0.05,
  };

  // =========================
  // 🔥 TACTICS INFLUENCE
  // =========================
  weights.shot += mod.attackBias * 0.5;
  weights.duel += mod.attackBias * 0.3;

  weights.foul += mod.controlBonus * 0.4;
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

  if (last === "duel") {
    weights.shot += 0.1;
  }

  if (last === "corner") {
    weights.shot += 0.2;
  }

  if (last === "shot") {
    weights.duel += 0.2;
  }
  // 🔥 BALL FLOW LOGIK
  if (last === "pass") {
    weights.shot += 0.15;
    weights.dribble += 0.1;
  }

  if (last === "dribble") {
    weights.shot += 0.2;
  }

  if (last === "interception") {
    weights.pass += 0.2;
  }
  // =========================
  // 🔒 SAFETY (kein negativer Müll)
  // =========================
  Object.keys(weights).forEach((k) => {
    weights[k] = Math.max(0.01, weights[k]);
  });

  // =========================
  // 🔄 NORMALIZE (wichtig!)
  // =========================
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  Object.keys(weights).forEach((k) => {
    weights[k] = weights[k] / total;
  });

  return weights;
}

function switchPossession(ctx) {
  const live = game.match?.live;
  if (!live) return;

  const home = ctx.match.homeTeamId;
  const away = ctx.match.awayTeamId;

  live.possession = live.possession === home ? away : home;
}

function pickEventByWeight(weights) {
  const r = Math.random();
  let sum = 0;

  for (const key in weights) {
    sum += weights[key];
    if (r < sum) return key;
  }

  return "duel";
}
// =========================
// 🆕 EVENT EMITTER
// =========================
function emitMatchEvent(type, payload = {}) {
  const live = game.match?.live;
  const match = game.match?._scheduleRef || game.match?.current;
  if (!live || !match) return;

  const teamId = payload.teamId;

  // 🔥 TEAM NAME RESOLVE (ZENTRAL!)
  let teamName = null;

  if (teamId) {
    const isHome = String(teamId) === String(match.homeTeamId);

    teamName = isHome
      ? match.home?.name || getTeamNameById(teamId)
      : match.away?.name || getTeamNameById(teamId);
  }

  // 🔥 PLAYER NAME RESOLVE
  let playerName = null;

  if (payload.playerId) {
    const pool = game.players || [];
    const player = pool.find((p) => String(p.id) === String(payload.playerId));

    playerName = player?.name || null;
  }

  const event = {
    id: crypto.randomUUID(),
    type: type || "UNKNOWN_EVENT",
    minute: live.minute ?? 0,

    // 🔥 ENRICHED DATA
    ...payload,
    teamName,
    playerName,
  };

  console.log("📡 FINAL EVENT:", event);
  // 🔥 RED CARD → automatische Sperre
  if (type === EVENT_TYPES.RED_CARD && payload.playerId) {
    addSuspension(payload.playerId, determineRedCardBan(), "red_card");
  }

  // 🔥 Verletzungen selten im Spielfluss
  if (teamId) {
    maybeTriggerInjury(teamId);
  }
  game.match.live.events =
  game.match.live.events || [];

game.match.live.events.push(event);

emit(EVENTS.MATCH_EVENT, event);
}
// =========================
// 🎮 GAME EVENT EFFECT HANDLER
// =========================
function applyGameEventEffect(event, ctx) {
  if (!event || !ctx?.match) return;

  const type = String(event.type || event.effect || "").toLowerCase();

  // =========================
  // 🔥 LIVE MINUTE SAFE
  // =========================
  const liveMinute = Number(game.match?.live?.minute ?? 0);

  // =========================
  // ⚽ GOAL EVENT
  // =========================
  if (type === "goal") {
    const isHome = Math.random() < 0.5;

    const teamId = isHome ? ctx.match.homeTeamId : ctx.match.awayTeamId;

    const player = getRandomPlayer(teamId);

    if (!game.match.live.score) {
      game.match.live.score = {
        home: 0,
        away: 0,
      };
    }

    if (!game.match.score) {
      game.match.score = {
        home: 0,
        away: 0,
      };
    }

    if (isHome) {
      game.match.live.score.home++;
      game.match.score.home++;
    } else {
      game.match.live.score.away++;
      game.match.score.away++;
    }

    emitMatchEvent(EVENT_TYPES.GOAL, {
      teamId,
      playerId: player?.id,
      relatedPlayerId: getRandomPlayer(teamId)?.id,
      outcome: EVENT_OUTCOMES.SUCCESS,
    });
  }

  // =========================
  // 🚫 FOUL EVENT
  // =========================
  else if (type === "foul") {
    emitMatchEvent(EVENT_TYPES.FOUL, {
      teamId: Math.random() < 0.5 ? ctx.match.homeTeamId : ctx.match.awayTeamId,
    });
  }

  // =========================
  // 📐 CORNER EVENT
  // =========================
  else if (type === "corner") {
    emitMatchEvent(EVENT_TYPES.CORNER, {
      teamId: Math.random() < 0.5 ? ctx.match.homeTeamId : ctx.match.awayTeamId,
    });
  }

  // =========================
  // ⚔️ DUEL EVENT
  // =========================
  else if (type === "duel") {
    emitMatchEvent(EVENT_TYPES.DUEL, {
      teamId: Math.random() < 0.5 ? ctx.match.homeTeamId : ctx.match.awayTeamId,
    });
  }

  // =========================
  // 🎯 SHOT EVENT
  // =========================
  else if (type === "shot") {
    emitMatchEvent(EVENT_TYPES.SHOT, {
      teamId: Math.random() < 0.5 ? ctx.match.homeTeamId : ctx.match.awayTeamId,
    });
  }

  // =========================
  // ⚽ FREMDMATCH SYNC
  // =========================
  if (
    liveMinute > 0 &&
    liveMinute <= 90 &&
    liveMinute % 5 === 0 &&
    typeof simulateLiveMatchMinute === "function"
  ) {
    simulateLiveMatchMinute(
      game.league?.current?.schedule?.[game.league.currentRound],
      liveMinute,
    );
  }
}
// =========================
// 👥 PLAYER ACCESS
// =========================
function getPlayersOfTeam(teamId) {
  const nid = normalizeId(teamId);

  const team = game.league?.current?.teams.find(
    (t) => normalizeId(t.id) === nid,
  );

  const players = team?.players || [];

  console.log("🔍 TEAM ID:", nid);
  console.log("👥 TEAM PLAYERS:", players.length);

  return players;
}

function autoFillLineup(teamId) {
  if (!game.team.lineup) {
    game.team.lineup = { formation: "4-4-2", slots: {} };
  }

  if (!game.team.lineup.slots) {
    game.team.lineup.slots = {};
  }

  const nid = normalizeId(teamId);
  const myTeamId =
    normalizeId(game.team?.selectedId) || normalizeId(game.team?.id);

  if (nid !== myTeamId) return;

  const pool = getPlayersOfTeam(teamId);
  if (!pool.length) return;

  const lineup = game.team.lineup;

  const byPos = {
    GK: [],
    DEF: [],
    MID: [],
    ST: [],
  };

  pool.forEach((p) => {
    const pos = (p.position_type || "").toUpperCase();

    if (pos.includes("GK")) byPos.GK.push(p);
    else if (pos.includes("DEF")) byPos.DEF.push(p);
    else if (pos.includes("MID")) byPos.MID.push(p);
    else if (pos.includes("ST")) byPos.ST.push(p);
  });

  function pick(arr) {
    return arr.shift()?.id || null;
  }

  Object.keys(lineup.slots).forEach((slot) => {
    if (lineup.slots[slot]) return; // schon gesetzt

    if (slot === "GK") lineup.slots[slot] = pick(byPos.GK);
    else if (slot.startsWith("DEF")) lineup.slots[slot] = pick(byPos.DEF);
    else if (slot.startsWith("MID")) lineup.slots[slot] = pick(byPos.MID);
    else if (slot.startsWith("ST")) lineup.slots[slot] = pick(byPos.ST);
  });
}

function getRandomPlayer(teamId) {
  const nid = normalizeId(teamId);
  const current = game.match?.current;

  if (current) {
    if (
      normalizeId(current.homeTeamId) === nid &&
      current.homePlayers?.length
    ) {
      return current.homePlayers[
        Math.floor(Math.random() * current.homePlayers.length)
      ];
    }

    if (
      normalizeId(current.awayTeamId) === nid &&
      current.awayPlayers?.length
    ) {
      return current.awayPlayers[
        Math.floor(Math.random() * current.awayPlayers.length)
      ];
    }
  }

  const list = getPlayersOfTeam(nid);

  if (!list.length) {
    console.warn("⚠️ Keine Spieler für Team-ID:", nid);
    return null;
  }

  return list[Math.floor(Math.random() * list.length)];
}

// =========================
// 🧠 MATCH CHECK
// =========================
function isMyMatch(match) {
  const myTeamId =
    normalizeId(game.team?.selectedId) || normalizeId(game.team?.id);

  if (!myTeamId) return true;

  return (
    normalizeId(match.homeTeamId) === myTeamId ||
    normalizeId(match.awayTeamId) === myTeamId
  );
}

// =========================
// 🎮 INIT MATCH (STRICT ID)
// =========================
function initMatch(round) {
  round = (round || []).filter(
    (m) => m && typeof m === "object" && m.homeTeamId && m.awayTeamId,
  );

  if (!game.match) {
    game.match = {};
  }

  // 🔥 RESET MATCH LOOP
  if (matchInterval) {
    clearInterval(matchInterval);
    matchInterval = null;
  }

  // ❗ Erst prüfen
  if (!round?.length) return false;

  // =========================
  // 🧠 DANACH dein Spiel suchen
  // =========================
  const playerMatch = round.find((m) => isMyMatch(m));

  // =========================
  // ⚽ BYE HANDLING
  // =========================
  if (!playerMatch) {
    console.warn("⚽ BYE: Team hat spielfrei", round);

    game.match._scheduleRef = null;

    game.match.current = null;

    game.match.live = {
      minute: 0,

      running: false,

      phase: "bye",

      score: {
        home: 0,
        away: 0,
      },

      events: [],

      possession: null,

      lastEvent: null,

      _introStarted: false,
      _fulltimeEmitted: false,

      _penaltyPause: false,
      _minigamePause: false,
      _minigameType: null,
    };

    game.match.home = null;
    game.match.away = null;

    game.match.score = {
      home: 0,
      away: 0,
    };

    // =========================
    // 🏟 RESET IDLE
    // =========================
    window.idleAlreadyShown = false;

    return {
      isBye: true,
    };
  }

  // =========================
  // ⚽ NORMAL MATCH
  // =========================
  const homeId = normalizeId(playerMatch.homeTeamId);

  const awayId = normalizeId(playerMatch.awayTeamId);

  // =========================
  // 🔥 STRICT SAFETY
  // =========================
  if (!homeId || !awayId) {
    console.error("❌ MATCH INIT FAILED", playerMatch);

    return false;
  }

  // =========================
  // 🔥 REAL SCHEDULE REF
  // =========================
  game.match._scheduleRef = playerMatch;

  // =========================
  // 🔥 KEEP ORIGINAL OBJECT
  // =========================
  game.match.current = playerMatch;

  // =========================
  // 🧠 NORMALIZATION
  // =========================
  game.match.current.id = game.match.current.id || crypto.randomUUID();

  game.match.current.homeTeamId = homeId;

  game.match.current.awayTeamId = awayId;

  game.match.current.home = game.match.current.home || playerMatch.home || null;

  game.match.current.away = game.match.current.away || playerMatch.away || null;

  // =========================
  // 🧠 RESULT SAFETY
  // =========================
  if (!game.match.current.result) {
    game.match.current.result = null;
  }

  game.match.current.homeGoals = Number(game.match.current.homeGoals ?? 0);

  game.match.current.awayGoals = Number(game.match.current.awayGoals ?? 0);

  game.match.current.finished = game.match.current.finished || false;

  game.match.current._processed = game.match.current._processed || false;

  // =========================
  // 👥 PLAYER INIT
  // =========================
  try {
    autoFillLineup(homeId);
    autoFillLineup(awayId);

    function getPlayersFromLineup(teamId) {
      const nid = normalizeId(teamId);

      const myTeamId =
        normalizeId(game.team?.selectedId) || normalizeId(game.team?.id);

      // =====================
      // 👥 OPPONENT
      // =====================
      if (nid !== myTeamId) {
        return getPlayersOfTeam(teamId);
      }

      const slots = game.team?.lineup?.slots || {};

      const ids = Object.values(slots).filter(Boolean);

      // =====================
      // 🔥 NO LINEUP
      // =====================
      if (!ids.length) {
        return getPlayersOfTeam(teamId);
      }

      const pool = game.players || [];

      let selected = pool.filter(
        (p) => ids.includes(normalizeId(p.id)) && isPlayerAvailable(p.id),
      );

      // =====================
      // 🧠 FILL UP TO 11
      // =====================
      if (selected.length < 11) {
        const fallback = getPlayersOfTeam(teamId).filter(
          (p) =>
            isPlayerAvailable(p.id) &&
            !selected.some((sp) => normalizeId(sp.id) === normalizeId(p.id)),
        );

        while (selected.length < 11 && fallback.length) {
          selected.push(fallback.shift());
        }
      }

      return selected;
    }

    game.match.current.homePlayers = getPlayersFromLineup(homeId);

    game.match.current.awayPlayers = getPlayersFromLineup(awayId);
  } catch (e) {
    console.warn("⚠️ Player init failed", e);
  }

  // =========================
  // 🎮 LIVE MATCH STATE
  // =========================
  game.match.live = {
    minute: 0,

    running: false,

    phase: "match_intro",

    score: {
      home: 0,
      away: 0,
    },

    events: [],

    possession: Math.random() < 0.5 ? homeId : awayId,

    lastEvent: null,

    // =====================
    // 🧠 FLAGS
    // =====================
    _introStarted: false,
    _fulltimeEmitted: false,

    _penaltyPause: false,
    _minigamePause: false,
    _minigameType: null,
  };

  // =========================
  // 🏠 TEAMS
  // =========================
  game.match.home = {
    id: homeId,

    name: getTeamNameById(homeId),
  };

  game.match.away = {
    id: awayId,

    name: getTeamNameById(awayId),
  };

  // =========================
  // 📊 SCORE
  // =========================
  game.match.score = {
    home: 0,
    away: 0,
  };

  // =========================
  // 🎬 MATCH INTRO (DELAYED)
  // =========================

  // 🏟 Stadion zuerst sichtbar
  setTimeout(() => {
    try {
      window.idleAlreadyShown = false;

      playIdleBroadcast();
    } catch (e) {
      console.warn("⚠️ Idle failed", e);
    }
  }, 100);

  return true;
}
// =========================
// ⚽ EVENTS
// =========================
function createShot(ctx) {
  const isHome = Math.random() < 0.5;

  const teamId = isHome ? ctx.match.homeTeamId : ctx.match.awayTeamId;
  const opponentId = isHome ? ctx.match.awayTeamId : ctx.match.homeTeamId;

  const shooter = getRandomPlayer(teamId);
  const keeper = getRandomPlayer(opponentId);

  const w = getPositionWeights(shooter);
  if (Math.random() > w.shot) return;

  const r = Math.random();
  const goalChance = 0.38;
const saveChance = 0.32;

  if (r < goalChance) {
    if (isHome) {
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
      outcome: EVENT_OUTCOMES.SUCCESS,
    });

    return;
  }

  if (r < goalChance + saveChance) {
    emitMatchEvent(EVENT_TYPES.SHOT_SAVED, {
      teamId: opponentId,
      playerId: keeper?.id,
      outcome: EVENT_OUTCOMES.SAVED,
    });
    return;
  }

  emitMatchEvent(EVENT_TYPES.SHOT, {
    teamId,
    playerId: shooter?.id,
    outcome: EVENT_OUTCOMES.FAIL,
  });
}

/* =========================
   ⚽ LIVE EVENT HELPERS
   CLEAN / BALANCED VERSION
   ========================= */

// =========================
// 🔥 FOUL
// =========================
function createFoul(ctx) {

  const live =
    game.match?.live;

  if (!live?.running) {
    return;
  }

  const defendingTeamId =

    Math.random() < 0.5

      ? ctx.match.homeTeamId
      : ctx.match.awayTeamId;

  const attackingTeamId =

    live.possession ||
    ctx.teamId ||
    defendingTeamId;

  const player =
    getRandomPlayer(
      defendingTeamId,
    );

  const attackPosition =

    window.DEBUG_PENALTY_MODE === true

      ? {
          x: 0.5,
          y: 0.18,
        }

      : {
          x:
            Math.random() * 0.6 +
            0.2,

          y:
            Math.random() * 0.5 +
            0.2,
        };

  // =========================
  // ⚖️ RESOLVE
  // =========================
  const resolvedType =
    resolveFoul({

      attackPosition,

      minute:
        live.minute || 0,

      intensity:

        Math.random() < 0.65
          ? "high"
          : "normal",
    });

  console.log(
    "📦 FOUL:",
    resolvedType,
  );

  emitMatchEvent(
    resolvedType,
    {

      teamId:

        resolvedType ===
        EVENT_TYPES.PENALTY

          ? attackingTeamId
          : defendingTeamId,

      playerId:
        player?.id,

      outcome:
        EVENT_OUTCOMES.NEUTRAL,

      attackPosition,
    },
  );
}

// =========================
// 🚩 CORNER
// =========================
function createCorner(ctx) {
  console.log("🚩 CREATE CORNER CALLED");

  const live =
    game.match?.live;

  if (!live?.running) {
    return;
  }

  const teamId =
    live.possession ||

    (
      Math.random() < 0.5

        ? ctx.match.homeTeamId
        : ctx.match.awayTeamId
    );

  emitMatchEvent(
    EVENT_TYPES.CORNER,
    {
      teamId,
    },
  );
}

// =========================
// ⚔️ DUEL
// =========================
function createDuel(ctx) {

  const live =
    game.match?.live;

  if (!live?.running) {
    return;
  }

  const p1 =
    getRandomPlayer(
      ctx.match.homeTeamId,
    );

  const p2 =
    getRandomPlayer(
      ctx.match.awayTeamId,
    );

  if (!p1 || !p2) {
    return;
  }

  const success =
    Math.random() < 0.5;

  emitMatchEvent(
    EVENT_TYPES.DUEL,
    {
      playerId:
        p1.id,

      relatedPlayerId:
        p2.id,

      outcome:

        success
          ? EVENT_OUTCOMES.SUCCESS
          : EVENT_OUTCOMES.FAIL,
    },
  );

  // 🔁 kleine Possession Chance
  if (Math.random() < 0.15) {
    switchPossession(ctx);
  }
}

// =========================
// ➡️ PASS
// =========================
function createPass(ctx) {

  const live =
    game.match?.live;

  const teamId =
    live?.possession;

  if (
    !live?.running ||
    !teamId
  ) {
    return;
  }

  const passer =
    getRandomPlayer(teamId);

  if (!passer) {
    return;
  }

  emitMatchEvent(
    EVENT_TYPES.PASS,
    {
      teamId,
      playerId:
        passer.id,

      outcome:
        EVENT_OUTCOMES.SUCCESS,
    },
  );

  // 🔁 seltener Ballverlust
  if (Math.random() < 0.04) {

    emitMatchEvent(
      EVENT_TYPES.BALL_LOSS,
      {
        teamId,
        playerId:
          passer.id,
      },
    );

    switchPossession(ctx);
  }
}

// =========================
// 🕺 DRIBBLE
// =========================
function createDribble(ctx) {

  const live =
    game.match?.live;

  const teamId =
    live?.possession;

  if (
    !live?.running ||
    !teamId
  ) {
    return;
  }

  const player =
    getRandomPlayer(teamId);

  if (!player) {
    return;
  }

  const success =
    Math.random() < 0.58;

  emitMatchEvent(
    EVENT_TYPES.DRIBBLE,
    {
      teamId,

      playerId:
        player.id,

      outcome:

        success
          ? EVENT_OUTCOMES.SUCCESS
          : EVENT_OUTCOMES.FAIL,
    },
  );

  // 🔁 Ballverlust
  if (!success) {

    switchPossession(ctx);

    emitMatchEvent(
      EVENT_TYPES.BALL_RECOVERY,
      {

        teamId:

          teamId ===
          ctx.match.homeTeamId

            ? ctx.match.awayTeamId
            : ctx.match.homeTeamId,
      },
    );
  }
}

// =========================
// 🛡 INTERCEPTION
// =========================
function createInterception(ctx) {

  const live =
    game.match?.live;

  if (!live?.running) {
    return;
  }

  const defendingTeam =

    live.possession ===
    ctx.match.homeTeamId

      ? ctx.match.awayTeamId
      : ctx.match.homeTeamId;

  const player =
    getRandomPlayer(
      defendingTeam,
    );

  if (!player) {
    return;
  }

  emitMatchEvent(
    EVENT_TYPES.INTERCEPTION,
    {
      teamId:
        defendingTeam,

      playerId:
        player.id,
    },
  );

  switchPossession(ctx);
}

// =========================
// 🔁 MOMENTUM
// =========================
let momentum = 0;

function updateMomentum() {

  // 🔥 ruhigeres Momentum
  momentum +=
    (Math.random() - 0.5) *
    0.08;

  momentum = Math.max(
    -1,
    Math.min(
      1,
      momentum,
    ),
  );
}

// =========================
// 💪 TEAM STRENGTH
// =========================
function getTeamStrength(teamId) {

  const nid =
    normalizeId(teamId);

  const myTeamId =

    normalizeId(
      game.team?.selectedId,
    ) ||

    normalizeId(
      game.team?.id,
    );

  let players;

  // =========================
  // 🧠 PLAYER TEAM
  // =========================
  if (nid === myTeamId) {

    autoFillLineup(
      teamId,
    );

    const slots =
      game.team?.lineup?.slots || {};

    const ids =
      Object.values(slots)
        .filter(Boolean);

    // 🔥 echtes Lineup
    if (ids.length) {

      const pool =
        game.players || [];

      players = pool.filter(
        (p) =>

          ids.includes(
            normalizeId(p.id),
          ),
      );

    } else {

      players =
        getPlayersOfTeam(
          teamId,
        );
    }

  } else {

    players =
      getPlayersOfTeam(
        teamId,
      );
  }

  // =========================
  // 🛑 FALLBACK
  // =========================
  if (!players?.length) {

    return 50;
  }

  // =========================
  // 📊 TEAM RATING
  // =========================
  const avg =

    players.reduce(
      (sum, p) =>

        sum +
        getPlayerRating(p),

      0,
    ) / players.length;

  // 🔥 leicht normalisiert
  return Math.max(
    40,
    Math.min(
      95,
      avg,
    ),
  );
}

function simulateLiveEvent(ctx) {

  const live =
    game.match?.live;

  // =========================
  // 🛑 SAFETY
  // =========================
  if (!live) {
    return;
  }

  // =========================
  // 🎮 ONLY REAL GAMEPLAY
  // =========================
  const isGameplayPhase =

    live.phase === "first_half" ||
    live.phase === "second_half";

  if (!isGameplayPhase) {
    return;
  }

  // =========================
  // ⏸ PAUSED
  // =========================
  if (live.running === false) {
    return;
  }

  // =========================
  // 🎲 GLOBAL PACING
  // =========================

  // 🔥 etwa jede 3.-4. Minute passiert etwas
  if (Math.random() < 0.12) {

    live.lastEvent =
      "idle";

    return;
  }

  updateMomentum();

  const homeId =
    ctx.match.homeTeamId;

  const awayId =
    ctx.match.awayTeamId;

  const homeStrength =
    getTeamStrength(homeId);

  const awayStrength =
    getTeamStrength(awayId);

  const total =
    Math.max(
      1,
      homeStrength +
      awayStrength,
    );

  const homeBias =
    homeStrength / total;

  const adjustedHomeChance =

    homeBias +
    momentum * 0.12;

  // =========================
  // ⚙️ TACTICS
  // =========================
  const mod =
    getTacticModifier();

  // =========================
  // 🎯 ATTACKING TEAM
  // =========================
  let attackingTeam =
    live.possession;

  if (!attackingTeam) {

    attackingTeam =

      Math.random() <
      adjustedHomeChance

        ? homeId
        : awayId;
  }

  // =========================
  // ⚙️ EVENT TYPE
  // =========================
  const weights =
    getEventWeights(
      ctx,
      mod,
      attackingTeam,
    );

  const eventType =
    pickEventByWeight(
      weights,
    );

  live.lastEvent =
    eventType;

  console.log(
    "⚽ LIVE EVENT:",
    eventType,
  );

  // =========================
  // 🎮 EXECUTION
  // =========================
  switch (eventType) {

    // =====================
    // ⚽ SHOT
    // =====================
    case "shot":

      // 🔥 selten
      if (Math.random() < 0.82) {

        createShot({
          match: ctx.match,
          teamId:
            attackingTeam,
        });
      }

      break;

    // =====================
    // 🚫 FOUL
    // =====================
    case "foul":

      if (Math.random() < 0.22) {
        createFoul(ctx);
      }

      break;

    // =====================
    // 🚩 CORNER
    // =====================
    case "corner":

  console.log("🧪 CORNER ROLL");

  if (Math.random() < 0.18) {

    console.log("✅ CORNER PASSED");

    createCorner(ctx);
  }

  break;

    // =====================
    // ➡️ PASS
    // =====================
    case "pass":

      if (Math.random() < 0.75) {
        createPass(ctx);
      }

      break;

    // =====================
    // 🕺 DRIBBLE
    // =====================
    case "dribble":

      if (Math.random() < 0.33) {
        createDribble(ctx);
      }

      break;

    // =====================
    // 🛡 INTERCEPTION
    // =====================
    case "interception":

      if (Math.random() < 0.28) {
        createInterception(ctx);
      }

      break;

    // =====================
    // ⚔️ DUEL
    // =====================
    case "duel":
    default:

      if (Math.random() < 0.48) {
        createDuel(ctx);
      }

      break;
  }

  // =========================
  // 🔁 POSSESSION FLOW
  // =========================
  if (
    eventType === "shot" &&
    Math.random() < 0.18
  ) {

    switchPossession(ctx);

  } else if (
    eventType === "duel" &&
    Math.random() < 0.14
  ) {

    switchPossession(ctx);
  }
}

// =========================
// ▶️ CONTROL
// =========================
function pauseMatch(reason = "MATCH PAUSED") {
  if (!game.match?.live) return;

  game.match.live.running = false;

  if (
    String(reason).includes("PENALTY") ||
    String(reason).includes("MINIGAME")
  ) {
    game.match.live._penaltyPause = true;
    game.match.live._minigamePause = true;
    game.match.live._minigameType = String(reason).includes("PENALTY")
      ? "penalty"
      : "minigame";
  }

  console.log(`⏸ ${reason}`);
}

function resumeMatch(reason = "MATCH RESUMED") {
  if (!game.match?.live) return;

  const reasonText = String(reason);
  const isMinigameComplete =
    reasonText.includes("PENALTY COMPLETE") ||
    reasonText.includes("MINIGAME COMPLETE");

  if (game.match.live._minigamePause === true && !isMinigameComplete) {
    console.log(`▶ ${reason} ignored during minigame`);
    return;
  }

  if (isMinigameComplete) {
    game.match.live._penaltyPause = false;
    game.match.live._minigamePause = false;
    game.match.live._minigameType = null;
  }

  game.match.live.running = true;

  console.log(`▶ ${reason}`);
}

function isLivePaused(live) {
  const penaltyActive =
    typeof window !== "undefined" && window.__penaltyActive === true;

  const penaltyRootActive =
    typeof document !== "undefined" &&
    Boolean(document.getElementById("penaltyGameContainer"));

  // =========================
  // 🎬 MATCH INTRO
  // =========================
  const introPause = live?.phase === "match_intro";
const halftimePause = live?.phase === "halftime";
  // =========================
  // ⏸ HALFTIME
  // =========================
 

  return (
  !live ||
  introPause ||
  halftimePause ||
  live._penaltyPause === true ||
  live._minigamePause === true ||
  penaltyActive ||
  penaltyRootActive
);
}

// =========================
// 🔁 LOOP + 🛑 LOOP GUARD
// =========================

function runMatchLoop({ onTick, onEnd } = {}) {
  console.log("🚨 RUN MATCH LOOP STARTED");

  // =========================
  // 🛑 LOOP GUARD
  // =========================
  if (window.__matchLoopRunning) {
    console.warn("⚠️ Match loop already running");

    return;
  }

  window.__matchLoopRunning = true;

  if (matchInterval) {
    return;
  }

  const STEP = 1000;

  let lastTime = performance.now();

  let accumulator = 0;

  matchInterval = setInterval(() => {
    const live = game.match?.live;

    const currentMatch = game.match?.current;

    // =========================
    // 🛑 SAFETY
    // =========================
    if (!live || !currentMatch) {
      return;
    }

    if (live.phase === "bye") {
      return;
    }

    

    // =========================
    // 🏁 FULLTIME
    // =========================
    if (live.phase === "fulltime") {
      console.log("🏁 FULLTIME STOP");

      clearInterval(matchInterval);

      matchInterval = null;

      window.__matchLoopRunning = false;

      return;
    }

    // =========================
    // ⏸ HALFTIME
    // =========================
    if (live.phase === "halftime") {

  lastTime =
    performance.now();

  accumulator = 0;

  // 🔥 WICHTIG
  onTick?.();

  return;
}

    // =========================
    // ⏸ GENERIC PAUSE
    // =========================
    if (live.running === false && live.phase !== "match_intro") {
      return;
    }

    const now = performance.now();

    const delta = now - lastTime;

    lastTime = now;

    accumulator += delta;

    let safety = 0;

    while (accumulator >= STEP && safety < 10) {
      // =====================
      // 🎬 MATCH INTRO
      // =====================
      if (live.phase === "match_intro") {
        if (!live._introStarted) {
          live._introStarted = true;

          console.log("🎬 MATCH INTRO START");

          updateEvents();

          setTimeout(() => {
            if (game.match?.live) {
              game.match.live.phase = "first_half";

              game.match.live.running = true;

              console.log("▶ MATCH START");
            }
          }, 8000);
        }

        accumulator = 0;
        break;
      }

      // =====================
      // ⏱ MATCH TIME
      // =====================
      live.minute++;

      document.body?.classList.add("match-live");

      // =====================
      // ⚡ OTHER MATCHES
      // =====================
      const league = game.league?.current;

      const round = league?.schedule?.[league.currentRound];

      simulateLiveMatchMinute(round, live.minute);

      // =====================
      // 🎮 MATCH CONTEXT
      // =====================
      const ctx = {
        match: currentMatch,

        requestGoal: (data = {}) => {
          game.match.flags = game.match.flags || {};

          game.match.flags.goalRequested = true;

          game.match.flags.goalData = data;
        },
      };

      // =====================
      // ⚽ GAMEPLAY
      // =====================
      try {

  console.log("🔍 BEFORE rollRandomEvents");

  rollRandomEvents(ctx);

  console.log("🔍 AFTER rollRandomEvents");


  const isGameplayPhase =
    live.phase === "first_half" ||
    live.phase === "second_half";

  if (isGameplayPhase) {

    console.log("🔍 BEFORE simulateLiveEvent");

    simulateLiveEvent(ctx);

    console.log("🔍 AFTER simulateLiveEvent");
  }

  console.log("🔍 BEFORE updateEvents");

  updateEvents();

  console.log("🔍 AFTER updateEvents");

} catch (e) {

  console.error("💥 LOOP CRASH", e);

}

      // =====================
      // 🛑 HALFTIME
      // =====================
      if (
  live.phase === "first_half" &&
  live.minute === 45
) {
        console.log("⏸ HALFTIME");

        // 🔥 exakt 45 halten
        live.minute = 45;

        // 🔥 sauber pausieren
        live.phase = "halftime";

        live.running = false;

        live.lastEvent = null;

        live.possession = null;

        // 🔥 keine alten Flags
        live._halftimeShown = true;

        // =====================
        // 📡 EVENT
        // =====================
        emitMatchEvent(EVENT_TYPES.HALFTIME, {
          minute: 45,

          score: {
            home: Number(game.match.score.home ?? 0),

            away: Number(game.match.score.away ?? 0),
          },

          outcome: "HALFTIME",
        });

        // =====================
        // 💾 SAVE
        // =====================
        saveGame();

        // =====================
        // 🛑 LOOP RESET
        // =====================
        accumulator = 0;

        lastTime = performance.now();

        // 🔥 UI UPDATE
        onTick?.();

        break;
      }

      // =====================
      // 🏁 FULLTIME
      // =====================
      if (live.minute >= 90) {
        console.log("🏁 FULLTIME");

        // 🔥 exakt 90 halten
        live.minute = 90;

        // 🔥 sofort stoppen
        live.running = false;

        live.phase = "fulltime";

        live.lastEvent = null;

        live.possession = null;

        // =====================
        // 📡 FULLTIME EVENT
        // =====================
        if (!live._fulltimeEmitted) {
          live._fulltimeEmitted = true;

          emitMatchEvent(EVENT_TYPES.FULLTIME, {
            minute: 90,

            score: {
              home: Number(game.match.score.home ?? 0),

              away: Number(game.match.score.away ?? 0),
            },

            outcome: "END",
          });
        }

        // =====================
        // 📊 FINALIZE MATCH
        // =====================
        const league = game.league?.current;

        const match = game.match?.current;

        if (league && match && !match._processed) {
          const hg = Number(game.match.score.home ?? 0);

          const ag = Number(game.match.score.away ?? 0);

          match.result = {
            home: hg,
            away: ag,
          };

          match.homeGoals = hg;

          match.awayGoals = ag;

          match.finished = true;

          match.live = false;

          match.status = "FT";

          match._processed = true;

          // 🔥 Tabelle aktualisieren
          updateTable(match.homeTeamId, match.awayTeamId, hg, ag);

          console.log("✅ MATCH FINALIZED", `${hg}:${ag}`);
          console.log("🏁 FINAL MATCH INFO", {
  home: match.homeTeamId,
  away: match.awayTeamId,
  processed: match._processed,
});
        }

        // =====================
        // 🧹 UI CLEANUP
        // =====================
        document.body?.classList.remove("match-live");

        // =====================
        // 🛑 LOOP STOP
        // =====================
        clearInterval(matchInterval);

        matchInterval = null;

        window.__matchLoopRunning = false;

        // =====================
        // 🔄 CLEAN RESET
        // =====================
        setTimeout(() => {

  // =====================
  // 🧹 LIVE RESET
  // =====================
  if (game.match?.live) {

    game.match.live.minute = 0;

    game.match.live.running = false;

    game.match.live.phase = "idle";

    game.match.live.events = [];

    game.match.live.lastEvent = null;

    game.match.live.possession = null;

    game.match.live._introStarted = false;

    game.match.live._fulltimeEmitted = false;

    game.match.live._halftimeShown = false;

    game.match.live._penaltyPause = false;

    game.match.live._minigamePause = false;

    game.match.live._minigameType = null;

    // 🔥 SCORE RESET
    game.match.live.score = {
      home: 0,
      away: 0,
    };
  }

  // =====================
  // 📊 GLOBAL SCORE RESET
  // =====================
  game.match.score = {
    home: 0,
    away: 0,
  };

  // =====================
  // 🧹 EVENT RESET
  // =====================
  game.events = game.events || {};

  game.events.history = [];

  // =====================
  // 🧹 MATCH EVENT CACHE
  // =====================
  if (game.match) {

    game.match.events = [];

    game.match.lastEvent = null;
  }

  // =====================
  // 🏟 NEXT MATCH PREVIEW
  // =====================
  const league =
    game.league?.current;

  const nextRound =
    league?.schedule?.[
      (game.league.currentRound || 0) + 1
    ];

  if (nextRound?.length) {

    const nextMatch =
      nextRound.find((m) => isMyMatch(m));

    if (nextMatch) {

      game.match.next = {
        homeTeamId: nextMatch.homeTeamId,
        awayTeamId: nextMatch.awayTeamId,
      };
    }
  }

  // =====================
  // 🎬 STADIUM RESET
  // =====================
  window.idleAlreadyShown = false;


  // =====================
// 🔥 RELEASE CURRENT MATCH
// =====================
game.match.current = null;
game.match._scheduleRef = null;
game.match.live = null;

console.log("🧹 MATCH CLEARED");
  // =====================
  // 🔄 UI REFRESH
  // =====================
  game.ui.dirty = true;

  console.log("🔄 MATCH RESET COMPLETE");

}, 3000);

        // =====================
        // 💾 SAVE
        // =====================
        saveGame();

        // =====================
        // 📡 CALLBACK
        // =====================
        onTick?.();
        onEnd?.();

        return;
      }

      accumulator -= STEP;
      safety++;
    }

    onTick?.();
  }, 50);
}
function startSecondHalf() {

  const live = game.match?.live;

  if (!live) {
    return;
  }

  console.log("▶ SECOND HALF START");

  live.phase = "second_half";

  live.minute = 46;

  live.running = true;

  live.lastEvent = null;

  live._halftimeShown = true;

  live.possession =
    Math.random() < 0.5
      ? game.match.current?.homeTeamId
      : game.match.current?.awayTeamId;

  console.log("✅ SECOND HALF ACTIVE");
}
// =========================
// 📦 EXPORTS
// =========================
export {
  initMatch,
  runMatchLoop,
  pauseMatch,
  resumeMatch,
  startSecondHalf,
};
