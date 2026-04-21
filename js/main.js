// =========================
// 🚀 MAIN.JS START
// =========================
console.log("🚀 MAIN.JS LOADED");

// =========================
// 📦 IMPORTS
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import "./core/eventStore.js";

import { supabase } from "./client.js";

import { initLeagueSelect, setLeagueById, selectTeamById } from "./modules/league.js";
import { loadPlayers } from "./modules/loader.js";
import { startAdEngine } from "./modules/ads.js";
import {
  generateSchedule,
  advanceSchedule,
  renderSchedule
} from "./modules/scheduler.js";

import {
  runMatchLoop,
  initMatch,
  simulateOtherMatches
} from "./matchEngine.js";

import { updateUI } from "./ui/ui.js";

console.log("🔥 IMPORTS DONE");

// =========================
// 🧠 GLOBAL STATE
// =========================
let matchLoopRunning = false;
let simInterval = null;

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}
// =========================
// 🤖 BACKGROUND SIM
// =========================
function stopBackgroundSimulation(){
  if(simInterval){
    clearInterval(simInterval);
    simInterval = null;
  }
}

function startBackgroundSimulation(){

  if(simInterval) return;

  simInterval = setInterval(() => {

    const league = game.league?.current;
    const round = league?.schedule?.[game.league?.currentRound || 0];
    if(!round) return;

    const myTeamId = normalizeId(game.team?.selectedId);

    round.forEach(match => {

      if(
        normalizeId(match.homeTeamId) === myTeamId ||
        normalizeId(match.awayTeamId) === myTeamId
      ) return;

      if(match._processed || match.live?.running === false) return;

      if(!match.live){
        match.live = {
          minute: 0,
          score: { home: 0, away: 0 },
          running: true,
          started: false,
          startDelay: Math.random() * 6
        };
      }

      if(!match.live.started){
        match.live.startDelay -= 2;
        if(match.live.startDelay > 0) return;
        match.live.started = true;
      }

      match.live.minute += Math.floor(Math.random()*5)+1;

      if(Math.random() < 0.18){
        Math.random() < 0.5
          ? match.live.score.home++
          : match.live.score.away++;
      }

      if(match.live.minute >= 90){
        match.live.minute = 90;
        match.live.running = false;
        match.result = match.live.score;
        match._processed = true;
      }

    });

    updateUI();

  }, 2000);
}

