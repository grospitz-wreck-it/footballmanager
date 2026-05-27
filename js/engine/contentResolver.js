// =========================
// 🧠 CONTENT RESOLVER (FINAL STABLE)
// =========================

import { game } from "../core/state.js";

// =========================
// 🔤 NORMALIZE
// =========================
function normalize(val) {
  return String(val || "")
    .toLowerCase()
    .trim();
}

// =========================
// 👤 PLAYER LOOKUP
// =========================
function findPlayerById(id) {

  if (!id) return null;

  const league = game.league?.current;

  if (!league) return null;

  for (const team of league.teams || []) {

    const player = team.players?.find(
      (p) => String(p.id) === String(id),
    );

    if (player) return player;
  }

  return null;
}

function getPlayerNameById(id) {

  const player = findPlayerById(id);

  if (!player) {
    return "ein Spieler";
  }

  return (
    player.name ||
    player.Name ||
    "ein Spieler"
  );
}

// =========================
// 🏆 TEAM LOOKUP
// =========================
function findTeamById(id) {

  if (!id) return null;

  return (
    game.league?.current?.teams?.find(
      (t) => String(t.id) === String(id),
    ) || null
  );
}

function getTeamNameById(id) {

  const team = findTeamById(id);

  return (
    team?.name ||
    "ein Team"
  );
}

// =========================
// 🔧 URL FIX
// =========================
function fixUrl(url) {

  if (!url) return null;

  let fixed = url;

  fixed = fixed.replace(
    "/render/image/public/",
    "/object/public/",
  );

  fixed = encodeURI(fixed);

  return fixed;
}

// =========================
// 🧼 VALIDATE ASSET
// =========================
function isValidAsset(asset) {

  return (
    asset &&
    typeof asset.url === "string" &&
    asset.url.length > 10
  );
}

// =========================
// 🧠 EVENTS SOURCE
// =========================
function getEventDefinitions() {

  const defs =

    (
      Array.isArray(game?.data?.gameEvents) &&
      game.data.gameEvents.length
    )

      ? game.data.gameEvents

      : (

        Array.isArray(
          game?.data?.eventDefinitions,
        ) &&
        game.data.eventDefinitions.length
      )

        ? game.data.eventDefinitions

        : [];

  if (!Array.isArray(defs)) {
    console.warn(
      "⚠️ No event definitions in state",
    );

    return [];
  }

  return defs;
}

// =========================
// 🎲 WEIGHTED RANDOM
// =========================
function weightedRandom(arr) {

  const total = arr.reduce(
    (sum, i) =>
      sum + (i.priority || 1),
    0,
  );

  let r = Math.random() * total;

  for (const item of arr) {

    r -= item.priority || 1;

    if (r <= 0) {
      return item;
    }
  }

  return arr[0];
}

// =========================
// 🧩 EMPTY
// =========================
function emptyResult() {

  return {
    text: null,
    assets: [],
    config: null,
  };
}

