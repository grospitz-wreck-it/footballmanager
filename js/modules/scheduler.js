// =========================
// 📅 SPIELPLAN GENERIEREN (FINAL CLEAN FIXED)
// =========================
import { game } from "../core/state.js";
import { decrementAvailability } from "../modules/playerAvailability.js";
// =========================
// 🧠 ID HELPERS
// =========================
function normalizeId(val) {
  if (val === null || val === undefined) return null;
  return String(val);
}

function resolveTeamId(team) {
  if (!team) return null;

  if (typeof team === "number") return normalizeId(team);

  if (typeof team === "object") {
    return normalizeId(team.id);
  }

  return null;
}

// =========================
// 🧠 HELPERS (UI)
// =========================
function getTeamName(teamOrId) {
  if (!teamOrId) return "Unbekannt";

  const id = typeof teamOrId === "object" ? teamOrId.id : teamOrId;

  const league = game.league?.current;

  if (!league?.teams) return "Unbekannt";

  const team = league.teams.find((t) => String(t.id) === String(id));

  return team?.name ?? team?.Name ?? "Unbekannt";
}
function hydrateMatchTeams(match) {
  const league = game.league?.current;
  if (!league) return match;

  match.home =
    league.teams.find((t) => String(t.id) === String(match.homeTeamId)) || null;

  match.away =
    league.teams.find((t) => String(t.id) === String(match.awayTeamId)) || null;

  return match;
}

// =========================
// 📅 GENERATE SCHEDULE
// =========================
function generateSchedule(league) {
  if (!league || !Array.isArray(league.teams) || league.teams.length < 2) {
    console.error("❌ Ungültige Liga / zu wenig Teams");
    return null;
  }

  // 🔥 Schedule behalten nur wenn Teamzahl identisch
  if (
    league.schedule &&
    league.schedule.length > 0 &&
    league._teamCount === league.teams.length
  ) {
    console.log("ℹ️ Spielplan existiert bereits");
    return league.schedule;
  }

  // =========================
  // 🧠 TEAMS NORMALIZEN
  // =========================
  const seen = new Set();
  let teams = [];

  league.teams.forEach((t) => {
    const id = t?.id ? String(t.id) : null;

    if (!id) {
      console.error("❌ Team ohne ID:", t);
      return;
    }

    if (seen.has(id)) {
      console.warn("⚠️ Duplicate Team ID:", id);
      return;
    }

    seen.add(id);
    teams.push(t);
  });

  if (teams.length < 2) {
    console.error("❌ Zu wenig gültige Teams");
    return null;
  }

  console.log("✅ Validierte Teams:", teams.length);

  // =========================
  // 🔁 BYE
  // =========================
  if (teams.length % 2 !== 0) {
    teams.push({ id: "BYE", name: "BYE" });
  }

  const effectiveTeamCount = teams.filter((t) => t.id !== "BYE").length;

  const totalRounds = teams.length - 1;
  const half = teams.length / 2;

  const rounds = [];
  let rotation = [...teams];

  // =========================
  // ⚖️ HOME/AWAY BALANCE (NEU)
  // =========================
  const homeAwayBalance = {};

  function getBalance(id) {
    return homeAwayBalance[id] || 0;
  }

  function updateBalance(home, away) {
    homeAwayBalance[home] = getBalance(home) + 1;
    homeAwayBalance[away] = getBalance(away) - 1;
  }

  // =========================
  // 🔥 HINRUNDE
  // =========================
  for (let r = 0; r < totalRounds; r++) {
    const round = [];

    for (let i = 0; i < half; i++) {
      const teamA = rotation[i];
      const teamB = rotation[rotation.length - 1 - i];

      let home = teamA;
      let away = teamB;

      // 🔥 Balance prüfen
      const balanceA = getBalance(teamA.id);
      const balanceB = getBalance(teamB.id);

      // 👉 Team mit mehr Heimspielen wird Auswärts
      if (balanceA > balanceB) {
        home = teamB;
        away = teamA;
      }

      updateBalance(home.id, away.id);

      if (home.id === "BYE" || away.id === "BYE") continue;

      round.push({
        id: crypto.randomUUID(),
        homeTeamId: String(home.id),
        awayTeamId: String(away.id),

        // 🔥 FIX: KEINE TEAM OBJEKTE MEHR
        home: null,
        away: null,

        result: null,
        _processed: false,
      });
    }

    rounds.push(round);

    const fixed = rotation[0];
    const rest = rotation.slice(1);

    rest.unshift(rest.pop());
    rotation = [fixed, ...rest];
  }

  // =========================
  // 🔁 RÜCKRUNDE
  // =========================
  const returnRounds = rounds.map((round) => {
    const newRound = round.map((match) => {
      return {
        id: crypto.randomUUID(),
        homeTeamId: String(match.awayTeamId),
        awayTeamId: String(match.homeTeamId),

        // 🔥 FIX: KEINE FAKE TEAMS
        home: null,
        away: null,

        result: null,
        _processed: false,
      };
    });

    return newRound;
  });

  // =========================
  // 📊 FINAL
  // =========================
  league.schedule = [...rounds, ...returnRounds];

  league.schedule.forEach((r) => {
    r._simulated = false;
  });

  league.currentRound = 0;
  league.currentMatchIndex = 0;
  league._teamCount = league.teams.length;

  console.log("✅ Spielplan erstellt:", league.schedule.length);

  return league.schedule;
}