// =========================
// 🔥 EVENTS
// =========================
function initEventBindings(){

  // =========================
  // 🔄 STATE CHANGES → UI UPDATE
  // =========================
  on(EVENTS.STATE_CHANGED, () => {
    updateUI(); // 🔥 zentraler Trigger
  });

  // =========================
  // 🔥 MATCH EVENTS → UI PIPELINE
  // =========================
  on(EVENTS.MATCH_EVENT, (event) => {

    game.events = game.events || {};
    game.events.history = game.events.history || [];

    game.events.history.push(event);

    // optional limit (Performance)
    if(game.events.history.length > 50){
      game.events.history.shift();
    }

    updateUI(); // 🔥 triggert updateEvents() in ui.js
  });

  // =========================
  // 🏁 MATCH FINISHED
  // =========================
  on(EVENTS.MATCH_FINISHED, () => {

    stopBackgroundSimulation();
    matchLoopRunning = false;

    if(game.match?.live){
      game.match.live.running = false;
    }

    if(game.events){
      game.events.history = [];
    }

    advanceSchedule();

    updateUI();      // 🔥 reicht komplett
    renderSchedule(); // ok
  });
}
// =========================
// 📺 EVENTS UI
// =========================
function renderEvents(){
  // ❌ NICHT MEHR VERWENDEN
  // Events werden jetzt komplett über UI Engine gesteuert
}
// =========================
// 👁 APP VISIBILITY
// =========================
function handleAppVisibility(){

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  const isPlaying = game.phase === "playing";

  console.log("👁 VISIBILITY", {
    phase: game.phase,
    team: game.team
  });

  if(isPlaying){

    if(splash){
      splash.style.display = "none";
    }

    if(app){
      app.style.display = "block";
    }

  } else {

    if(splash){
      splash.style.display = "flex";
    }

    if(app){
      app.style.display = "none";
    }
  }
}
// =========================
// 🚀 INIT
// =========================
async function init(){

  window.game = game;
  game.phase = "setup";
  initEventBindings();
  startAdEngine();
  try {

    // =========================
// 🏆 TEAMS
// =========================
const { data: teamsRaw } =
  await supabase.from("teams").select("*");

const teams = teamsRaw || [];
game.teams = teams;

console.log("🏆 Teams:", teams.length);

// =========================
// 🏙 CITIES
// =========================
const { data: citiesRaw } =
  await supabase.from("cities").select("*");

game.cities = citiesRaw || [];

console.log("🏙 Cities:", game.cities.length);

// =========================
// ⚡ CITY MAP (FAST LOOKUP)
// =========================
game.cityMap = Object.fromEntries(
  game.cities.map(c => [c.id, c])
);

  
 // =========================
// 👥 PLAYERS LOAD
// =========================
const loadedPlayers = await loadPlayers();

// =========================
// 🧠 TEAM SOURCE (NUR LIGA)
// =========================
const leagueTeams =
  game.league?.current?.teams || [];

if(!leagueTeams.length){
  console.warn("⚠️ Keine Liga-Teams beim Player-Mapping");
}

// =========================
// 🔥 TEAM ASSIGN (STRICT LIGA)
// =========================
let pool = (loadedPlayers || []).map(p => {

  // =========================
  // ✅ 1. EXISTING TEAM (VALID)
  // =========================
  if(p.team_id){

    const inLeague = leagueTeams.some(t =>
      String(t.id) === String(p.team_id)
    );

    if(inLeague){
      return {
        ...p,
        team_id: String(p.team_id) // 🔥 normalize
      };
    }
  }

  // =========================
  // 🔁 2. FALLBACK → RANDOM TEAM
  // =========================
  if(leagueTeams.length){

    const randomTeam =
      leagueTeams[Math.floor(Math.random() * leagueTeams.length)];

    return {
      ...p,
      team_id: randomTeam ? String(randomTeam.id) : null
    };
  }

  // =========================
  // ❌ 3. NO TEAM AVAILABLE
  // =========================
  return {
    ...p,
    team_id: null
  };
});

// =========================
// 🔒 SAFETY FILTER (CRITICAL)
// =========================
pool = pool.filter(p => p.team_id);

// =========================
// 📦 FINAL ASSIGN
// =========================
window.playerPool = pool;
game.players = pool;

// =========================
// 🧪 DEBUG
// =========================
console.log("👥 PLAYER POOL READY:", {
  total: pool.length,
  sample: pool[0],
  teamsUsed: [...new Set(pool.map(p => p.team_id))].length
});

// =========================
// 🧠 GLOBAL STATE SYNC
// =========================
if(window.playerPool && Array.isArray(window.playerPool)){
  game.players = window.playerPool;
}

// =========================
// 🧪 DEBUG (SAFE & CLEAN)
// =========================
console.log("👥 PLAYER TEAM ASSIGN DONE", {
  total: window.playerPool?.length || 0,
  sample: (window.playerPool || []).slice(0,5).map(p => ({
    id: p.id,
    team_id: p.team_id
  }))
});

    // =========================
    // 🏟 COMPETITIONS
    // =========================
    const { data: competitionsRaw } =
      await supabase.from("competitions").select("*");

    const competitions = competitionsRaw || [];

    const leagues = competitions.map(c => {

      const leagueTeams = teams.filter(t =>
        String(t.competition_id) === String(c.id)
      ) || [];

      return {
        id: String(c.id),
        name: c.name,
        level: Number(c.level) || 7,
        teams: leagueTeams
      };
    });

    game.leagues = leagues;
    game.league = { available: leagues };

    initLeagueSelect(leagues);

if(leagues.length){

  setLeagueById(leagues[0].id);
  generateSchedule();
  initCustomTeamSelect(game.league.current);
  console.log("📅 SCHEDULE:", game.league.current?.schedule);

  const firstTeam = leagues[0]?.teams?.[0];

  if(firstTeam){

    console.log("🎯 Auto-select Team (delayed)");

    setTimeout(() => {

      const ok = selectTeamById(String(firstTeam.id));

      console.log("🧪 selectTeam result:", ok);

      if(ok){
        handleAppVisibility();
        updateUI();
        updateMainButtonText();
      } else {
        console.warn("❌ Team Select fehlgeschlagen");
      }

    }, 50);

  } else {
    console.warn("⚠️ Kein Team in Liga gefunden");
  }
}

// 👉 BUTTONS (IMMER HIER, INNERHALB try)
initMainButton();
updateMainButtonText();
initResetButton();
initPlzInput();
initCustomLeagueSelect();
    
    } catch(e){
  console.error("💥 INIT CRASH:", e);
}
}
// =========================
// 🎯 MAIN BUTTON
// =========================
function initMainButton(){

  const btn = document.getElementById("mainButton");
  if(!btn) return;

  btn.onclick = () => {

    console.log("🟢 BUTTON CLICK");

    let live = game.match?.live;
const league = game.league?.current;

// =========================
// 🚀 FIRST START MUSS IMMER GEHEN
// =========================
game.phase = game.phase || "setup";

if (game.phase === "setup") {
  console.log("🚀 FIRST START");

  const hasTeam = !!game.team?.selectedId;

  if (!hasTeam) {
    console.warn("❌ Kein Team gewählt");
    return;
  }

  const league = game.league?.current;
  if (!league) {
    console.warn("❌ Keine Liga");
    return;
  }

  const round = league.schedule?.[league.currentRound || 0];
  if (!round) {
    console.warn("❌ Kein Spielplan");
    return;
  }

  // 🔥 MATCH INITIALISIEREN
  if (!initMatch(round)) {
    console.warn("❌ initMatch failed");
    return;
  }

  // 🔥 PHASE WECHSELN
  game.phase = "playing";

  // 🔥 MATCH STARTEN
  startBackgroundSimulation();

  game.match.live.running = true;
  matchLoopRunning = true;

  runMatchLoop({
    onTick: () => {
      updateUI();
      updateMainButtonText();
    },
    onEnd: () => {
      matchLoopRunning = false;
      updateUI();
      updateMainButtonText();
    }
  });

  handleAppVisibility();
  updateUI();
  updateMainButtonText();

  return;
}

// =========================
// ❗ ERST DANACH LEAGUE CHECK
// =========================
if (!league) {
  console.warn("❌ League fehlt beim Start");
  return;
}

    // =========================
    // 🆕 INIT MATCH
    // =========================
    if(!live){

      const round = league.schedule?.[league.currentRound || 0];
      if(!round){
        console.warn("❌ Kein Round");
        return;
      }

      if(!initMatch(round)){
        console.warn("❌ initMatch failed");
        return;
      }

      live = game.match.live;

      if(!live){
        console.error("❌ live fehlt nach init");
        return;
      }

      live.running = false;

      if(live.phase !== "bye"){
        live.phase = "first_half";
      }

      live.minute = 0;

      console.log("🆕 MATCH INITIALIZED", live);
    }

    // =========================
    // ▶️ AUTO START NACH INIT
    // =========================
    if(
      live &&
      live.running === false &&
      live.phase !== "bye" &&
      live.phase !== "halftime"
    ){
      console.log("▶️ AUTO START MATCH");

      startBackgroundSimulation();

      live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      updateMainButtonText();
      return;
    }

    // =========================
    // BYE
    // =========================
    if(live.phase === "bye"){

      game.league.currentRound++;

      const nextRound = league.schedule?.[game.league.currentRound];
      if(!nextRound) return;

      initMatch(nextRound);
      simulateOtherMatches(nextRound);

      game.events.history = [];

      updateUI();
      updateMainButtonText();
      return;
    }

    // =========================
    // NEXT MATCH
    // =========================
    if(live.minute >= 90){

      game.league.currentRound++;

      const round = league.schedule?.[game.league.currentRound];
      if(!round) return;

      initMatch(round);

      startBackgroundSimulation();

      game.match.live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      return;
    }

    // =========================
    // HALFTIME
    // =========================
    if(
      live.phase === "halftime" ||
      (live.minute === 45 && !live.running)
    ){

      if(matchLoopRunning) return;

      startBackgroundSimulation();

      live.phase = "second_half";
      live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      return;
    }

    // =========================
    // START / RESUME
    // =========================
    if(live.running === false){

      if(matchLoopRunning) return;

      startBackgroundSimulation();

      live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      return;
    }

    // =========================
    // PAUSE
    // =========================
    if(live.running === true){
      live.running = false;
      matchLoopRunning = false;
      updateMainButtonText();
    }

  };
}

