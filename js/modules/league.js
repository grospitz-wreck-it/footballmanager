// =========================
// 📦 IMPORTS
// =========================
import { renderCurrentMatch } from "../ui/ui.js";
import { game } from "../core/state.js";
import { generateTeam } from "./teamLoader.js";
import { initMatch } from "../matchEngine.js";
import { generateSchedule } from "./scheduler.js"; // 🔥 FIX

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

// 🔥 Map für externes Setzen (PLZ)
let leagueIndexMap = [];
// 🔥 FIX: verhindert doppelte Initialisierung
let leagueSelectInitialized = false;

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

  // =========================
  // 🆔 NORMALIZE IDS
  // =========================
  league.teams = league.teams.map(t => ({
    ...t,
    id: normalizeId(t.id)
  }));

  // =========================
  // 📊 TABLE INIT
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
  // 📅 SCHEDULE FIX (CRITICAL)
  // =========================
  if(!league.schedule || league.schedule.length === 0){

    console.log("📅 Generiere Schedule für:", league.name);

    const schedule = generateSchedule(league);

    if(!schedule || !schedule.length){
      console.error("❌ Schedule konnte nicht erstellt werden");
      return;
    }

    league.schedule = schedule;
  }

  // =========================
  // 🔄 ROUND INIT
  // =========================
  if(typeof league.currentRound !== "number"){
    league.currentRound = 0;
  }

  league.playerRound = 0;

  // =========================
  // 👥 PLAYERS INIT (CRITICAL FIX)
  // =========================
  league.teams.forEach(team => {

    if(!team.players || team.players.length === 0){

      try {
        const players = ensureTeamPlayers(team);

        if(players && players.length){
          team.players = players;
        } else {
          console.warn("⚠️ Keine Spieler generiert für:", team.name);
        }

      } catch(e){
        console.error("❌ Player generation crashed:", team.name, e);
      }
    }

  });

  console.log("👥 Spieler generiert für Liga:", league.name);

  // =========================
  // ✅ DONE
  // =========================
  console.log("✅ Liga ready:", league.name);
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
// 🏆 INIT LEAGUE SELECT
// =========================
function initLeagueSelect(leaguesInput){
  if(leagueSelectInitialized){
    console.log("⚠️ initLeagueSelect already initialized → skip");
    return;
  }

  leagueSelectInitialized = true;
  
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

  // 🔥 FIX: NIMM PARAMETER!
  const source = leaguesInput || game.league?.available || [];

  if (!source.length) {
    console.warn("⚠️ Keine Ligen geladen");
    return;
  }

  console.log("🏆 LeagueSelect FINAL:", source.length);

  const seen = new Set();
  const leagues = [];

  source.forEach(l => {
    const key = `${normalizeId(l.id)}-${l.name}`;
    if(seen.has(key)) return;
    seen.add(key);
    leagues.push(l);
  });

  leagueIndexMap = leagues;

  selects.forEach(select => {

    select.innerHTML = "";

    leagues.forEach((league, i) => {
      const option = document.createElement("option");
      option.value = i;

      // 🔥 BONUS: besserer Name
      option.textContent = `${league.name} (${league.teams.length})`;

      select.appendChild(option);
    });

    select.addEventListener("change", (e) => {

      const index = Number(e.target.value);
      const league = leagues[index];

      if(!league) return;

      game.league.current = league;

      if(!league.schedule || !league.schedule.length){
        generateSchedule();
      }

      initLeague(league);

      const round = league.schedule?.[0];
      if(round && round.length > 0){
        const ok = initMatch(round);
        if(ok){
          game.match.live.running = false;
        }
      }

      selects.forEach(s => {
        if(s !== select) s.value = index;
      });

      populateTeamSelect();
    });
  });

  // 🔥 DEFAULT SELECT
  game.league = game.league || {};
  game.league.current = leagues[0];

  // 🔥 zuerst Schedule
if(!game.league.current.schedule || !game.league.current.schedule.length){
  generateSchedule();
}

// dann init
initLeague(game.league.current);

  populateTeamSelect();

  const round = game.league.current?.schedule?.[0];

  if(round && round.length > 0){
    const ok = initMatch(round);
    if(ok){
      game.match.live.running = false;
    }
  }
}

// =========================
// 🔥 SET LEAGUE (PLZ)
// =========================
function setLeagueById(leagueId){

  const league = leagueIndexMap.find(
    l => normalizeId(l.id) === normalizeId(leagueId)
  );

  if(!league){
    console.warn("❌ Liga nicht gefunden:", leagueId);
    return;
  }

  const index = leagueIndexMap.indexOf(league);

  const selects = [
    document.getElementById("leagueSelect"),
    document.getElementById("leagueSelectMenu")
  ].filter(Boolean);

  game.league.current = league;

  // 🔥 zuerst Schedule
if(!league.schedule || !league.schedule.length){
  generateSchedule();
}

// dann init
initLeague(league);

  selects.forEach(select => {
    select.value = index;
  });

  populateTeamSelect();

  // 🔥 FIX: Match nach TeamSelect kommt später sauber
  const round = league.schedule?.[0];
  if(round && round.length > 0){
    const ok = initMatch(round);
    if(ok){
      game.match.live.running = false;
    }
  }

  console.log("✅ Liga extern gesetzt:", league.name);
}

// =========================
// 👕 TEAM SELECT (ID BASED)
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
      option.value = normalizeId(team.id);
      option.textContent = team.name;
      select.appendChild(option);
    });

    select.onchange = (e) => {

      const teamId = normalizeId(e.target.value);
      selectTeamById(teamId);

      selects.forEach(s => {
        if(s !== select) s.value = teamId;
      });
    };
  });

  const firstTeam = league.teams[0];

game.team = game.team || {};
game.team.selected = firstTeam.name;
game.team.selectedId = normalizeId(firstTeam.id);

// 🔥 FIX: alle Teams vorbereiten (nicht nur eins)
league.teams.forEach(t => {
  ensureTeamPlayers(t);
});

  console.log("✅ Teams geladen:", league.teams.length);
}

// =========================
// 👤 TEAM WÄHLEN (ID)
// =========================
function selectTeamById(teamId){

  const league = game.league?.current;

  if(!league){
    console.error("❌ Keine Liga vorhanden");
    return;
  }

  const team = league.teams.find(
    t => normalizeId(t.id) === normalizeId(teamId)
  );

  if(!team){
    console.warn("⚠️ Team nicht gefunden:", teamId);
    return;
  }

  game.team.selected = team.name;
  game.team.selectedId = normalizeId(team.id);

  const players = ensureTeamPlayers(team);
  game.team.players = players;

  console.log("✅ Team gewählt (ID):", team.id);

  // 🔥 FINAL FIX: MATCH = DEIN TEAM
  const round = game.league?.current?.schedule?.[0];
  if(round && round.length > 0){
    const ok = initMatch(round);
    if(ok){
      game.match.live.running = false;
    }
  }

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
  );
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initLeagueSelect,
  populateTeamSelect,
  getSelectedTeam,
  initLeague,
  nextMatch,
  getCurrentRound,
  setLeagueById,
  selectTeamById
};
