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
    ...event.meta,
  };
}

function getPriority(type) {
  switch (type) {
    case "GOAL":
      return 100;
    case "PENALTY_GOAL":
      return 110;
    case "RED_CARD":
      return 95;
    case "INJURY":
      return 80;
    case "HALFTIME":
      return 60;
    case "FULLTIME":
      return 70;

    // 🔥 TAKTIK
    case "TACTIC_CHANGE":
      return 50;

    default:
      return 10;
  }
}

// =========================
// 🧠 LOOKUP
// =========================

function findPlayer(_, id) {
  if (!id) return null;

  const league = game.league?.current;

  // 🔥 1. Teams durchsuchen
  if (league?.teams) {
    for (const team of league.teams) {
      const player = team.players?.find((p) => String(p.id) === String(id));
      if (player) return player;
    }
  }

  // 🔥 2. GLOBALER FALLBACK (WICHTIG)
  const globalPlayers = window.playerPool || game.players || [];

  return globalPlayers.find((p) => String(p.id) === String(id)) || null;
}

function findTeam(_, id) {
  if (!id) return null;

  const league = game.league?.current;

  // 🔥 normal
  const team = league?.teams?.find((t) => String(t.id) === String(id));

  if (team) return team;

  // 🔥 fallback
  return (
    (game.data?.teams || []).find((t) => String(t.id) === String(id)) || null
  );
}

function buildPlayerName(player) {
  if (!player) return "ein Spieler";

  const name =
    player.name ??
    player.Name ??
    `${player.firstName || player.first_name || ""} ${player.lastName || player.last_name || ""}`;

  return name?.trim() || "ein Spieler";
}

// =========================
// 🧠 FALLBACK TEXT
// =========================
function generateText(event) {
  const player = findPlayer(null, event?.playerId);
  const team = findTeam(null, event?.teamId);

  const playerName = buildPlayerName(player);
  const teamName = team?.name || "Ein Team";

  switch (event?.type) {
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

    case "TACTIC_CHANGE":
      return `🔧 Taktik angepasst`;

    default:
      return `${teamName} im Angriff...`;
  }
}

// =========================
// 🔥 ID
// =========================
function ensureId(event) {
  return (
    event?.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
}

// =========================
// 🧠 CORE PIPELINE (NEU)
// =========================
function processEvent(event) {
  if (!event) return;

  if (!game.events) {
    game.events = { history: [] };
  }

  if (!game.events.history) {
    game.events.history = [];
  }

  const player = findPlayer(null, event.playerId);
  const relatedPlayer = findPlayer(null, event.relatedPlayerId);
  const team = findTeam(null, event.teamId);
  console.log("🧪 EVENT LOOKUP:", {
    player: player?.name || player?.Name,
    team: team?.name,
  });

  const enrichedInput = {
    ...event,

    playerName: buildPlayerName(player),

    relatedPlayerName: relatedPlayer ? buildPlayerName(relatedPlayer) : null,

    teamName: (team?.name ?? team?.Name ?? "").trim() || "ein Team",
  };

  // =========================
  // 🧠 CONTENT RESOLVE
  // =========================
  let resolved = {};
  try {
    resolved = resolveEventContent(enrichedInput) || {};
  } catch (e) {
    console.warn("⚠️ resolveEventContent failed", e);
  }

  // =========================
  // 🧠 TEXT GENERATION
  // =========================
  let text = null;

  try {
    // 1️⃣ BEST: AI / Template Commentary
    text = generateCommentary({
      ...enrichedInput,
      player,
      relatedPlayer,
      team,
    });

    // 2️⃣ FALLBACK: einfache Texte
    if (!text) {
      text = generateText(enrichedInput);
    }

    // 3️⃣ LETZTER FALLBACK: DB (Supabase)
    if (!text) {
      text = resolved.text;
    }

    // =========================
    // ⭐ BONUS: PRIORITY OVERRIDE
    // =========================
    if (resolved?.config?.priority >= 90) {
      text = resolved.text || text;
    }
  } catch (e) {
    console.error("❌ Commentary Crash:", e);
    text = resolved.text || "...";
  }

  const finalEvent = {
    ...enrichedInput,

    id: ensureId(enrichedInput),

    text: text || "...",

    assets: resolved.assets?.length ? resolved.assets : event.assets || [],

    meta: {
      ...resolved.config,
      ...enrichMeta(enrichedInput),
    },
  };

  game.events.history.push(finalEvent);
  game.events.last = finalEvent;

  emit(EVENTS.STATE_CHANGED, finalEvent);
}

// =========================
// 🎮 GAME EVENTS
// =========================
on(EVENTS.GAME_EVENT, processEvent);

// =========================
// 🎮 MATCH EVENTS
// =========================
on(EVENTS.MATCH_EVENT, processEvent);

// =========================
// 💰 AD EVENTS
// =========================
on(EVENTS.AD_REWARD, (ad) => {
  if (!ad) return;

  if (ad.reward?.type === "money") {
    if (!game.team) game.team = {};
    game.team.money = (game.team.money || 0) + ad.reward.value;
  }

  if (ad.reward?.type === "boost") {
    game.team.boost = true;
  }

  emit(EVENTS.STATE_CHANGED, game);
});