// =========================
// 🔄 RESET BUTTON
// =========================
function initResetButton(){

  const btn = document.getElementById("resetBtn");

  if(!btn){
    console.warn("⚠️ resetBtn nicht gefunden");
    return;
  }

  console.log("🔄 resetBtn ready");

  btn.onclick = async () => {

    console.log("🔄 RESET CLICKED");

    const m = await import("./services/storage.js");
    m.resetGame();

    // =========================
    // 🧠 STATE RESET (WICHTIG)
    // =========================
    game.phase = "setup";              // 🔥 NEU (entscheidend)
    game.team = null;
    game.match = null;

    if(game.league){
      game.league.current = null;
      game.league.currentRound = 0;    // 🔥 wichtig für neuen Start
    }

    // optional sauber machen
    if(game.events){
      game.events.history = [];
    }

    // =========================
    // 🤖 STOP ALLES
    // =========================
    matchLoopRunning = false;
    stopBackgroundSimulation();

    // =========================
    // 🖥 UI RESET
    // =========================
    handleAppVisibility();
    updateUI();
    updateMainButtonText(); // 🔥 wichtig

  };
}


function initPlzInput(){

  const input = document.getElementById("plzInput");
  if(!input){
    console.warn("❌ plzInput fehlt");
    return;
  }

  console.log("✅ PLZ System ready");

  let debounce;

  input.addEventListener("input", () => {

    clearTimeout(debounce);

    debounce = setTimeout(() => {

      const plz = input.value.trim();

      if(!game.leagues || !game.leagues.length){
        return;
      }

      const scored = game.leagues
        .map(league => {

          if((league.level || 0) < 7) return null;
          if(!league.teams || !league.teams.length) return null;

          let score = 0;

          for(const team of league.teams){
            const city = game.cityMap?.[team.city_id];
            if(!city?.plz) continue;

            const cityPlz = String(city.plz);

            if(plz.length === 3 && cityPlz.startsWith(plz)) score += 100;
            else if(plz.length === 2 && cityPlz.startsWith(plz)) score += 50;
            else if(plz.length === 1 && cityPlz.startsWith(plz)) score += 10;
          }

          return score > 0 ? { league, score } : null;
        })
        .filter(Boolean)
        .sort((a,b) => b.score - a.score);

      const filtered = scored.map(s => s.league);

      if(filtered.length === 0){
        initCustomLeagueSelect([]);
        return;
      }

      const top = filtered.slice(0,5);

      initCustomLeagueSelect(top);

      // 🔥 Dropdown automatisch öffnen
      const leagueContainer = document.getElementById("leagueSelect");
      if(leagueContainer){
        leagueContainer.classList.add("open");
      }

    },150);

  });
}