// =========================
// 🧪 VALIDATION
// =========================
function validateSchedule(expectedTeamCount) {
  const schedule = game.league.current?.schedule;
  if (!schedule?.length) return;

  const firstRound = schedule[0];

  const teams = [];

  firstRound.forEach((match) => {
    teams.push(normalizeId(match.homeTeamId));
    teams.push(normalizeId(match.awayTeamId));
  });

  const unique = new Set(teams);
  const expectedMatches = Math.floor(expectedTeamCount / 2);

  if (teams.length !== unique.size) {
    console.error("❌ DUPLIKATE IM SPIELTAG!");
  }

  if (firstRound.length !== expectedMatches) {
    console.error("❌ Falsche Spielanzahl:", firstRound.length);
  }
}

// =========================
// 🎯 MATCHDAY SIMULATION (HIER EINFÜGEN)
// =========================

function simulateMatchFast(match) {
  const homeGoals = Math.floor(Math.random() * 5);
  const awayGoals = Math.floor(Math.random() * 5);

  match.result = {
    home: homeGoals,
    away: awayGoals,
  };

  match._processed = true;

  updateTable(match.homeTeamId, match.awayTeamId, homeGoals, awayGoals);
}

// =========================
// 📊 TABLE UPDATE
// =========================
function updateTable(homeId, awayId, homeGoals, awayGoals) {
  const table = game.league?.current?.table;
  if (!table) return;

  const home = table.find(
    (t) => String(t.id) === String(homeId),
  );

  const away = table.find(
    (t) => String(t.id) === String(awayId),
  );

  if (!home || !away) return;

  // =========================
  // 📊 MATCHDAY COUNT
  // Jedes Match zählt separat
  // =========================
  home.played++;
  away.played++;

  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;

  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    home.points += 3;
    home.wins++;
    away.losses++;
  }

  else if (awayGoals > homeGoals) {
    away.points += 3;
    away.wins++;
    home.losses++;
  }

  else {
    home.points++;
    away.points++;

    home.draws++;
    away.draws++;
  }
}

// =========================
// 🎯 SIMULATE MATCHDAY
// =========================
function simulateMatchday() {
  const league = game.league?.current;
  if (!league) return;

  const roundIndex = league.currentRound ?? 0;
  const round = league.schedule?.[roundIndex];
  if (!round) return;

  const myTeamId = String(game.team?.selectedId || "");

  round.forEach((match) => {
    const isMyMatch =
      myTeamId &&
      (String(match.homeTeamId) === myTeamId ||
        String(match.awayTeamId) === myTeamId);

    if (isMyMatch) return;
    if (match._processed) return;

    simulateMatchFast(match);
  });

  console.log("⚡ Spieltag simuliert (AI Matches)");
}

