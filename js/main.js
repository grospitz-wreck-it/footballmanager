console.log("🚀 MAIN LOADED");

document.addEventListener("click", () => {
  console.log("🖱 ANY CLICK");
});

// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import { initLeagueSelect, setLeagueById } from "./modules/league.js";
import "./core/eventStore.js";
import { loadPlayers } from "./modules/loader.js";
import { loadGameEvents, subscribeGameEvents } from "./services/gameEventsRealtime.js";

async function startGame(){
  await loadGameEvents();
  subscribeGameEvents();
}
startGame();

// =========================
// 🔌 SUPABASE
// =========================
import { supabase } from "./client.js";

// =========================
// 🔧 MODULES
// =========================
import { startAdEngine } from "./modules/ads.js";
import { generateSchedule, advanceSchedule, renderSchedule } from "./modules/scheduler.js";
import { initTable } from "./modules/table.js";
import { initPlayerPool } from "./modules/playerPool.js";
import { importPlayers } from "../tools/importer.js";
window.importPlayers = importPlayers;
import { buildAllTeams } from "./modules/teamGenerator.js";
window.buildAllTeams = buildAllTeams;

// =========================
// 🎮 ENGINE
// =========================
import { runMatchLoop, initMatch } from "./matchEngine.js";
import { initMatchEventSlides } from "./engine/matchEventSlideSystem.js";

// =========================
// 💾 STORAGE
// =========================
import { loadGame } from "./services/storage.js";

// =========================
// 🖥 UI
// =========================
import { updateUI } from "./ui/ui.js";

// =========================
// 🐞 DEBUG
// =========================
import { initDebugOverlay } from "../debug/debugOverlay.js";

// =========================
// 🔥 LOOP GUARD
// =========================
let matchLoopRunning = false;

// =========================
// 🔥 BACKGROUND SIM (NEW)
// =========================
let simInterval = null;

// =========================
// 🛑 STOP BACKGROUND SIM
// =========================
function stopBackgroundSimulation(){
  if(simInterval){
    clearInterval(simInterval);
    simInterval = null;
  }
}

// =========================
// 🤖 BACKGROUND SIMULATION
// =========================
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

      const timeStep = Math.floor(Math.random() * 5) + 1;
      match.live.minute += timeStep;

      const goalChance = 0.18;

      if(Math.random() < goalChance){
        if(Math.random() < 0.5){
          match.live.score.home++;
        } else {
          match.live.score.away++;
        }
      }

      if(match.live.minute >= 90){
        match.live.minute = 90;
        match.live.running = false;

        match.result = {
          home: match.live.score.home,
          away: match.live.score.away
        };

        match._processed = true;
      }

    });

    const schedule = league?.schedule;

    if(schedule){
      const allDone = schedule.every(round =>
        round.every(m => m._processed)
      );

      if(allDone){
        stopBackgroundSimulation();
        console.log("🏁 Saison beendet (Simulation gestoppt)");
      }
    }

    if(game.ui?.tab === "table" || game.ui?.tab === "match"){
      updateUI();
    }

  }, 2000);
}

// =========================
// 🔥 EVENT RENDER
// =========================
function renderEvents(){

  const events = game.events?.history || [];

  const feed = document.getElementById("liveFeed");
  const headline = document.getElementById("eventText");

  if(feed){
    feed.innerHTML = events.length > 0
      ? events.slice(-20).reverse()
    .map(e => {
      const safeText = String(e.text)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
      return `<div>${e.minute}' - ${safeText}</div>`;
    })
      .join("")
      : "";
  }

  const top = events.at(-1);

  if(headline){
    headline.textContent = top
      ? `${top.minute}' - ${top.text}`
      : "";
  }
}

// =========================
// 🔗 EVENT BINDINGS
// =========================
function initEventBindings(){

  on(EVENTS.STATE_CHANGED, () => {
    renderEvents();
  });

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

    // 🔥 Sync back
    game.league.currentRound = game.league.currentRound;

    updateUI();
    renderEvents();
    renderSchedule();
  });
}

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

function getMatchForMyTeam(round){

  const myTeamId = normalizeId(game.team?.selectedId);

  const match = round?.find(m =>
    normalizeId(m.homeTeamId) === myTeamId ||
    normalizeId(m.awayTeamId) === myTeamId
  );

  return match || null;
}