function initCustomLeagueSelect(list = game.leagues) {

  const container = document.getElementById("leagueSelect");
  if (!container) return;

  container.classList.remove("open");
  container.innerHTML = "";

  container.innerHTML = `
    <div class="selected">Liga wählen</div>
    <div class="options"></div>
  `;

  const selected = container.querySelector(".selected");
  const options = container.querySelector(".options");

  // 🔥 WICHTIG: NICHT mehr game.leagues nehmen!
  const filtered = (list || []).filter((l) => (l.level || 0) >= 7);

  options.innerHTML = filtered
    .map(l => `
      <div class="option" data-id="${l.id}">
        ${l.name} (${l.teams?.length || 0})
      </div>
    `)
    .join("");

  selected.onclick = (e) => {
    e.stopPropagation();
    container.classList.toggle("open");
  };

  options.querySelectorAll(".option").forEach(el => {

    el.onclick = (e) => {
      e.stopPropagation();

      const id = el.dataset.id;
      const league = filtered.find(l => String(l.id) === String(id));
      if (!league) return;

      selected.textContent = `${league.name} (${league.teams.length})`;

      setLeagueById(league.id);

      // 🔥 TEAM FREISCHALTEN
      const teamContainer = document.getElementById("teamSelect");
      teamContainer.classList.remove("disabled");

      initCustomTeamSelect(league);

      container.classList.remove("open");

      updateUI();
    };

  });
}

