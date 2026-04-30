import { game } from "../core/state.js";

// =========================
// 💰 BASE BUDGETS BY LEAGUE LEVEL
// =========================
const LEAGUE_BUDGETS = {
  9: 50000,        // Kreisliga A
  8: 120000,       // Bezirksliga
  7: 300000,       // Landesliga
  6: 650000,       // Verbandsliga
  5: 1500000,      // Oberliga
  4: 4000000,      // Regionalliga
  3: 10000000,     // 3. Liga
  2: 30000000,     // 2. Bundesliga
  1: 90000000      // Bundesliga
};

// =========================
// 🧠 HELPERS
// =========================
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getLeagueLevel() {
  return Number(game?.league?.current?.level) || 9;
}

function getBaseBudget(level) {
  return LEAGUE_BUDGETS[level] || 50000;
}

function ensureManager() {
  if (!game.manager || typeof game.manager !== "object") {
    game.manager = {
      budget: 0,
      wageBudget: 0,
      transferBudget: 0,
      reputation: 1,
      sponsorLevel: 1,
      history: []
    };
  }

  return game.manager;
}

export function recalculateSquadValue() {
  const manager = ensureManager();

  const selectedId = String(game.team?.selectedId || "");
  if (!selectedId) {
    manager.squadValue = 0;
    return 0;
  }

  const leagues = game?.league?.available || game?.leagues || [];
  let squadValue = 0;

  for (const league of leagues) {
    if (!league?.teams?.length) continue;

    const team = league.teams.find(
      (t) => String(t.id) === selectedId
    );

    if (!team?.players?.length) continue;

    squadValue = team.players.reduce((sum, player) => {
      return sum + (Number(player.marketValue) || 0);
    }, 0);

    break;
  }

  manager.squadValue = Math.round(squadValue);

  return manager.squadValue;
}

// =========================
// 📈 REPUTATION
// =========================
function adjustReputation(result) {
  const manager = ensureManager();

  if (result?.promoted?.includes(game.team?.selectedId)) {
    manager.reputation += 2;
  } else if (result?.relegated?.includes(game.team?.selectedId)) {
    manager.reputation -= 2;
  } else {
    manager.reputation += 0.5;
  }

  manager.reputation = clamp(manager.reputation, 1, 100);
}

// =========================
// 🤝 SPONSOR GROWTH
// =========================
function adjustSponsorLevel() {
  const manager = ensureManager();

  manager.sponsorLevel = clamp(
    1 + Math.floor(manager.reputation / 10),
    1,
    10
  );
}

// =========================
// 💸 MAIN BUDGET SYSTEM
// =========================
export function applySeasonBudget(seasonResult = {}) {
  const manager = ensureManager();

  const level = getLeagueLevel();
  const baseBudget = getBaseBudget(level);

  let multiplier = 1.0;

  const selectedId = game.team?.selectedId;

  const promoted = seasonResult?.promoted?.includes(selectedId);
  const relegated = seasonResult?.relegated?.includes(selectedId);

  // =========================
  // 🏆 PERFORMANCE MODIFIERS
  // =========================
  if (promoted) {
    multiplier += 0.35;
  } else if (relegated) {
    multiplier -= 0.25;
  } else {
    multiplier += 0.08;
  }

  // =========================
  // 📈 REPUTATION + SPONSORS
  // =========================
  adjustReputation(seasonResult);
  adjustSponsorLevel();

  const repBoost = 1 + (manager.reputation * 0.015);
  const sponsorBoost = 1 + (manager.sponsorLevel * 0.05);

  // =========================
  // 💰 FINAL CALC
  // =========================
  const seasonIncome = Math.round(
    baseBudget *
    multiplier *
    repBoost *
    sponsorBoost
  );

  manager.budget += seasonIncome;

  // =========================
  // 💵 SUB-BUDGETS
  // =========================
  manager.transferBudget = Math.round(manager.budget * 0.35);
  manager.wageBudget = Math.round(manager.budget * 0.25);

  // =========================
  // 📜 HISTORY
  // =========================
  manager.history.push({
    season: game?.season?.year || 1,
    leagueLevel: level,
    income: seasonIncome,
    totalBudget: manager.budget,
    promoted,
    relegated,
    reputation: manager.reputation,
    sponsorLevel: manager.sponsorLevel
  });


  recalculateSquadValue();
  return {
    seasonIncome,
    totalBudget: manager.budget,
    transferBudget: manager.transferBudget,
    wageBudget: manager.wageBudget,
    reputation: manager.reputation,
    sponsorLevel: manager.sponsorLevel
  };
}