// =========================
// 📍 PLZ → REGION → LIGA
// =========================
async function getRegionsByCode(code){
  const { data, error } = await supabase
    .from("region_codes")
    .select("region_id")
    .eq("country", "DE")
    .like("code", `${code}%`);
  
  if(error){
    console.error("❌ region_codes error:", error);
    return [];
  }

  return data || [];
}

async function findLeaguesByCode(input){

  if(!input || input.length < 3) return [];

  const code = input.slice(0,3);
  const regions = await getRegionsByCode(code);

  if(!regions.length){
    console.warn("❌ Keine Region für PLZ:", code);
    return [];
  }

  const regionIds = regions.map(r => r.region_id);

  const matches = (game.league?.available || []).filter(l => {
    if(!l.region_id) return false;

    return regionIds.some(r =>
      String(r).trim() === String(l.region_id).trim()
    );
  });

  if(!matches.length){
    console.warn("❌ Keine Liga für Region gefunden");
    return [];
  }

  return matches;
}

async function autoSelectLeagueByPLZ(input){

  const leagues = await findLeaguesByCode(input);
  if(!leagues.length) return;

  console.log("🎯 PLZ MATCH:", leagues);

  leagues.sort((a,b) => (a.level || 99) - (b.level || 99));

  const best = leagues[0];
  setLeagueById(best.id);
}

// =========================
// 🔎 PLZ SEARCH UI (DEIN DIV)
// =========================
const plzInput = document.getElementById("plzInput");
const resultsEl = document.getElementById("leagueResults");

// =========================
// 🔥 APP VISIBILITY CONTROLLER (GLOBAL!)
// =========================
function handleAppVisibility(){

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  const teamReady = game.team?.selectedId;

  if(teamReady){

    console.log("🎮 GAME START (team selected)");

    splash && (splash.style.display = "none");
    app && app.classList.remove("hidden");

    // ⚠️ wichtig: nur 1x initialisieren!
    if(!window.__appStarted){
      initOverlayManager();
      initMainButton();
      window.__appStarted = true;
    }

    updateUI();
    updateMainButtonText();

  } else {

    console.log("🟡 WAITING FOR TEAM SELECTION");

    splash && (splash.style.display = "flex");
    app && app.classList.add("hidden");
  }
}


// =========================
// 🔎 INPUT HANDLER
// =========================
plzInput?.addEventListener("input", async (e) => {

  const value = e.target.value;

  if(!value || value.length < 3){
    resultsEl.innerHTML = "";
    return;
  }

  const leagues = await findLeaguesByCode(value);

  if(!leagues.length){
    resultsEl.innerHTML = `<div style="padding:8px;opacity:0.6">Keine Ligen gefunden</div>`;
    return;
  }

  leagues.sort((a,b) => (a.level || 99) - (b.level || 99));

  // =========================
  // 🎯 RENDER RESULTS
  // =========================
  resultsEl.innerHTML = leagues.map(l => `
    <div class="league-result" data-id="${l.id}">
      ${l.name}
    </div>
  `).join("");


  // =========================
  // 🖱 CLICK HANDLER (CLEAN)
  // =========================
  resultsEl.querySelectorAll(".league-result").forEach(el => {

    el.onclick = () => {

      const id = el.dataset.id;

      if(!id){
        console.warn("❌ Kein League ID gefunden");
        return;
      }

      console.log("🎯 PLZ SELECT:", id);

      try {
        setLeagueById(id);
      } catch(e){
        console.error("❌ setLeagueById crashed:", e);
        return;
      }

      resultsEl.innerHTML = "";

      updateUI?.();
      updateMainButtonText?.();

      console.log("✅ League gesetzt:", {
        league: game.league?.current?.name,
        teams: game.league?.current?.teams?.length
      });

      // 🔥 WICHTIG: WAIT FOR TEAM
      setTimeout(() => {

        if(game.team?.selectedId){
          handleAppVisibility();
        } else {

          console.warn("⚠️ Team noch nicht gesetzt → retry");

          setTimeout(() => {
            if(game.team?.selectedId){
              handleAppVisibility();
            } else {
              console.error("❌ Team wurde nie gesetzt");
            }
          }, 300);

        }

      }, 120);
    };

  });

  // =========================
  // ⚡ AUTO SELECT
  // =========================
  if(leagues.length === 1){
    setLeagueById(leagues[0].id);
    resultsEl.innerHTML = "";
  }

});


