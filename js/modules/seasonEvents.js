import { game } from "../core/state.js";

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function isUserTeamInList(teamList = []) {
  const userTeamId = normalize(game?.team?.selectedId);
  if (!userTeamId) return false;

  return teamList.some(
    (team) =>
      normalize(team) === userTeamId ||
      normalize(team?.id) === userTeamId ||
      normalize(team?.name) === userTeamId
  );
}

function getCurrentLeagueLevel() {
  const league = game?.league?.current;
  if (!league) return null;

  const level = Number(
    league.level ??
    league.tier ??
    league.division_level
  );

  return Number.isFinite(level)
    ? level
    : null;
}

export function buildSeasonOutcomeEvent(
  seasonResult,
) {
  if (!seasonResult) return null;

  const promoted =
    isUserTeamInList(
      seasonResult.promoted || [],
    );

  const relegated =
    isUserTeamInList(
      seasonResult.relegated || [],
    );

  const level =
    getCurrentLeagueLevel();

  // =========================
  // 🏆 PROMOTION
  // =========================
  if (promoted) {
    return {
      type: "SEASON_PROMOTION",
      text: `🏆 AUFSTIEG! Dein Team steigt in ${seasonResult.toLeague} auf!`,
      asset:
        "./assets/events/promotion.webp",
      gameOver: false,
    };
  }

  // =========================
  // 💀 GAME OVER
  // =========================
  if (
    relegated &&
    level !== null &&
    level >= 9
  ) {
    return {
      type: "GAME_OVER",
      text: "💀 Abstieg aus der Kreisliga A. Deine Trainerkarriere ist beendet.",
      asset:
        "./assets/events/gameover_relegation.webp",
      gameOver: true,
    };
  }

  // =========================
  // 📉 STANDARD RELEGATION
  // =========================
  if (relegated) {
    return {
      type: "SEASON_RELEGATION",
      text: `📉 Abstieg... Dein Team spielt nächste Saison in ${seasonResult.toLeague}.`,
      asset:
        "./assets/events/relegation.webp",
      gameOver: false,
    };
  }

  // =========================
  // 📅 NORMALER SAISONRESET
  // =========================
  return {
    type: "SEASON_RESET",
    text: `📅 Neue Saison gestartet: ${seasonResult.toLeague}`,
    asset:
      "./assets/events/newseason.webp",
    gameOver: false,
  };
}