// =========================
// ⚡ LIVE SIMULATION ANDERE MATCHES
// =========================
function simulateLiveMatchMinute(round, minute) {
  if (!round?.length) return;

  const myTeamId = String(game.team?.selectedId || game.team?.id || "");

  round.forEach((match) => {
    if (!match) return;

    const isMyMatch =
      String(match.homeTeamId) === myTeamId ||
      String(match.awayTeamId) === myTeamId;

    if (isMyMatch) return;

    // =========================
    // 🟢 INIT
    // =========================
   if (
  match.homeGoals === undefined ||
  match.awayGoals === undefined
) {
  match.live = true;
  match.finished = false;
  match.status = "LIVE";

  match.homeGoals = 0;
  match.awayGoals = 0;

  return;
}

    // =========================
    // ⚽ DYNAMISCHE SPIELSIMULATION
    // Alle 5 Minuten
    // =========================
    if (minute > 0 && minute < 90 && minute % 5 === 0) {
      const homeStrength = getTeamDataById(match.homeTeamId)?.strength || 60;
      const awayStrength = getTeamDataById(match.awayTeamId)?.strength || 60;

      const strengthDiff = homeStrength - awayStrength;

      const homeChance =
        0.04 +
        homeStrength / 1800 +
        Math.max(0, strengthDiff) / 2500;

      const awayChance =
        0.04 +
        awayStrength / 1850 +
        Math.max(0, -strengthDiff) / 2600;

      if (Math.random() < homeChance) {
        match.homeGoals++;
      }

      if (Math.random() < awayChance) {
        match.awayGoals++;
      }

      if (minute < 45) {
        match.status = "LIVE";
      } else {
        match.status = "2H";
      }
    }

    // =========================
    // ⏸ HALBZEIT
    // =========================
    if (minute === 45) {
      match.status = "HT";
      return;
    }

    // =========================
    // 🏁 FULLTIME
    // =========================
    if (minute >= 90) {
      if (match.finished) return;

      match.finished = true;
      match.live = false;
      match.status = "FT";

      match.result = {
        home: match.homeGoals ?? 0,
        away: match.awayGoals ?? 0,
      };

      match._processed = true;
    }
  });
}

// =========================
// ▶️ NEXT MATCH
// =========================
function nextMatch() {
  const schedule = game.league?.current?.schedule;
  if (!schedule?.length) return null;

  const myTeamId = normalizeId(game.team?.selectedId);

  let fallback = null;

  for (let r = 0; r < schedule.length; r++) {
    for (let m = 0; m < schedule[r].length; m++) {
      const match = schedule[r][m];

      if (match._processed) continue;

      if (!fallback) {
        fallback = match;
      }

      if (
        normalizeId(match.homeTeamId) === myTeamId ||
        normalizeId(match.awayTeamId) === myTeamId
      ) {
        game.league.currentRound = r;
        game.league.currentMatchIndex = m;
        return hydrateMatchTeams(match); // 🔥 FIX
      }
    }
  }

  if (!fallback) {
    console.warn("⚠️ Keine offenen Matches mehr");
    return null;
  }

  return hydrateMatchTeams(fallback);
}

// =========================
// ⏭ ADVANCE
// =========================
function advanceSchedule() {
  const schedule = game.league?.current?.schedule;
  if (!schedule?.length) return;
  decrementAvailability();
  let r = game.league.currentRound ?? 0;
  let m = game.league.currentMatchIndex ?? 0;

  // 👉 nächstes Match
  m++;

  // 👉 nächster Spieltag
  if (m >= (schedule[r]?.length || 0)) {
    m = 0;
    r++;
  }

  // 👉 Saison Ende Guard
  if (r >= schedule.length) {
    console.log("🏁 Saison beendet");
    game.league.currentRound = schedule.length - 1;
    game.league.currentMatchIndex = 0;
    return;
  }

  // 👉 State setzen
  game.league.currentRound = r;
  game.league.currentMatchIndex = m;

  // 👉 UI SYNC (🔥 wichtig für deinen Swipe-View)
  if (typeof window !== "undefined") {
    window.scheduleViewIndex = r;
  }

  // 👉 optional Debug
  console.log("➡️ Advance:", {
    round: r,
    match: m,
  });
}

function isMyMatch(match) {
  const myTeamId = String(game.team?.selectedId || game.team?.id || "");

  return (
    String(match.homeTeamId) === myTeamId ||
    String(match.awayTeamId) === myTeamId
  );
}

