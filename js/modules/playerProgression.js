import { game } from "../core/state.js";

// =========================
// ⚙️ CONFIG
// =========================
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 60,
  gold: 75,
  elite: 85
};

// =========================
// 🧠 HELPERS
// =========================
function clamp(value, min = 1, max = 99) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeTier(overall) {
  if (overall >= TIER_THRESHOLDS.elite) return "elite";
  if (overall >= TIER_THRESHOLDS.gold) return "gold";
  if (overall >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

function getPlayerPeakModifier(age) {
  const a = Number(age) || 20;

  if (a <= 21) return 1.45;
  if (a <= 24) return 1.25;
  if (a <= 28) return 1.0;
  if (a <= 31) return 0.65;
  if (a <= 34) return 0.3;

  return -0.4;
}

function getLeagueModifier() {
  const level = Number(game?.league?.current?.level) || 8;

  // niedrigere Zahl = höhere Liga
  if (level <= 2) return 1.3;
  if (level <= 4) return 1.15;
  if (level <= 6) return 1.0;
  if (level <= 8) return 0.9;

  return 0.8;
}

function getPotential(player) {
  if (Number.isFinite(Number(player?.potential))) {
    return clamp(player.potential, 40, 99);
  }

  const base = clamp((player?.overall || 50) + Math.floor(Math.random() * 15));
  player.potential = base;

  return base;
}

function ensureCareerState(player) {
  if (!player.seasonStats || typeof player.seasonStats !== "object") {
    player.seasonStats = {};
  }

  if (!Number.isFinite(Number(player.careerLevel))) {
    player.careerLevel = 1;
  }

  if (!Number.isFinite(Number(player.marketValue))) {
    player.marketValue = calculateMarketValue(player);
  }

  if (!player.tier) {
    player.tier = normalizeTier(player.overall || 50);
  }

  getPotential(player);
}

// =========================
// 💰 MARKET VALUE
// =========================
export function calculateMarketValue(player) {
  if (!player) return 0;

  const overall = Number(player.overall) || 50;
  const age = Number(player.age) || 20;
  const potential = getPotential(player);

  let ageFactor = 1.0;

  if (age <= 21) ageFactor = 1.45;
  else if (age <= 25) ageFactor = 1.25;
  else if (age <= 29) ageFactor = 1.0;
  else if (age <= 32) ageFactor = 0.75;
  else ageFactor = 0.5;

  const tierFactor =
    player.tier === "elite"
      ? 2.2
      : player.tier === "gold"
        ? 1.6
        : player.tier === "silver"
          ? 1.2
          : 0.9;

  return Math.round(
    (overall * overall * 120) *
    ageFactor *
    tierFactor *
    (potential / 75)
  );
}

// =========================
// 📈 ATTRIBUTE PROGRESSION
// =========================
function improveStat(player, key, amount, potentialCap) {
  if (!key) return;

  const current = Number(player[key]) || Number(player.overall) || 50;

  if (current >= potentialCap) return;

  player[key] = clamp(current + amount, 1, potentialCap);
}

function regressStat(player, key, amount) {
  if (!key) return;

  const current = Number(player[key]) || Number(player.overall) || 50;

  player[key] = clamp(current - amount);
}

function getProgressionProfile(player) {
  const pos = String(player.position_type || player.position || "MID").toUpperCase();

  if (pos.includes("GK")) {
    return ["goalkeeping", "reflexes", "reaction"];
  }

  if (pos.includes("DEF")) {
    return ["defending", "physical", "stamina"];
  }

  if (pos.includes("ST") || pos.includes("ATT")) {
    return ["shooting", "pace", "dribbling"];
  }

  return ["passing", "stamina", "dribbling"];
}

// =========================
// 🚀 SINGLE PLAYER
// =========================
export function progressPlayer(player, context = {}) {
  if (!player || typeof player !== "object") return player;

  ensureCareerState(player);

  const potential = getPotential(player);
  const age = Number(player.age) || 20;

  const ageMod = getPlayerPeakModifier(age);
  const leagueMod = getLeagueModifier();

  let boost = ageMod * leagueMod;

  if (context.promoted) boost += 0.35;
  if (context.relegated) boost -= 0.25;
  if (context.champion) boost += 0.2;

  const profile = getProgressionProfile(player);

  // =========================
  // 📈 GROWTH
  // =========================
  if (boost > 0) {
    profile.forEach((stat) => {
      const gain = Math.random() * boost * 2;
      improveStat(player, stat, gain, potential);
    });
  }

  // =========================
  // 📉 DECLINE
  // =========================
  if (boost < 0) {
    profile.forEach((stat) => {
      regressStat(player, stat, Math.abs(boost));
    });
  }

  // =========================
  // 🎂 AGE
  // =========================
  player.age = age + 1;

  // =========================
  // 🧠 OVERALL RECALC
  // =========================
  const relevantStats = profile.map((k) => Number(player[k]) || 50);

  player.overall = clamp(
    relevantStats.reduce((a, b) => a + b, 0) / relevantStats.length
  );

  // =========================
  // 🏅 TIER
  // =========================
  player.tier = normalizeTier(player.overall);

  // =========================
  // 💰 VALUE
  // =========================
  player.marketValue = calculateMarketValue(player);

  // =========================
  // 🧬 CAREER LEVEL
  // =========================
  player.careerLevel += player.overall >= 75 ? 2 : 1;

  return player;
}

// =========================
// 🏆 TEAM / SEASON
// =========================
export function processPlayerProgression(context = {}) {
  const leagues = game?.league?.available || game?.leagues || [];

  leagues.forEach((league) => {
    if (!league?.teams?.length) return;

    league.teams.forEach((team) => {
      if (!team?.players?.length) return;

      const isUserTeam =
        String(team.id) === String(game?.team?.selectedId);

      team.players.forEach((player) => {
        progressPlayer(player, {
          ...context,
          userTeam: isUserTeam
        });
      });
    });
  });

  return true;
}

// =========================
// 💸 MANAGER PREP
// =========================
export function ensureManagerState() {
  game.manager = game.manager || {};

  const leagueLevel = Number(
    game.league?.current?.level ||
    game.league?.current?.tier ||
    9
  );

  // =========================
  // 💰 REALISTISCHE STARTBUDGETS
  // =========================
  const baseBudgets = {
    1: 50000000, // Bundesliga
    2: 15000000, // 2. Bundesliga
    3: 5000000,  // 3. Liga
    4: 1500000,  // Regionalliga
    5: 750000,   // Oberliga
    6: 300000,   // Verbandsliga
    7: 120000,   // Landesliga
    8: 50000,    // Bezirksliga
    9: 15000     // Kreisliga A
  };

  const startBudget = baseBudgets[leagueLevel] || 10000;

  // =========================
  // 🏦 BUDGET
  // =========================
  if (typeof game.manager.budget !== "number") {
    game.manager.budget = startBudget;
  }

  // =========================
  // 💸 TRANSFERBUDGET
  // =========================
  if (typeof game.manager.transferBudget !== "number") {
    game.manager.transferBudget = Math.floor(game.manager.budget * 0.35);
  }

  // =========================
  // 💼 GEHALTSBUDGET
  // =========================
  if (typeof game.manager.wageBudget !== "number") {
    game.manager.wageBudget = Math.floor(game.manager.budget * 0.25);
  }

  // =========================
  // ⭐ REPUTATION
  // =========================
  if (typeof game.manager.reputation !== "number") {
    game.manager.reputation = Math.max(1, 11 - leagueLevel);
  }

  // =========================
  // 👥 KADERWERT
  // =========================
  if (typeof game.manager.squadValue !== "number") {
    game.manager.squadValue = 0;
  }

  // =========================
  // 📚 HISTORY
  // =========================
  if (!Array.isArray(game.manager.transferHistory)) {
    game.manager.transferHistory = [];
  }

  if (!Array.isArray(game.manager.financeHistory)) {
    game.manager.financeHistory = [];
  }

  // =========================
  // 🏟 OPTIONAL FUTURE SYSTEMS
  // =========================
  if (!game.manager.club) {
    game.manager.club = {
      stadiumLevel: 1,
      fanBase: 100,
      youthLevel: 1
    };
  }

  return game.manager;
}
