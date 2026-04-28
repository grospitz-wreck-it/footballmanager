import { game } from "../core/state.js";

const TOP_COUNT = 2;
const BOTTOM_COUNT = 2;

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getAllLeagues() {
  const fromAvailable = toArray(game?.league?.available);
  if (fromAvailable.length) return fromAvailable;

  const fromLeagues = toArray(game?.leagues);
  if (fromLeagues.length) return fromLeagues;

  return toArray(game?.data?.leagues);
}

function getLeagueLevel(league) {
  const level = Number(
    league?.level ??
    league?.tier ??
    league?.division_level
  );

  return Number.isFinite(level) ? level : null;
}

// =========================
// 📊 TABLE SORT
// =========================
function rankTeams(league, source = "table") {
  const teams = toArray(
    source === "teams"
      ? league?.teams
      : league?.table
  );

  if (!teams.length && source !== "teams") {
    return rankTeams(league, "teams");
  }

  return [...teams].sort((a, b) => {
    const pointDiff =
      (Number(b?.points) || 0) -
      (Number(a?.points) || 0);

    if (pointDiff !== 0) return pointDiff;

    const gdA =
      (Number(a?.goalsFor) || 0) -
      (Number(a?.goalsAgainst) || 0);

    const gdB =
      (Number(b?.goalsFor) || 0) -
      (Number(b?.goalsAgainst) || 0);

    const gdDiff = gdB - gdA;
    if (gdDiff !== 0) return gdDiff;

    const gfDiff =
      (Number(b?.goalsFor) || 0) -
      (Number(a?.goalsFor) || 0);

    if (gfDiff !== 0) return gfDiff;

    return String(a?.name || a?.id || "")
      .localeCompare(String(b?.name || b?.id || ""));
  });
}

function takeTop(league, count) {
  return rankTeams(league).slice(
    0,
    Math.max(0, count),
  );
}

function takeBottom(league, count) {
  const ranked = rankTeams(league);

  return ranked.slice(
    Math.max(0, ranked.length - Math.max(0, count)),
  );
}

// =========================
// 🏗 TEAM MANAGEMENT
// =========================
function assignTeamLeague(team, league) {
  if (!team || !league) return;

  // 🔥 Historie Vorbereitung
  team.lastSeasonLeagueId =
    team.league_id ||
    team.competition_id ||
    null;

  const leagueId =
    league?.id ??
    league?.league_id ??
    null;

  if (leagueId !== null) {
    team.competition_id = leagueId;
    team.league_id = leagueId;
  }

  if (league?.region_id !== undefined) {
    team.region_id = league.region_id;
  }

  if (league?.country_id !== undefined) {
    team.country_id = league.country_id;
  }
}

function replaceTeams(league, outgoing, incoming) {
  if (!league || !Array.isArray(league.teams)) return;

  const outgoingIds = new Set(
    outgoing.map((team) =>
      normalizeId(team?.id),
    ),
  );

  const nextTeams = league.teams.filter(
    (team) =>
      !outgoingIds.has(
        normalizeId(team?.id),
      ),
  );

  incoming.forEach((team) => {
    if (!team) return;
    nextTeams.push(team);
  });

  league.teams = nextTeams;

  // =========================
  // 📊 TABLE RESET
  // =========================
  if (Array.isArray(league.table)) {
    const nextTable = league.table.filter(
      (team) =>
        !outgoingIds.has(
          normalizeId(team?.id),
        ),
    );

    incoming.forEach((team) => {
      if (!team) return;

      nextTable.push({
        id: team.id,
        name: team.name,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        strength: team.strength || 50,
      });
    });

    league.table = nextTable;
  }
}

function swapBetweenLeagues(
  primaryLeague,
  secondaryLeague,
  outgoingFromPrimary,
  outgoingFromSecondary,
) {
  if (!primaryLeague || !secondaryLeague) return;

  if (
    !outgoingFromPrimary.length ||
    !outgoingFromSecondary.length
  ) {
    return;
  }

  outgoingFromPrimary.forEach((team) =>
    assignTeamLeague(team, secondaryLeague),
  );

  outgoingFromSecondary.forEach((team) =>
    assignTeamLeague(team, primaryLeague),
  );

  replaceTeams(
    primaryLeague,
    outgoingFromPrimary,
    outgoingFromSecondary,
  );

  replaceTeams(
    secondaryLeague,
    outgoingFromSecondary,
    outgoingFromPrimary,
  );
}