// =========================
// 📅 RENDER
// =========================
function renderSchedule() {
  const container = document.getElementById("scheduleView");
  if (!container) return;

  const schedule = game.league?.current?.schedule;
  if (!schedule?.length) {
    container.innerHTML = "<p>Kein Spielplan vorhanden</p>";
    return;
  }

  // =========================
  // 📅 AKTUELLER SPIELTAG SYNC
  // =========================
  const activeRound = Number(game.league?.currentRound ?? 0);

  // 🔥 Immer mit Saisonfortschritt synchronisieren
  if (
    typeof window.scheduleViewIndex !== "number" ||
    window.scheduleViewIndex < activeRound
  ) {
    window.scheduleViewIndex = activeRound;
  }

  // 🔒 Clamp
  window.scheduleViewIndex = Math.max(
    0,
    Math.min(window.scheduleViewIndex, schedule.length - 1),
  );

  const selectedRound = window.scheduleViewIndex;
  const round = schedule[selectedRound];

  if (!round?.length) {
    container.innerHTML = "<p>Kein Spieltag verfügbar</p>";
    return;
  }

  // =========================
  // 📦 HEADER
  // =========================
  let html = `
    <div class="schedule-card">
      <div class="schedule-header">
        <button class="prev-day" ${
          selectedRound <= 0 ? "disabled" : ""
        }>‹</button>

        <h3>${
          selectedRound === activeRound
            ? `Aktueller Spieltag ${activeRound + 1}`
            : `Spieltag ${selectedRound + 1}`
        }</h3>

        <button class="next-day" ${
          selectedRound >= schedule.length - 1 ? "disabled" : ""
        }>›</button>
      </div>

      <div class="schedule-list">
  `;

  // =========================
  // ⚽ MATCH LIST
  // =========================
  round.forEach((match, mIndex) => {
    if (!match) return;

    const isUserMatch = isMyMatch(match);

    const isCurrent =
      selectedRound === activeRound &&
      mIndex === (game.league?.currentMatchIndex ?? 0);

    const matchClasses = [
      "match",
      isUserMatch ? "my-match" : "",
      isCurrent ? "current" : "",
      match.finished ? "finished" : "",
      match.live ? "live" : "",
    ]
      .filter(Boolean)
      .join(" ");

    // =========================
    // 🎯 SCORE / STATUS
    // =========================
    let centerDisplay = `<span class="vs">vs</span>`;

    if (match.live && !match.finished) {
      centerDisplay = `
        <span class="live-score">
          ${match.homeGoals ?? 0}:${match.awayGoals ?? 0}
          <small>${match.status || "LIVE"}</small>
        </span>
      `;
    }

    else if (
      match.finished ||
      match.result
    ) {
      const homeScore = match.result?.home ?? match.homeGoals ?? 0;
      const awayScore = match.result?.away ?? match.awayGoals ?? 0;

      centerDisplay = `
        <span class="score">
          ${homeScore}:${awayScore}
        </span>
      `;
    }

    html += `
      <div class="${matchClasses}" data-match-index="${mIndex}">
        <span class="home">${getTeamName(match.homeTeamId)}</span>
        ${centerDisplay}
        <span class="away">${getTeamName(match.awayTeamId)}</span>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  // =========================
  // 🎯 MATCH DETAILS
  // =========================
  container.querySelectorAll(".match").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = Number(el.dataset.matchIndex);
      const selectedMatch = round[idx];

      if (selectedMatch) {
        openMatchDetail(selectedMatch);
      }
    });
  });

  // =========================
  // ◀ NAVIGATION
  // =========================
  const prevBtn = container.querySelector(".prev-day");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (window.scheduleViewIndex > 0) {
        window.scheduleViewIndex--;
        renderSchedule();
      }
    });
  }

  // =========================
  // ▶ NAVIGATION
  // =========================
  const nextBtn = container.querySelector(".next-day");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (window.scheduleViewIndex < schedule.length - 1) {
        window.scheduleViewIndex++;
        renderSchedule();
      }
    });
  }
}

// =========================
// 📅 MATCH DETAIL OVERLAY
// =========================

function getTeamDataById(teamId) {
  const league = game.league?.current;
  if (!league?.teams) {
    return {
      strength: 50,
      attack: 50,
      defense: 50,
      form: 50,
    };
  }

  const team = league.teams.find((t) => String(t.id) === String(teamId));

  if (!team) {
    return {
      strength: 50,
      attack: 50,
      defense: 50,
      form: 50,
    };
  }

  return {
    strength: team.strength || 50,
    attack: team.attack || team.strength || 50,
    defense: team.defense || team.strength || 50,
    form: team.form || team.strength || 50,
  };
}

function createStatRow(
  label,
  homeValue,
  awayValue,
  homeColor = "#3b82f6",
  awayColor = "#ef4444",
) {
  const total = homeValue + awayValue || 1;

  const homePercent = (homeValue / total) * 100;

  const awayPercent = (awayValue / total) * 100;

  return `
    <div class="match-stat-row">
      <div>${homeValue}</div>

      <div class="match-stat-bar">
        <div
          class="match-stat-home"
          style="
            width:${homePercent}%;
            background:${homeColor};
          "
        ></div>

        <div
          class="match-stat-away"
          style="
            width:${awayPercent}%;
            background:${awayColor};
          "
        ></div>
      </div>

      <div>${awayValue}</div>
    </div>

    <div class="match-stat-label">${label}</div>
  `;
}

function openMatchDetail(match) {
  const overlay = document.getElementById("matchDetailOverlay");
  const content = document.getElementById("matchDetailContent");

  if (!overlay || !content || !match) return;

  const homeName = getTeamName(match.homeTeamId);
  const awayName = getTeamName(match.awayTeamId);

  // 🔥 NEU:
  const homeData = getTeamDataById(match.homeTeamId);
  const awayData = getTeamDataById(match.awayTeamId);

  const myTeamId = String(game.team?.selectedId || "");

  const userColor = localStorage.getItem("userTeamColor") || "#22d3ee";

  const homeTeam = game.league.current.teams.find(
    (t) => String(t.id) === String(match.homeTeamId),
  );

  const awayTeam = game.league.current.teams.find(
    (t) => String(t.id) === String(match.awayTeamId),
  );

  const homeColor =
    String(match.homeTeamId) === myTeamId
      ? userColor
      : homeTeam?.color || "#888";

  const awayColor =
    String(match.awayTeamId) === myTeamId
      ? userColor
      : awayTeam?.color || "#888";

  content.innerHTML = `
    <div class="match-detail-header">
      <div class="match-detail-title">${homeName} vs ${awayName}</div>
      <div class="match-detail-sub">Teamvergleich</div>
    </div>

    <div class="match-detail-versus">
  <div class="match-team">
    <div class="match-team-name">${homeName}</div>
    <div class="match-team-rating">${homeData.strength}</div>
  </div>

  <div class="match-vs">VS</div>

  <div class="match-team">
    <div class="match-team-name">${awayName}</div>
    <div class="match-team-rating">${awayData.strength}</div>
  </div>
</div>

<div class="match-stats">
  ${createStatRow(
    "Gesamt",
    homeData.strength,
    awayData.strength,
    homeColor,
    awayColor,
  )}

  ${createStatRow(
    "Angriff",
    homeData.attack,
    awayData.attack,
    homeColor,
    awayColor,
  )}

  ${createStatRow(
    "Defensive",
    homeData.defense,
    awayData.defense,
    homeColor,
    awayColor,
  )}

  ${createStatRow("Form", homeData.form, awayData.form, homeColor, awayColor)}
</div>
  `;

  overlay.classList.remove("hidden");
}

function closeMatchDetail() {
  const overlay = document.getElementById("matchDetailOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");
}

function initMatchDetailOverlay() {
  const closeBtn = document.getElementById("closeMatchDetail");
  const backdrop = document.querySelector(".match-detail-backdrop");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMatchDetail);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMatchDetail);
  }
}

// =========================
// 📦 EXPORTS
// =========================
export {
  generateSchedule,
  nextMatch,
  advanceSchedule,
  renderSchedule,
  simulateMatchday,
  updateTable,
  simulateLiveMatchMinute,

  // 📅 MATCH DETAIL
  openMatchDetail,
  closeMatchDetail,
  initMatchDetailOverlay,
};
