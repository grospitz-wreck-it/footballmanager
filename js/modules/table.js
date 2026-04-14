// =========================
// 📊 TABLE MODULE (ID ONLY CLEAN)
// =========================
import { game } from "../core/state.js";

// =========================
// 🧱 INIT TABLE
// =========================
function initTable(){

  const league = game.league?.current;
  const teams = league?.teams;

  if(!league || !teams) return;

  league.table = teams.map(team => ({
    id: String(team.id),
    name: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  }));

  console.log("📊 Table initialized (ID mode)");
}

// =========================
// 📊 SORT TABLE
// =========================
function sortTable(table){

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
// 📈 LIVE TABLE (FIXED)
// =========================
function getLiveTable(){

  const league = game.league?.current;
  if(!league) return [];

  if(!league.table || league.table.length === 0){
    initTable();
  }

  const table = league.table.map(t => ({ ...t }));
  const round = league.schedule?.[league.currentRound || 0];

  if(round){

    round.forEach(match => {

      const home = table.find(t => t.id === String(match.homeTeamId));
      const away = table.find(t => t.id === String(match.awayTeamId));

      if(!home || !away) return;

      let h = 0;
      let a = 0;

      // 🔥 LIVE MATCH PRIORITY
      if(
        game.match?.current &&
        match.id === game.match.current.id
      ){
        h = game.match.live?.score?.home ?? 0;
        a = game.match.live?.score?.away ?? 0;
      }
      // 🔥 PROCESSED MATCH
      else if(match._processed && match.result){
        h = match.result.home;
        a = match.result.away;
      }
      else{
        return;
      }

      home.goalsFor += h;
      home.goalsAgainst += a;

      away.goalsFor += a;
      away.goalsAgainst += h;

      home.played++;
      away.played++;

      if(h > a){
        home.points += 3;
        home.wins++;
        away.losses++;
      }
      else if(a > h){
        away.points += 3;
        away.wins++;
        home.losses++;
      }
      else{
        home.points++;
        away.points++;
        home.draws++;
        away.draws++;
      }

    });
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
  const myTeamId = String(game.team?.selectedId);

  sorted.forEach((team, index) => {

    const tr = document.createElement("tr");
    const diff = team.goalsFor - team.goalsAgainst;

    if(index === 0) tr.classList.add("table-promoted");
    if(index >= 14) tr.classList.add("table-relegated");

    // ⭐ MY TEAM
    if(String(team.id) === myTeamId){
      tr.classList.add("table-myteam");
    }

    // 🎯 ACTIVE MATCH
    if(match){
      if(
        String(team.id) === String(match.homeTeamId) ||
        String(team.id) === String(match.awayTeamId)
      ){
        tr.classList.add("table-active");
      }
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
// 🧠 APPLY MATCH
// =========================
function applyMatchToTable(){

  const league = game.league?.current;
  const match = game.match?.current;

  if(!league?.table || !match) return;

  const home = league.table.find(t => t.id === String(match.homeTeamId));
  const away = league.table.find(t => t.id === String(match.awayTeamId));

  if(!home || !away) return;

  const h = match.live.score.home ?? 0;
  const a = match.live.score.away ?? 0;

  home.goalsFor += h;
  home.goalsAgainst += a;

  away.goalsFor += a;
  away.goalsAgainst += h;

  home.played++;
  away.played++;

  if(h > a){
    home.points += 3;
    home.wins++;
    away.losses++;
  }
  else if(a > h){
    away.points += 3;
    away.wins++;
    home.losses++;
  }
  else{
    home.points++;
    away.points++;
    home.draws++;
    away.draws++;
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
  applyMatchToTable
};