// =========================
// 🧠 OVERLAY MANAGER
// =========================
function initOverlayManager(){

  console.log("🧠 Overlay Manager active");

  setInterval(() => {

    const matchOverlay = document.getElementById("matchOverlay");
    const live = game.match?.live;

    if(live?.running && game.ui?.tacticsOpen){
      game.ui.tacticsOpen = false;
    }

    if(game.ui?.tacticsOpen && matchOverlay){
      matchOverlay.classList.remove("show");
      matchOverlay.classList.add("hidden");
    }

  }, 200);
}


// =========================
// 🚀 INIT
// =========================
async function init(){

  window.game = game;

  initEventBindings();
  startAdEngine();

  try {

    // =========================
    // 👥 PLAYERS
    // =========================
    const players = await loadPlayers();
    window.playerPool = players || [];

    console.log("👥 Players loaded:", window.playerPool.length);

    // =========================
    // 🏆 TEAMS
    // =========================
    const { data: teamsRaw, error: teamsError } =
      await supabase.from("teams").select("*");

    if(teamsError){
      console.error("❌ Teams load failed:", teamsError);
    }

    const teams = teamsRaw || [];
    window.teams = teams;

    console.log("🏆 Teams loaded:", teams.length);

    // =========================
    // 🏟 COMPETITIONS
    // =========================
    const { data: competitionsRaw, error: compError } =
      await supabase
        .from("competitions")
        .select(`
          *,
          regions (
            name,
            states ( name )
          )
        `);

    if(compError){
      console.error("❌ Competitions load failed:", compError);
    }

    const competitions = competitionsRaw || [];

    console.log("🏟 Competitions loaded:", competitions.length);

    // =========================
    // 🧪 DEBUG
    // =========================
    window.debugData = {
      teams,
      competitions,
      players: window.playerPool
    };

    console.log("🧪 DEBUG READY → window.debugData");

    // =========================
    // 🎮 GAME EVENTS
    // =========================
    const { data: gameEvents } = await supabase
      .from("game_events")
      .select("*");

    console.log("🎮 GAME EVENTS LOADED:", gameEvents?.length || 0);

    // =========================
    // 🧠 LEAGUE BUILD
    // =========================
    const leagueMap = new Map();

    competitions.forEach(c => {

      if(!c) return;

      const rawName = (c.name || "").trim();
      const name = rawName.toLowerCase();

      if(!c.level) return;
      if(c.level > 7) return;

      if(name.includes("(region)")) return;
      if(name.includes("kreisliga b")) return;
      if(name.includes("kreisliga c")) return;
      if(name.includes("kreisliga d")) return;
      if(/\sa\s\d+$/.test(name)) return;

      const leagueId = String(c.id);
      if(leagueMap.has(leagueId)) return;

      let leagueTeams = teams.filter(t => {

        if(!t) return false;

        if(t.competition_id && c.id){
          return String(t.competition_id) === String(c.id);
        }

        const teamLeagueName =
          (t.league || t.league_name || "").toLowerCase().trim();

        return teamLeagueName === name;
      });
 console.log("🚀 MAIN LOADED");

document.addEventListener("click", () => {
  console.log("🖱 ANY CLICK");
});

// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import { initLeagueSelect, setLeagueById } from "./modules/league.js";
import "./core/eventStore.js";
import { loadPlayers } from "./modules/loader.js";
import { loadGameEvents, subscribeGameEvents } from "./services/gameEventsRealtime.js";

// =========================
// 🔌 SUPABASE
// =========================
import { supabase } from "./client.js";

// =========================
// 🔧 MODULES
// =========================
import { startAdEngine } from "./modules/ads.js";
import { advanceSchedule, renderSchedule } from "./modules/scheduler.js";
import { importPlayers } from "../tools/importer.js";
import { buildAllTeams } from "./modules/teamGenerator.js";

// =========================
// 🎮 ENGINE
// =========================
import { runMatchLoop, initMatch } from "./matchEngine.js";

// =========================
// 🖥 UI
// =========================
import { updateUI } from "./ui/ui.js";

// =========================
// 🔥 GLOBAL FLAGS
// =========================
let matchLoopRunning = false;
let simInterval = null;
window.importPlayers = importPlayers;
window.buildAllTeams = buildAllTeams;

// =========================
// 🔥 START GAME EVENTS
// =========================
async function startGame(){
  await loadGameEvents();
  subscribeGameEvents();
}
startGame();

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

function getMatchForMyTeam(round){
  const myTeamId = normalizeId(game.team?.selectedId);
  return round?.find(m =>
    normalizeId(m.homeTeamId) === myTeamId ||
    normalizeId(m.awayTeamId) === myTeamId
  ) || null;
}

// =========================
// 🔥 BACKGROUND SIM
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

      match.live.minute += Math.floor(Math.random() * 5) + 1;

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

    if(game.ui?.tab === "table" || game.ui?.tab === "match"){
      updateUI();
    }

  }, 2000);
}

// =========================
// 🔥 EVENT BINDINGS
// =========================
function initEventBindings(){

  on(EVENTS.STATE_CHANGED, renderEvents);

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
    updateUI();
    renderEvents();
    renderSchedule();
  });
}