function initCustomTeamSelect(league) {

  const container = document.getElementById("teamSelect");
  if (!container) return;

  container.classList.remove("open");

  const teams = league?.teams || [];

  // 🔥 DISABLED wenn keine Liga
  if (!league || !teams.length) {
    container.classList.add("disabled");
  } else {
    container.classList.remove("disabled");
  }

  container.innerHTML = `
    <div class="selected">${teams.length ? "Team wählen" : "Keine Teams"}</div>
    <div class="options">
      ${
        teams.length
          ? teams.map(t => `
            <div class="option" data-id="${t.id}">
              ${t.name}
            </div>
          `).join("")
          : `<div class="option empty">Keine Teams vorhanden</div>`
      }
    </div>
  `;

  const selected = container.querySelector(".selected");
  const options = container.querySelector(".options");

  // 🔽 OPEN / CLOSE
  selected.onclick = (e) => {
    e.stopPropagation();
    if (container.classList.contains("disabled")) return;
    container.classList.toggle("open");
  };

  // 🔥 OPTION CLICK
  options.querySelectorAll(".option").forEach(el => {

    if (el.classList.contains("empty")) return;

    el.onclick = (e) => {
      e.stopPropagation();

      const id = el.dataset.id;
      const team = teams.find(t => String(t.id) === String(id));
      if (!team) return;

      selected.textContent = team.name;

      selectTeamById(team.id);

      container.classList.remove("open");

      handleAppVisibility();
      updateUI();
      updateMainButtonText();
    };

  });
}

// =========================
// 🔘 BUTTON TEXT
// =========================
function updateMainButtonText() {

  const btn = document.getElementById("mainButton");
  if (!btn) return;

  const REQUIRE_TEAM = true; // muss gleich sein wie oben

  // =========================
  // SETUP PHASE
  // =========================
  if (game.phase === "setup") {

    const hasTeam = !!game.team?.selectedId;

    // Text
    btn.textContent = hasTeam ? "Spiel starten" : "Team wählen";

    // 🔥 DAS IST DER BONUS
    btn.disabled = REQUIRE_TEAM && !hasTeam;

    return;
  }

  // =========================
  // AB HIER DEIN ALTER CODE
  // =========================
  const live = game.match?.live;

  if (!live) {
    btn.textContent = "Start Match";
    return;
  }

  if (live.phase === "bye") {
    btn.textContent = "No Match";
  } else if (live.minute >= 90) {
    btn.textContent = "Next Match";
  } else if (live.phase === "halftime") {
    btn.textContent = "Start 2nd Half";
  } else if (live.running) {
    btn.textContent = "Pause";
  } else if (live.minute > 0) {
    btn.textContent = "Resume";
  } else {
    btn.textContent = "Start Match";
  }
}

// =========================
// 🚀 BOOT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await init();
});     
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-select").forEach(el => {
    el.classList.remove("open");
  });
});
