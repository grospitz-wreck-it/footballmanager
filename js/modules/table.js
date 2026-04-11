// =========================
// 📊 TABLE MODULE (PRO STABLE)
// =========================
import { game } from "../core/state.js";

// =========================
// 🧠 HELPERS
// =========================
function getTeamName(team){
  return typeof team === "string" ? team : team?.name;
}

// =========================
// 🧱 NORMALIZE TEAM
// =========================
function normalizeTeam(team){
  return {
    name: getTeamName(team),
    played: team.played ?? 0,
    wins: team.wins ?? 0,
    draws: team.draws ?? 0,
    losses: team.losses ?? 0,
    goalsFor: team.goalsFor ?? 0,
    goalsAgainst: team.goalsAgainst ?? 0,
    points: team.points ?? 0
  };
}

// =========================
// 🧱 INIT TABLE
// =========================
function initTable(){

  const league = game.league?.current;
  const teams = league?.teams;

  if(!league || !teams) return;

  league.table = teams.map(normalizeTeam);

  console.log("📊 Table initialized");
}

// =========================
// 📊 SORT TABLE
// =========================
function sortTable(table){

  if(!Array.isArray(table)) return [];

  return [...table].sort((a, b) => {

    if(b.points !== a.points){
      return b.points - a.points;
    }

    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;

    if(diffB !== diffA){
      return diffB - diffA;
    }

    if(b.goalsFor !== a.goalsFor){
      return b.goalsFor - a.goalsFor;
    }

    return 0;
  });
}

// =========================
// 📈 LIVE TABLE (FIXED CORE)
// =========================
function getLiveTable(){

  const league = game.league?.current;

  if(!league?.table || league.table.length === 0){
    initTable();
  }

  if(!league?.table) return [];

  // 👉 saubere Kopie (keine Mutation!)
  const table = league.table.map(t => ({ ...t }));

  // =========================
  // 🔥 APPLY SIMULATED MATCHES (NEW)
  // =========================
  const round = league.schedule?.[league.currentRound || 0];

  if(round){

    round.forEach(match => {

      if(!match._processed) return;

      // ❗ eigenes Match wird unten separat behandelt
      if(
        match.homeTeamId === game.team?.selectedId ||
        match.awayTeamId === game.team?.selectedId
      ) return;

      const home = table.find(t => t.name === match.home?.name);
      const away = table.find(t => t.name === match.away?.name);

      if(!home || !away || !match.result) return;

      const h = match.result.home;
      const a = match.result.away;

      home.goalsFor += h;
      home.goalsAgainst += a;

      away.goalsFor += a;
      away.goalsAgainst += h;

      home.played += 1;
      away.played += 1;

      if(h > a){
        home.points += 3;
        home.wins += 1;
        away.losses += 1;
      }
      else if(a > h){
        away.points += 3;
        away.wins += 1;
        home.losses += 1;
      }
      else{
        home.points += 1;
        away.points += 1;
        home.draws += 1;
        away.draws += 1;
      }

    });

  }

  const match = game.match?.current;
  if(!match) return table;

  const homeName = getTeamName(match.home);
  const awayName = getTeamName(match.away);

  const home = table.find(t => t.name === homeName);
  const away = table.find(t => t.name === awayName);

  if(!home || !away) return table;

  const h = game.match?.live?.score?.home ?? 0;
  const a = game.match?.live?.score?.away ?? 0;

  // 👉 nur visuelle Berechnung (kein State zerstören)
  home.goalsFor += h;
  home.goalsAgainst += a;

  away.goalsFor += a;
  away.goalsAgainst += h;

  if(h > a){
    home.points += 3;
  }
  else if(a > h){
    away.points += 3;
  }
  else{
    home.points += 1;
    away.points += 1;
  }

  return table;
}

// =========================
// 🧾 RENDER TABLE
// =========================
function renderTable(customTable){

  const league = game.league?.current;
  if(!league) return;

  if(!league.table || league.table.length === 0){
    initTable();
  }

  const base = customTable || league.table;
  const sorted = sortTable(base);

  const tbody = document.getElementById("tableBody");
  if(!tbody) return;

  tbody.innerHTML = "";

  const match = game.match?.current;
  const homeName = match ? getTeamName(match.home) : null;
  const awayName = match ? getTeamName(match.away) : null;
  const myTeam = game.player?.teamName;

  sorted.forEach((team, index) => {

    const tr = document.createElement("tr");
    const diff = team.goalsFor - team.goalsAgainst;

    // 🟢 Platz 1
    if(index === 0) tr.classList.add("table-promoted");

    // 🔴 Platz 15 + 16
    if(index >= 14) tr.classList.add("table-relegated");

    // ⭐ eigenes Team
    if(team.name === myTeam) tr.classList.add("table-myteam");

    // 🎯 aktives Match
    if(team.name === homeName || team.name === awayName){
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
function renderLiveTable(){
  renderTable(getLiveTable());
}

// =========================
// 🧠 APPLY MATCH (NEU – PRO)
// =========================
// 👉 Wird einmal nach Abpfiff aufgerufen
function applyMatchToTable(){

  const league = game.league?.current;
  const match = game.match?.current;

  if(!league?.table || !match) return;

  const home = league.table.find(t => t.name === getTeamName(match.home));
  const away = league.table.find(t => t.name === getTeamName(match.away));

  if(!home || !away) return;

  const h = match.live.score.home ?? 0;
  const a = match.live.score.away ?? 0;

  home.goalsFor += h;
  home.goalsAgainst += a;

  away.goalsFor += a;
  away.goalsAgainst += h;

  home.played += 1;
  away.played += 1;

  if(h > a){
    home.points += 3;
    home.wins += 1;
    away.losses += 1;
  }
  else if(a > h){
    away.points += 3;
    away.wins += 1;
    home.losses += 1;
  }
  else{
    home.points += 1;
    away.points += 1;
    home.draws += 1;
    away.draws += 1;
  }

  console.log("✅ Match applied to table");
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initTable,
  renderTable,
  renderLiveTable,
  getLiveTable,
  sortTable,
  applyMatchToTable
};
