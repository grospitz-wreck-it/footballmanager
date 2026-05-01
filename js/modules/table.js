// =========================
// 📊 TABLE MODULE OPTIMIZED
// STABLE LIVE TABLE
// ONLY MY MATCH LIVE
// =========================

import { game } from "../core/state.js";

// =========================
// 🧠 INTERNAL CACHE
// =========================
let lastTableHash = null;

// =========================
// 🧱 INIT TABLE
// =========================
function initTable() {
  const league = game.league?.current;
  const teams = league?.teams;

  if (!league || !teams) return;

  league.table = teams.map((team) => ({
    id: String(team.id),
    name: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

// =========================
// 📊 SORT
// =========================
function sortTable(table) {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;

    if (diffB !== diffA) return diffB - diffA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    return 0;
  });
}

// =========================
// 🧠 HASH
// =========================
function buildTableHash(sorted) {
  return sorted
    .map(
      (t) =>
        `${t.id}-${t.points}-${t.goalsFor}-${t.goalsAgainst}-${t.played}`,
    )
    .join("|");
}

// =========================
// 📈 LIVE TABLE (CALM MODE)
// =========================
function getLiveTable() {
  const league = game.league?.current;
  if (!league) return [];

  const teams = league.teams || [];

  const table = teams.map((team) => ({
    id: String(team.id),
    name: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));

  const schedule = league.schedule || [];
  const myMatchId = game.match?.current?.id || null;

  schedule.forEach((round) => {
    round.forEach((match) => {
      const home = table.find(
        (t) => t.id === String(match.homeTeamId),
      );

      const away = table.find(
        (t) => t.id === String(match.awayTeamId),
      );

      if (!home || !away) return;

      let h = null;
      let a = null;

      const isMyMatch = myMatchId && match.id === myMatchId;

      // =========================
      // 🔴 NUR DEIN SPIEL LIVE
      // =========================
      if (isMyMatch) {
        h = game.match?.live?.score?.home ?? 0;
        a = game.match?.live?.score?.away ?? 0;
      }

      // =========================
      // 🟢 ANDERE SPIELE:
      // NUR FIXE STATUS
      // =========================
      else if (match.finished && match.result) {
        h = match.result.home;
        a = match.result.away;
      }

      else if (
        game.match?.live?.minute >= 90 &&
        match.homeGoals !== undefined
      ) {
        h = match.homeGoals;
        a = match.awayGoals;
      }

      else {
        return;
      }

      // =========================
      // 📊 APPLY
      // =========================
      home.goalsFor += h;
      home.goalsAgainst += a;

      away.goalsFor += a;
      away.goalsAgainst += h;

      home.played++;
      away.played++;

      if (h > a) {
        home.points += 3;
        home.wins++;
        away.losses++;
      }

      else if (a > h) {
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
    });
  });

  return table;
}

// =========================
// 🧾 RENDER TABLE
// =========================
function renderTable(customTable) {
  const league = game.league?.current;
  if (!league) return;

  if (!league.table?.length) {
    initTable();
  }

  const base = customTable || league.table;
  const sorted = sortTable(base);

  // =========================
  // 🔥 DIFF RENDER
  // =========================
  const newHash = buildTableHash(sorted);

  if (newHash === lastTableHash) {
    return;
  }

  lastTableHash = newHash;

  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const match = game.match?.current;
  const myTeamId = String(game.team?.selectedId);

  sorted.forEach((team, index) => {
    const tr = document.createElement("tr");
    const diff = team.goalsFor - team.goalsAgainst;

    if (index === 0) tr.classList.add("table-promoted");
    if (index >= 14) tr.classList.add("table-relegated");

    if (String(team.id) === myTeamId) {
      tr.classList.add("table-myteam");
    }

    if (
      match &&
      (
        String(team.id) === String(match.homeTeamId) ||
        String(team.id) === String(match.awayTeamId)
      )
    ) {
      tr.classList.add("table-active");
    }

    tr.innerHTML = `
      <td class="pos">${index + 1}</td>
      <td class="team">${team.name}</td>
      <td>${team.played}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
      <td>${team.goalsFor}:${team.goalsAgainst}</td>
      <td>${diff}</td>
      <td class="pts">${team.points}</td>
    `;

    tbody.appendChild(tr);
  });
}

// =========================
// ⚡ LIVE RENDER
// =========================
function renderLiveTable() {
  renderTable(getLiveTable());
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initTable,
  renderTable,
  renderLiveTable,
};
