import { game } from "../core/state.js";
import { processPromotionRelegation } from "./promotion.js";
import { buildSeasonOutcomeEvent } from "./seasonEvents.js";

function resetLeagueTable(league) {
  if (!league?.table?.length) return;

  league.table.forEach((team) => {
    team.played = 0;
    team.points = 0;
    team.goalsFor = 0;
    team.goalsAgainst = 0;
  });
}

function processPlayerProgression() {
  // 🔥 PHASE 2+
  // Spielerentwicklung / Marktwert / Tier-Upgrades
  return;
}

function processClubFinances() {
  // 🔥 PHASE 3+
  // Budget / Sponsoring / Preisgelder
  return;
}

export function processSeasonTransition() {
  const league = game.league?.current;

  if (!league) return null;

  // =========================
  // 🏆 PROMOTION / RELEGATION
  // =========================
  const seasonResult = processPromotionRelegation();
  const specialEvent = buildSeasonOutcomeEvent(seasonResult);

  if (specialEvent) {
    game.events = game.events || {};
    game.events.history = game.events.history || [];

    game.events.history.push({
      id: crypto.randomUUID(),
      minute: 0,
      ...specialEvent,
    });

    // 🔥 UI SUMMARY
    game.ui = game.ui || {};
    game.ui.seasonSummary = seasonResult;

    // 💀 GAME OVER FLAG
    if (specialEvent.gameOver) {
      game.phase = "gameover";
    }
  }
  // =========================
  // 📈 PLAYER DEVELOPMENT (HOOK)
  // =========================
  processPlayerProgression();

  // =========================
  // 💰 FINANCES (HOOK)
  // =========================
  processClubFinances();

  // =========================
  // 📊 RESET TABLE
  // =========================
  resetLeagueTable(game.league.current);

  // =========================
  // 📅 RESET ROUND
  // =========================
  game.league.current.currentRound = 0;

  // =========================
  // 📆 NEXT YEAR
  // =========================
  game.season.year++;

  return seasonResult;
}
