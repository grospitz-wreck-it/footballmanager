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

  const home = table.find((t) => String(t.id) === String(homeId));
  const away = table.find((t) => String(t.id) === String(awayId));

  if (!home || !away) return;

  if (!home._counted) {
    home.played++;
    home._counted = true;
  }

  if (!away._counted) {
    away.played++;
    away._counted = true;
  }

  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;

  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    home.points += 3;
  } else if (awayGoals > homeGoals) {
    away.points += 3;
  } else {
    home.points += 1;
    away.points += 1;
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

    // =========================
    // 🎮 DEIN SPIEL:
    // Weiterhin echte Live-Simulation
    // =========================
    if (isMyMatch) return;

    // =========================
    // ⚽ FREMDMATCHES:
    // Nur grobe Statusupdates
    // =========================

    // INIT
    if (minute === 0) {
      match.live = true;
      match.status = "LIVE";
      return;
    }

    // HALBZEIT
    if (minute === 45) {
      match.status = "HT";
      return;
    }

    // ENDSTAND
    if (minute >= 90) {
      if (match.finished) return;

      match.finished = true;
      match.live = false;
      match.status = "FT";

      // 🔥 Einmalige Ergebnis-Simulation
      if (match.homeGoals === undefined || match.awayGoals === undefined) {
        const homeStrength = getTeamStrength(match.homeTeamId);
        const awayStrength = getTeamStrength(match.awayTeamId);

        const baseHome = Math.round(Math.random() * 2 + homeStrength / 40);
        const baseAway = Math.round(Math.random() * 2 + awayStrength / 45);

        match.homeGoals = Math.max(0, baseHome);
        match.awayGoals = Math.max(0, baseAway);
      }
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
  // 📅 HEADER + ROUND SYNC FIX (FULL DROP-IN)
  // Direkt in renderSchedule() ersetzen
  // =========================

  // 🔥 Echter aktiver Liga-Spieltag
  const activeRound = Number(game.league?.current?.currentRound ?? 0);

  // 🔥 View Index sauber initialisieren
  if (typeof window.scheduleViewIndex !== "number") {
    window.scheduleViewIndex = activeRound;
  }

  // 🔥 Safety Clamp
  window.scheduleViewIndex = Math.max(
    0,
    Math.min(window.scheduleViewIndex, schedule.length - 1),
  );

  let selectedRound = window.scheduleViewIndex;
  const round = schedule[selectedRound];
  if (!round) return;
  // =========================
  // 📦 HTML BUILD
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

  round.forEach((match, mIndex) => {
    const isUserMatch = isMyMatch(match);

    const isCurrent =
      selectedRound === game.league.currentRound &&
      mIndex === game.league.currentMatchIndex;

    const matchClasses = [
      "match",
      isUserMatch ? "active my-match" : "",
      isCurrent ? "current" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const centerDisplay = match.result
      ? `<span class="score">${match.result.home}:${match.result.away}</span>`
      : `<span class="vs">vs</span>`;

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
  // 🎯 MATCH CLICK EVENTS
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
  // ◀ ▶ NAVIGATION
  // =========================
  const prevBtn = container.querySelector(".prev-day");
  const nextBtn = container.querySelector(".next-day");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (window.scheduleViewIndex > 0) {
        window.scheduleViewIndex--;
        renderSchedule();
      }
    });
  }

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

function getTeamStrengthById(teamId) {
  const league = game.league?.current;
  if (!league?.teams) return 50;

  const team = league.teams.find((t) => String(t.id) === String(teamId));

  return team?.strength || team?.rating || team?.overall || 50;
}

function createStatRow(label, homeValue, awayValue) {
  const total = homeValue + awayValue || 1;

  const homePercent = (homeValue / total) * 100;
  const awayPercent = (awayValue / total) * 100;

  return `
    <div class="match-stat-row">
      <div>${homeValue}</div>

      <div class="match-stat-bar">
        <div class="match-stat-home" style="width:${homePercent}%"></div>
        <div class="match-stat-away" style="width:${awayPercent}%"></div>
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

  const homeStrength = getTeamStrengthById(match.homeTeamId);
  const awayStrength = getTeamStrengthById(match.awayTeamId);

  content.innerHTML = `
    <div class="match-detail-header">
      <div class="match-detail-title">${homeName} vs ${awayName}</div>
      <div class="match-detail-sub">Teamvergleich</div>
    </div>

    <div class="match-detail-versus">
      <div class="match-team">
        <div class="match-team-name">${homeName}</div>
        <div class="match-team-rating">${homeStrength}</div>
      </div>

      <div class="match-vs">VS</div>

      <div class="match-team">
        <div class="match-team-name">${awayName}</div>
        <div class="match-team-rating">${awayStrength}</div>
      </div>
    </div>

    <div class="match-stats">
      ${createStatRow("Gesamt", homeStrength, awayStrength)}
      ${createStatRow("Angriff", Math.round(homeStrength * 1.05), Math.round(awayStrength * 1.05))}
      ${createStatRow("Defensive", Math.round(homeStrength * 0.95), Math.round(awayStrength * 0.95))}
      ${createStatRow("Form", Math.round(homeStrength * 0.9), Math.round(awayStrength * 0.9))}
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
