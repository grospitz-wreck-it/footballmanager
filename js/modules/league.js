// =========================
// 📦 IMPORTS
// =========================
import { renderCurrentMatch } from "../ui/ui.js";
import { game } from "../core/state.js";
import { generateTeam } from "./teamLoader.js";
import { initMatch } from "../matchEngine.js";
import { generateSchedule } from "./scheduler.js"; // 🔥 FIX
import { startGame } from "../ui/layout.js";
import { handleAppVisibility } from "../main.js";
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

  console.log(`⚽ Baue Kader für ${team.name}`);

  const pool = game.players || [];

  if(!pool.length){
    console.error("❌ Kein PlayerPool vorhanden");
    return [];
  }

  // 🔥 Zielverteilung
  const target = {
    GK: 2,
    DEF: 6,
    MID: 8,
    ST: 6
  };

  // 🔥 Pool nach Position aufteilen
  const byPos = {
    GK: [],
    DEF: [],
    MID: [],
    ST: []
  };

  pool.forEach(p => {
    const pos = (p.position_type || "").toUpperCase();

    if(pos.includes("GK")) byPos.GK.push(p);
    else if(pos.includes("DEF")) byPos.DEF.push(p);
    else if(pos.includes("MID")) byPos.MID.push(p);
    else if(pos.includes("ST")) byPos.ST.push(p);
  });

  // 🔥 Shuffle helper
  function shuffle(arr){
    return arr.sort(() => Math.random() - 0.5);
  }

  Object.keys(byPos).forEach(k => shuffle(byPos[k]));

  const selected = [];

  // 🔥 gezielte Auswahl
  function take(posKey, amount){
    for(let i = 0; i < amount; i++){
      if(byPos[posKey].length){
        selected.push(byPos[posKey].shift());
      }
    }
  }

  take("GK", target.GK);
  take("DEF", target.DEF);
  take("MID", target.MID);
  take("ST", target.ST);

  // 🔥 Fallback falls Position fehlt
  const needed = 22 - selected.length;

  if(needed > 0){
    console.warn(`⚠️ Fallback für ${team.name}: ${needed} Spieler fehlen`);

    const rest = pool.filter(p => !selected.includes(p));
    shuffle(rest);

    selected.push(...rest.slice(0, needed));
  }

  // 🔥 aus globalem Pool entfernen (WICHTIG!)
  selected.forEach(p => {
    const idx = pool.indexOf(p);
    if(idx !== -1) pool.splice(idx, 1);
  });

  // 🔥 Team setzen
  team.players = selected.map(p => {
    p.team_id = team.id;
    return p;
  });

  console.log(`✅ ${team.players.length} Spieler für ${team.name}`, {
    GK: target.GK,
    DEF: target.DEF,
    MID: target.MID,
    ST: target.ST
  });

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

  // 🔥 Schedule kommt jetzt von außen (setLeagueById)
if(!league.schedule || !league.schedule.length){
  console.warn("⚠️ Kein Schedule vorhanden (sollte nicht passieren)");
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
  console.log("ℹ️ LeagueSelect wartet auf Daten...");
  
  // 🔥 WICHTIG: Dropdown leeren
  selects.forEach(select => {
    select.innerHTML = "";
  });

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

// 🔥 IMMER neu für neue Karriere
league.schedule = generateSchedule(league);
league.currentRound = 0;

// 🔥 wichtig: reset alter state
league.table = null;

initLeague(league);
      

      const round = league.schedule?.[league.currentRound || 0];

if(!round){
  console.error("❌ Kein Round nach Teamwahl");
  return true;
}

const ok = initMatch(round);

if(!ok){
  console.error("❌ initMatch fehlgeschlagen nach Teamwahl");
  return true;
}

// 🔥 ABSICHERUNG
if(!game.match?.live){
  console.error("❌ live fehlt nach initMatch");
  return true;
}

game.match.live.running = false;
game.match.live.phase = game.match.live.phase || "first_half";

console.log("✅ Match ready nach Teamwahl:", game.match);

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
  generateSchedule(game.league.current);
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
    l => String(l.id) === String(leagueId)
  );

  if(!league){
    console.warn("❌ Liga nicht gefunden:", leagueId);
    return;
  }

  const selects = [
    document.getElementById("leagueSelect"),
    document.getElementById("leagueSelectMenu")
  ].filter(Boolean);

  // =========================
  // 🧠 SET CURRENT LEAGUE
  // =========================
  game.league = game.league || {};
  game.league.current = league;

  // =========================
  // 🔥 HARD RESET (WICHTIG!)
  // =========================
  league.currentRound = 0;
  league.table = null;
  league.schedule = null;

  // =========================
  // 📅 NEUEN SCHEDULE ERZEUGEN
  // =========================
  const schedule = generateSchedule(league);

  if(!schedule || !schedule.length){
    console.error("❌ Schedule konnte nicht erstellt werden");
    return;
  }

  league.schedule = schedule;

  console.log("📅 NEW SCHEDULE:", schedule.length);

  // =========================
  // 👥 INIT LEAGUE (Teams + Players)
  // =========================
  initLeague(league);

  // =========================
  // 🔄 DROPDOWN SYNC
  // =========================
  const index = leagueIndexMap.indexOf(league);

  selects.forEach(select => {
    select.value = index;
  });

  // =========================
  // 👕 TEAMS LADEN (KEIN AUTO-SELECT!)
  // =========================
  populateTeamSelect();

  // =========================
  // 🚫 KEIN MATCH INIT HIER!
  // =========================
  // Match startet erst nach Teamwahl

  console.log("✅ Liga gesetzt (bereit für Teamwahl):", league.name);
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

if(!game.league?.current){
  console.warn("⏳ Liga noch nicht ready → retry TeamSelect");

  setTimeout(() => {
    setLeagueById(id);
  }, 100);

  return;
}

  const teamId = normalizeId(e.target.value);

  // 🔥 zusätzlicher Guard (optional aber gut)
  if(!teamId){
    console.warn("⚠️ Ungültige Team-ID");
    return;
  }

  const success = selectTeamById(teamId);

  // 🔥 nur syncen wenn wirklich erfolgreich
  if(success){
    selects.forEach(s => {
      if(s !== select) s.value = teamId;
    });
  }
};
});

  // 🔥 KEIN AUTO-SELECT MEHR
game.team = game.team || {};
game.team.selected = null;
game.team.selectedId = null;

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

  if(!league || !Array.isArray(league.teams)){
    console.warn("⛔ selectTeamById: Liga noch nicht ready");
    return false;
  }

  const team = league.teams.find(
    t => normalizeId(t.id) === normalizeId(teamId)
  );

  if(!team){
    console.warn("⚠️ Team nicht gefunden:", teamId);
    return false;
  }

  game.team.selected = team.name;
  game.team.selectedId = normalizeId(team.id);

  const players = ensureTeamPlayers(team);
  game.team.players = players;

  console.log("✅ Team gewählt (ID):", team.id);

  const round = league.schedule?.[0];
  if(round && round.length > 0){
    const ok = initMatch(round);
    if(ok){
      game.match.live.running = false;
    }
  }

  renderCurrentMatch();
  handleAppVisibility(); 
  console.log("TEAM ID NACH SET:", game.team?.selectedId);
  return true;
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