// =========================
// 🔥 EVENT RENDER
// =========================
function renderEvents(){

  const events = game.events?.history || [];

  const feed = document.getElementById("liveFeed");
  const headline = document.getElementById("eventText");

  if(feed){
    feed.innerHTML = events.slice(-20).reverse()
      .map(e => `<div>${e.minute}' - ${e.text}</div>`)
      .join("");
  }

  const top = events.at(-1);
  if(headline){
    headline.textContent = top ? `${top.minute}' - ${top.text}` : "";
  }
}

// =========================
// 🔥 APP VISIBILITY
// =========================
function handleAppVisibility(){

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  if(game.team?.selectedId){

    splash && (splash.style.display = "none");
    app && app.classList.remove("hidden");

    if(!window.__appStarted){
      initOverlayManager();
      initMainButton();
      window.__appStarted = true;
    }

    updateUI();
    updateMainButtonText();

  } else {
    splash && (splash.style.display = "flex");
    app && app.classList.add("hidden");
  }
}

// =========================
// 🔎 PLZ SEARCH
// =========================
const plzInput = document.getElementById("plzInput");
const resultsEl = document.getElementById("leagueResults");

plzInput?.addEventListener("input", async (e) => {

  const value = e.target.value;
  if(!value || value.length < 3){
    resultsEl.innerHTML = "";
    return;
  }

  const leagues = await findLeaguesByCode(value);

  resultsEl.innerHTML = leagues.map(l => `
    <div class="league-result" data-id="${l.id}">
      ${l.name}
    </div>
  `).join("");

  resultsEl.querySelectorAll(".league-result").forEach(el => {
    el.onclick = () => {

      const id = el.dataset.id;
      if(!id) return;

      setLeagueById(id);
      resultsEl.innerHTML = "";

      setTimeout(handleAppVisibility, 150);
    };
  });
});

// =========================
// 🧠 OVERLAY
// =========================
function initOverlayManager(){
  setInterval(() => {
    const matchOverlay = document.getElementById("matchOverlay");
    if(game.ui?.tacticsOpen && matchOverlay){
      matchOverlay.classList.add("hidden");
    }
  }, 200);
}

// =========================
// ▶️ MAIN BUTTON
// =========================
let mainBtn = null;

function updateMainButtonText(){

  mainBtn = document.getElementById("startBtn");
  const live = game.match?.live;
  if(!mainBtn || !live) return;

  if(live.minute >= 90) mainBtn.textContent = "Next Match";
  else if(live.running) mainBtn.textContent = "Pause";
  else mainBtn.textContent = "Start Match";
}

function handleMainButtonClick(){

  let live = game.match?.live;
  const league = game.league?.current;
  if(!league) return;

  if(!live){
    const round = league.schedule[game.league?.currentRound || 0];
    const match = getMatchForMyTeam(round) || round[0];
    if(!initMatch([match])) return;
    live = game.match.live;
  }

  if(live.running){
    live.running = false;
    matchLoopRunning = false;
    return;
  }

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
}

function initMainButton(){
  document.addEventListener("click", (e) => {
    if(e.target.closest("#startBtn")){
      handleMainButtonClick();
    }
  });
}

// =========================
// 🚀 INIT
// =========================
async function init(){

  window.game = game;

  initEventBindings();
  startAdEngine();

  // 🔥 HIER WICHTIG
  handleAppVisibility();
}

document.addEventListener("DOMContentLoaded", init);

export { init };
