// =========================
// 📦 IMPORTS
// =========================
import { renderCurrentMatch } from "../ui/ui.js";
import { game } from "../core/state.js";
import { generateTeam } from "./teamLoader.js";

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

function ensureTeamPlayers(team){

  if(team.players && team.players.length > 0){
    return team.players;
  }

  console.log(`⚽ Generiere Kader für ${team.name}`);

  team.players = generateTeam(team);

  console.log(`✅ ${team.players.length} Spieler für ${team.name}`);

  return team.players;
}

// =========================
// 🧠 CURRENT ROUND
// =========================
function getCurrentRound(){

  const league = game.league?.current;

  if(!league || !league.schedule) return null;

  return league.schedule[league.currentRound] || null;
}

// =========================
// 🏗️ INIT LEAGUE
// =========================
function initLeague(league){

  if(!league){
    console.error("❌ Keine Liga übergeben");
    return;
  }

  if(!Array.isArray(league.teams) || league.teams.length === 0){
    console.error("❌ Liga hat keine Teams", league);
    return;
  }

  // 🔒 ID NORMALIZATION
  league.teams = league.teams.map(t => ({
    ...t,
    id: normalizeId(t.id)
  }));

  // =========================
  // 📊 TABELLE
  // =========================
  league.table = league.teams.map(team => ({
    id: normalizeId(team.id),
    name: team.name,
    played: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    strength: team.strength || 50
  }));

  console.log("📊 Tabelle erstellt");

  // =========================
  // 📅 SPIELPLAN
  // =========================
  if(!league.schedule || league.schedule.length === 0){

    const baseTeams = league.teams.map(t => t.name);
    const teams = [...baseTeams];

    const firstLeg = [];
    const secondLeg = [];

    for(let i = 0; i < teams.length - 1; i++){

      const round = [];

      for(let j = 0; j < teams.length / 2; j++){

        const home = teams[j];
        const away = teams[teams.length - 1 - j];

        round.push({ home, away });
      }

      firstLeg.push(round);
      teams.splice(1, 0, teams.pop());
    }

    firstLeg.forEach(round => {
      const mirrored = round.map(match => ({
        home: match.away,
        away: match.home
      }));
      secondLeg.push(mirrored);
    });

    league.schedule = [...firstLeg, ...secondLeg];

    console.log("📅 Spielplan erstellt:", league.schedule.length);
  }

  // =========================
  // 🔄 RESET
  // =========================
  league.currentRound = 0;

  console.log("✅ Liga initialisiert:", league.name);
}

// =========================
// ⏭ NÄCHSTES SPIEL
// =========================
function nextMatch(){

  const league = game.league?.current;

  if(!league){
    console.error("❌ Keine Liga aktiv");
    return;
  }

  if(!league.schedule || league.schedule.length === 0){
    console.error("❌ Kein Spielplan vorhanden");
    return;
  }

  league.currentRound++;

  if(league.currentRound >= league.schedule.length){
    console.log("🏆 Saison beendet");

    league.currentRound = 0;
    game.season.year++;

    league.table.forEach(t => {
      t.played = 0;
      t.points = 0;
      t.goalsFor = 0;
      t.goalsAgainst = 0;
    });
  }

  game.match.current = null;

  game.match.live = {
    minute: 0,
    running: false,
    score: { home: 0, away: 0 },
    events: []
  };

  game.phase = "idle";

  console.log("➡️ Nächstes Spiel:", league.currentRound);

  renderCurrentMatch();
}

// =========================
// 🏆 INIT LEAGUE SELECT (FINAL FIX)
// =========================
function initLeagueSelect(){

  // 🔥 HARTE DOM RESET STRATEGIE
  function resetSelect(id){
    const el = document.getElementById(id);
    if(!el) return null;

    const clone = el.cloneNode(false);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  const splashSelect = resetSelect("leagueSelect");
  const menuSelect   = resetSelect("leagueSelectMenu");

  const selects = [splashSelect, menuSelect].filter(Boolean);

  const source = game.league?.available || game.data?.leagues || [];

  if (!source.length) {
    console.warn("⚠️ Keine Ligen geladen");
    return;
  }

  console.log("🏆 LeagueSelect FINAL:", source.length);

  // 🔒 DOUBLE DEDUP (ID + NAME)
  const seen = new Set();
  const leagues = [];

  source.forEach(l => {
    const key = `${normalizeId(l.id)}-${l.name}`;
    if(seen.has(key)) return;
    seen.add(key);
    leagues.push(l);
  });

  // =========================
  // 🧼 OPTIONS BUILD
  // =========================
  selects.forEach(select => {

    while(select.firstChild){
      select.removeChild(select.firstChild);
    }

    leagues.forEach((league, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = league.name;
      select.appendChild(option);
    });

    select.addEventListener("change", (e) => {

      const index = Number(e.target.value);
      const league = leagues[index];

      if(!league) return;

      game.league.current = league;

      initLeague(game.league.current);

      selects.forEach(s => {
        if(s !== select) s.value = index;
      });

      populateTeamSelect();
    });
  });

  game.league = game.league || {};
  game.league.current = leagues[0];

  initLeague(game.league.current);
  populateTeamSelect();
}

// =========================
// 👕 TEAM SELECT
// =========================
function populateTeamSelect() {

  const splashSelect = document.getElementById("teamSelect");
  const menuSelect   = document.getElementById("teamSelectMenu");

  const selects = [splashSelect, menuSelect].filter(Boolean);

  const league = game.league?.current;

  if (!league || !Array.isArray(league.teams)) {
    console.warn("❌ Keine Teams vorhanden:", league);
    return;
  }

  selects.forEach(select => {

    select.innerHTML = "";

    league.teams.forEach(team => {
      const option = document.createElement("option");
      option.value = team.name;
      option.textContent = team.name;
      select.appendChild(option);
    });

    select.onchange = (e) => {

      const teamName = e.target.value;
      selectTeam(teamName);

      selects.forEach(s => {
        if(s !== select) s.value = teamName;
      });
    };
  });

  const firstTeam = league.teams[0];

  game.team = game.team || {};
  game.team.selected = firstTeam.name;
  game.team.selectedId = normalizeId(firstTeam.id);

  ensureTeamPlayers(firstTeam);

  console.log("✅ Teams geladen:", league.teams.length);
}

// =========================
// 👤 TEAM WÄHLEN
// =========================
function selectTeam(teamName){

  const league = game.league?.current;

  if(!league){
    console.error("❌ Keine Liga vorhanden");
    return;
  }

  const team = league.teams.find(t => t.name === teamName);

  if(!team){
    console.warn("⚠️ Team nicht gefunden:", teamName);
    return;
  }

  game.team.selected = team.name;
  game.team.selectedId = normalizeId(team.id);

  const players = ensureTeamPlayers(team);
  game.team.players = players;

  console.log("✅ Team gewählt:", team.name);

  renderCurrentMatch();
}

// =========================
// 🧠 GET TEAM
// =========================
function getSelectedTeam(){

  const league = game.league?.current;
  if (!league) return null;

  return league.teams.find(
    t => normalizeId(t.id) === normalizeId(game.team?.selectedId)
      || t.name === game.team?.selected
  );
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initLeagueSelect,
  populateTeamSelect,
  selectTeam,
  getSelectedTeam,
  initLeague,
  nextMatch,
  getCurrentRound
};