// =========================
// 👤 USER TEAM SYNC
// =========================
function syncUserTeamLeague() {
  const selectedId = normalizeId(
    game?.team?.selectedId,
  );

  if (!selectedId) return;

  const leagues = getAllLeagues();

  const nextLeague = leagues.find(
    (league) =>
      toArray(league?.teams).some(
        (team) =>
          normalizeId(team?.id) ===
          selectedId,
      ),
  );

  if (!nextLeague) return;

  game.league = game.league || {};
  game.league.current = nextLeague;
}

// =========================
// 🔍 LEAGUE FINDER
// =========================
export function getAdjacentLeague(
  currentLeague,
  direction,
) {
  if (!currentLeague || !direction) {
    return null;
  }

  const leagues = getAllLeagues();
  if (!leagues.length) return null;

  const currentLevel =
    getLeagueLevel(currentLeague);

  if (currentLevel === null) {
    return null;
  }

  const dir =
    String(direction).toLowerCase();

  const delta =
    dir === "up" ||
    dir === "promotion"
      ? -1
      : dir === "down" ||
          dir === "relegation"
        ? 1
        : 0;

  if (!delta) return null;

  const targetLevel =
    currentLevel + delta;

  let candidates = leagues.filter(
    (league) =>
      getLeagueLevel(league) ===
      targetLevel,
  );

  // 🔥 REGION FIRST
  if (currentLeague.region_id) {
    const regional = candidates.filter(
      (league) =>
        normalizeId(
          league.region_id,
        ) ===
        normalizeId(
          currentLeague.region_id,
        ),
    );

    if (regional.length) {
      candidates = regional;
    }
  }

  // 🔥 COUNTRY FALLBACK
  if (
    candidates.length > 1 &&
    currentLeague.country_id
  ) {
    const national = candidates.filter(
      (league) =>
        normalizeId(
          league.country_id,
        ) ===
        normalizeId(
          currentLeague.country_id,
        ),
    );

    if (national.length) {
      candidates = national;
    }
  }

  return candidates[0] || null;
}

// =========================
// 🏆 MAIN PROCESS
// =========================
export function processPromotionRelegation() {
  const currentLeague =
    game?.league?.current;

  if (
    !currentLeague ||
    !Array.isArray(currentLeague.teams) ||
    currentLeague.teams.length < 4
  ) {
    return null;
  }

  const upperLeague =
    getAdjacentLeague(
      currentLeague,
      "up",
    );

  const lowerLeague =
    getAdjacentLeague(
      currentLeague,
      "down",
    );

  const promotedFromCurrent =
    upperLeague
      ? takeTop(
          currentLeague,
          TOP_COUNT,
        )
      : [];

  const relegatedFromUpper =
    upperLeague
      ? takeBottom(
          upperLeague,
          BOTTOM_COUNT,
        )
      : [];

  const relegatedFromCurrent =
    lowerLeague
      ? takeBottom(
          currentLeague,
          BOTTOM_COUNT,
        )
      : [];

  const promotedFromLower =
    lowerLeague
      ? takeTop(
          lowerLeague,
          TOP_COUNT,
        )
      : [];

  // 🔥 AUFSTIEG
  if (upperLeague) {
    swapBetweenLeagues(
      currentLeague,
      upperLeague,
      promotedFromCurrent,
      relegatedFromUpper,
    );
  }

  // 🔥 ABSTIEG
  if (lowerLeague) {
    swapBetweenLeagues(
      currentLeague,
      lowerLeague,
      relegatedFromCurrent,
      promotedFromLower,
    );
  }

  // 🔄 USER TEAM RESYNC
  syncUserTeamLeague();

  return {
    season:
      game?.season?.year || null,

    fromLeague:
      currentLeague?.name || null,

    toLeague:
      game?.league?.current?.name ||
      currentLeague?.name,

    promoted:
      promotedFromCurrent
        .map(
          (team) =>
            team?.name ||
            team?.id,
        )
        .filter(Boolean),

    relegated:
      relegatedFromCurrent
        .map(
          (team) =>
            team?.name ||
            team?.id,
        )
        .filter(Boolean),

    swappedWithUpper:
      relegatedFromUpper
        .map(
          (team) =>
            team?.name ||
            team?.id,
        )
        .filter(Boolean),

    swappedWithLower:
      promotedFromLower
        .map(
          (team) =>
            team?.name ||
            team?.id,
        )
        .filter(Boolean),
  };
}
