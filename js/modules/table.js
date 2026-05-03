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

  schedule
  .slice(0, game.league.currentRound + 1)
  .forEach((round) => {
    round.forEach((match) => {
      if (!match) return;

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
      // 🔴 USER MATCH LIVE
      // =========================
      if (isMyMatch && game.match?.live) {
        h = Number(game.match.live.score?.home ?? 0);
        a = Number(game.match.live.score?.away ?? 0);
      }

      // =========================
      // ⚽ LIVE FREMDMATCH
      // =========================
      else if (match.live && !match.finished) {
        h = Number(match.homeGoals ?? 0);
        a = Number(match.awayGoals ?? 0);
      }

      // =========================
      // 🏁 FINISHED MATCH
      // =========================
      else if (match.finished || match.result || match._processed) {
        h = Number(match.result?.home ?? match.homeGoals ?? 0);
        a = Number(match.result?.away ?? match.awayGoals ?? 0);
      }

      else {
        return;
      }

      // 🔒 NaN Guard
      if (Number.isNaN(h) || Number.isNaN(a)) {
        h = 0;
        a = 0;
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

if (index <= 1) {
  tr.classList.add("table-promoted");
}

if (index >= sorted.length - 2) {
  tr.classList.add("table-relegated");
}

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
