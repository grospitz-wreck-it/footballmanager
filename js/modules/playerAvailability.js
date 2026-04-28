import { game } from "../core/state.js";

// =========================
// 🧠 INTERNAL STATE ACCESS
// =========================
function getAvailabilityState() {
  if (!game || typeof game !== "object") return null;
  if (!game.team || typeof game.team !== "object") return null;

  if (!game.team.availability || typeof game.team.availability !== "object") {
    game.team.availability = {
      suspended: {},
      injured: {}
    };
  }

  if (
    !game.team.availability.suspended ||
    typeof game.team.availability.suspended !== "object"
  ) {
    game.team.availability.suspended = {};
  }

  if (
    !game.team.availability.injured ||
    typeof game.team.availability.injured !== "object"
  ) {
    game.team.availability.injured = {};
  }

  return game.team.availability;
}

// =========================
// 🔧 HELPERS
// =========================
function normalizeMatches(matches, fallback) {
  const value = Number(matches);

  if (!Number.isFinite(value)) return fallback;

  const normalized = Math.floor(value);

  return normalized > 0 ? normalized : fallback;
}

function normalizePlayerId(playerId) {
  if (playerId === null || playerId === undefined) return null;

  const id = String(playerId).trim();

  return id.length > 0 ? id : null;
}

// =========================
// 🚫 SUSPENSION CHECKS
// =========================
function isPlayerSuspended(playerId) {
  const availability = getAvailabilityState();
  if (!availability) return false;

  const id = normalizePlayerId(playerId);
  if (!id) return false;

  const suspension = availability.suspended[id];

  return !!(
    suspension &&
    Number.isFinite(Number(suspension.matchesLeft)) &&
    Number(suspension.matchesLeft) > 0
  );
}

// =========================
// 🤕 INJURY CHECKS
// =========================
function isPlayerInjured(playerId) {
  const availability = getAvailabilityState();
  if (!availability) return false;

  const id = normalizePlayerId(playerId);
  if (!id) return false;

  const injury = availability.injured[id];

  return !!(
    injury &&
    Number.isFinite(Number(injury.matchesLeft)) &&
    Number(injury.matchesLeft) > 0
  );
}

// =========================
// ✅ AVAILABILITY CHECK
// =========================
function isPlayerAvailable(playerId) {
  return !isPlayerSuspended(playerId) && !isPlayerInjured(playerId);
}

// =========================
// 🟥 ADD SUSPENSION
// =========================
function addSuspension(
  playerId,
  matches = 2,
  reason = "red_card"
) {
  const availability = getAvailabilityState();
  if (!availability) return false;

  const id = normalizePlayerId(playerId);
  if (!id) return false;

  const newMatches = normalizeMatches(matches, 2);
  const existingMatches =
    availability.suspended[id]?.matchesLeft || 0;

  availability.suspended[id] = {
    matchesLeft: Math.max(existingMatches, newMatches),
    reason:
      typeof reason === "string" && reason.trim()
        ? reason.trim()
        : "red_card"
  };

  return true;
}

// =========================
// 🤕 ADD INJURY
// =========================
function addInjury(
  playerId,
  matches = 1,
  type = "minor"
) {
  const availability = getAvailabilityState();
  if (!availability) return false;

  const id = normalizePlayerId(playerId);
  if (!id) return false;

  const newMatches = normalizeMatches(matches, 1);
  const existingMatches =
    availability.injured[id]?.matchesLeft || 0;

  availability.injured[id] = {
    matchesLeft: Math.max(existingMatches, newMatches),
    type:
      typeof type === "string" && type.trim()
        ? type.trim()
        : "minor"
  };

  return true;
}

// =========================
// ⏬ INTERNAL DECREMENT
// =========================
function decrementMapEntries(map) {
  if (!map || typeof map !== "object") return;

  for (const playerId of Object.keys(map)) {
    const entry = map[playerId];

    if (!entry || typeof entry !== "object") {
      delete map[playerId];
      continue;
    }

    const current = Number(entry.matchesLeft);

    if (!Number.isFinite(current) || current <= 1) {
      delete map[playerId];
      continue;
    }

    entry.matchesLeft = Math.floor(current - 1);

    if (entry.matchesLeft <= 0) {
      delete map[playerId];
    }
  }
}

// =========================
// 🔄 MATCHDAY UPDATE
// =========================
function decrementAvailability() {
  const availability = getAvailabilityState();
  if (!availability) return null;

  decrementMapEntries(availability.suspended);
  decrementMapEntries(availability.injured);

  return availability;
}

// =========================
// 📦 EXPORTS
// =========================
export {
  isPlayerSuspended,
  isPlayerInjured,
  isPlayerAvailable,
  addSuspension,
  addInjury,
  decrementAvailability
};