// =========================
// 🎯 MAIN RESOLVER
// =========================
function resolveEventContent(event) {

  if (!event) {

    console.warn(
      "⚠️ resolveEventContent: no event",
    );

    return emptyResult();
  }

  const definitions =
    getEventDefinitions();

  if (!definitions.length) {

    console.warn(
      "⚠️ No events loaded",
    );

    return emptyResult();
  }

  const eventType =
    normalize(event.type);

  const minute =
    Number(event.minute || 0);

  console.log(
    "📡 RESOLVE EVENT:",
    event,
  );

  // =========================
  // 🔍 TYPE MATCH
  // =========================
  let matches = definitions.filter(
    (e) => {

      const possible = [
        e.type,
        e.effect,
        e.event_type,
        e.eventType,
      ]
        .map(normalize)
        .filter(Boolean);

      return possible.includes(
        eventType,
      );
    },
  );

  // =========================
  // 🧠 PHASE FILTERING
  // =========================
  matches = matches.filter((e) => {

    const trigger =
      normalize(
        e.trigger || "random",
      );

    // =====================
    // 💤 IDLE
    // =====================
    if (eventType === "IDLE") {

      return !game.match?.live?.running;
    }

    // =====================
    // 🎬 MATCH INTRO
    // =====================
    if (
      eventType === "MATCH_INTRO"
    ) {

      return minute <= 1;
    }

    // =====================
    // ⏸ HALFTIME
    // =====================
    if (
      eventType === "HALFTIME"
    ) {

      return (
        minute >= 45 &&
        minute < 50
      );
    }

    // =====================
    // ⏱ FULLTIME
    // =====================
    if (
      eventType === "FULLTIME"
    ) {

      return minute >= 90;
    }

    // =====================
    // 🎲 RANDOM EVENTS
    // =====================
    if (
      trigger === "random"
    ) {

      return (
        minute > 1 &&
        minute < 90
      );
    }

    return true;
  });

  // =========================
  // ❌ NOTHING FOUND
  // =========================
  if (!matches.length) {

    return emptyResult();
  }

  // =========================
  // 🔥 GUARANTEED FIRST
  // =========================
  const guaranteed =
    matches.filter(
      (e) => e.is_guaranteed,
    );

  if (guaranteed.length) {
    matches = guaranteed;
  }

  // =========================
  // 🧠 COOLDOWN MEMORY
  // =========================
  const memory =
    window.__eventMemory || [];

  window.__eventMemory =
    memory;

  matches = matches.filter(
    (e) => {

      if (!e.cooldown) {
        return true;
      }

      const last =
        memory.find(
          (m) => m.id === e.id,
        );

      if (!last) {
        return true;
      }

      return (
        Date.now() - last.time >
        e.cooldown * 1000
      );
    },
  );

  if (!matches.length) {

    return emptyResult();
  }

  // =========================
  // 🎲 PROBABILITY ROLL
  // =========================
  matches = matches.filter(
    (e) => {

      const probability =
        Number(
          e.probability || 0,
        );

      return (
        Math.random() <=
        probability
      );
    },
  );

  if (!matches.length) {

    return emptyResult();
  }

  // =========================
  // 🎲 RANDOM PICK
  // =========================
  const selected =
    weightedRandom(matches);

  // =========================
  // 🧠 SAVE MEMORY
  // =========================
  memory.push({
    id: selected.id,
    time: Date.now(),
  });

  if (memory.length > 20) {
    memory.shift();
  }

  // =========================
  // 🖼 ASSETS
  // =========================
  let assets = [];

  if (
    Array.isArray(selected.assets)
  ) {

    assets = selected.assets
      .flat()
      .filter(isValidAsset)
      .map((asset) => ({
        ...asset,
        url: fixUrl(asset.url),
      }));
  }

  // =========================
  // ✅ RESULT
  // =========================
  return {
    text:
      event.text ||
      selected.title ||
      null,

    assets,

    duration:
      selected.duration || 5,

    config: {
      id: selected.id,

      category:
        selected.category ||
        "default",

      priority:
        selected.priority || 1,
    },
  };
}

// =========================
// 🔥 ENRICH EVENT
// =========================
function enrichEvent(event) {

  if (!event) return event;

  const player =
    findPlayerById(
      event.playerId,
    );

  const related =
    findPlayerById(
      event.relatedPlayerId,
    );

  const team =
    findTeamById(
      event.teamId,
    );

  return {
    ...event,

    player,
    relatedPlayer: related,
    team,

    playerName:
      player?.name ||
      player?.Name ||
      "ein Spieler",

    relatedPlayerName:
      related?.name ||
      related?.Name ||
      null,

    teamName:
      team?.name ||
      "ein Team",
  };
}

// =========================
// 📦 EXPORTS
// =========================
export {
  resolveEventContent,
  enrichEvent,
};

// =========================
// 🧪 DEBUG
// =========================
window.resolveEventContent =
  resolveEventContent;

window.enrichEvent =
  enrichEvent;