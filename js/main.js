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

  await loadGameEvents();     // 🔥 zuerst laden
  subscribeGameEvents();      // 🔴 dann realtime starten

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
// 🤖 BACKGROUND SIMULATION (NEW)
// =========================

// =========================
// 🤖 BACKGROUND SIMULATION (FINAL)
// =========================
function startBackgroundSimulation(){

  if(simInterval) return;

  simInterval = setInterval(() => {

    const league = game.league?.current;
    const round = league?.schedule?.[game.league.currentRound || 0];
    if(!round) return;

    const myTeamId = normalizeId(game.team?.selectedId);

    round.forEach(match => {

      // =========================
      // ⛔ eigenes Spiel skippen
      // =========================
      if(
        normalizeId(match.homeTeamId) === myTeamId ||
        normalizeId(match.awayTeamId) === myTeamId
      ) return;

      // =========================
      // ⛔ bereits fertig
      // =========================
        if(match._processed || match.live?.running === false) return;
      // =========================
      // 🟡 LIVE INIT
      // =========================

if(!match.live){
  match.live = {
    minute: 0,
    score: { home: 0, away: 0 },
    running: true,
    started: false,              // 🔥 NEU
    startDelay: Math.random() * 6 // 🔥 0–6 Sekunden Delay
  };
}

      // =========================
// ⏳ START DELAY
// =========================
if(!match.live.started){

  match.live.startDelay -= 2; // weil dein Interval 2000ms ist

  if(match.live.startDelay > 0){
    return; // ⛔ noch nicht starten
  }

  match.live.started = true;
}

      // =========================
      // ⏱ ZEITFORTSCHRITT
      // =========================
      const timeStep = Math.floor(Math.random() * 5) + 1; // 1–5 Minuten
      match.live.minute += timeStep;

      // =========================
      // ⚽ TORE
      // =========================
      const goalChance = 0.18; // feinjustiert

      if(Math.random() < goalChance){

        if(Math.random() < 0.5){
          match.live.score.home++;
        } else {
          match.live.score.away++;
        }
      }

      // =========================
      // 🏁 ABPFIFF
      // =========================
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
    // 🏁 SAISON ENDE CHECK
    // =========================
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

    // =========================
    // 🔄 UI UPDATE (smart)
    // =========================
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

  advanceSchedule(); // bleibt!

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

  return match || null; // ❗ KEIN FALLBACK MEHR
}


// =========================
// 🔥 PLZ FEATURE
// =========================
async function getRegionsByCode(code){
  return supabase
    .from("region_codes")
    .select("region_id")
    .eq("country", "DE")
    .eq("code", code);
}

async function findLeaguesByCode(input){

  if(!input || input.length < 2) return [];

  const code = input.slice(0,3);

  const { data } = await getRegionsByCode(code);
  if(!data?.length) return [];

  const regionIds = data.map(r => r.region_id);

  return game.league.available.filter(
    l => regionIds.includes(l.region_id)
  );
}

// =========================
// 🚀 INIT
// =========================
async function init(){

  window.game = game;

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

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
// 🧪 DEBUG KIT
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

  // =========================
  // 🧠 BASIC FILTER
  // =========================
  if(!c) return;

  const name = (c.name || "").toLowerCase().trim();

  if(c.level !== 7) return;

  // 🎯 nur echte Kreisliga A
  if(!name.includes("kreisliga a")) return;

  // ❌ Müll raus
  if(name.includes("(region)")) return;
  if(/\sa\s\d+$/.test(name)) return; // A 1, A 2, A 3, A 4

  // =========================
  // 🆔 STABILE ID (KEIN normalizeId!!)
  // =========================
  const leagueId = String(c.id);

  // 🔁 duplicate guard
  if(leagueMap.has(leagueId)) return;

  // =========================
  // 🔥 TEAM MATCH (FIXED)
  // =========================
  let leagueTeams = teams.filter(t => {

    if(!t) return false;

    // ✅ PRIMARY: UUID compare (FIX)
    if(t.competition_id && c.id){
      return String(t.competition_id) === String(c.id);
    }

    // 🔄 FALLBACK: Name Match (rare)
    const teamLeagueName =
      (t.league || t.league_name || "").toLowerCase().trim();

    return teamLeagueName === name;
  });

  // =========================
  // 🧪 DEBUG (SMART)
  // =========================
  if(leagueTeams.length < 2){

    console.warn("⚠️ Zu wenig Teams für Liga:", c.name, leagueTeams.length);

    // 👉 zeig passende IDs zur Diagnose
    const sample = teams.slice(0,5).map(t => ({
      name: t.name,
      comp: t.competition_id
    }));

    console.log("👉 Beispiel Teams:", sample);

    return;
  }

  // =========================
  // ✅ SUCCESS DEBUG
  // =========================
  console.log("✅ LEAGUE OK:", c.name, "| teams:", leagueTeams.length);

  // =========================
  // 🏗 BUILD LEAGUE
  // =========================
  leagueMap.set(leagueId, {
    id: leagueId,
    name: c.name,
    teams: leagueTeams
  });

});

   // =========================
// 📦 SAVE TO GAME (FIX)
// =========================
const leagues = Array.from(leagueMap.values());

game.leagues = leagues;

// 🔥 CRITICAL FIX (für Dropdown!)
game.league = game.league || {};
game.league.available = leagues;

console.log("🏁 Leagues built:", leagues.length);

   // =========================
// 🎯 LEAGUE DROPDOWN INIT (FIX)
// =========================
console.log("🎯 Init League Select:", game.league.available);

initLeagueSelect(game.league.available);

// 👉 AUTO SELECT FIRST LEAGUE
if(game.league.available?.length){
  setLeagueById(game.league.available[0].id);
}

// =========================
// 🚀 UI START
// =========================
splash?.classList.add("hidden");
app?.classList.remove("hidden");

updateUI();

  } catch(e){
    console.error("💥 INIT CRASH:", e);
  }
}


// =========================
// ▶️ MAIN BUTTON
// =========================
const mainBtn = document.getElementById("mainButton");

function updateMainButtonText(){

  const live = game.match?.live;
  if(!mainBtn || !live) return;

  if(live.minute >= 90){
    mainBtn.textContent = "Next Match";
  }
  else if(live.phase === "halftime"){
    mainBtn.textContent = "Start 2nd Half";
  }
  else if(live.running){
    mainBtn.textContent = "Pause";
  }
  else if(live.minute > 0){
    mainBtn.textContent = "Resume";
  }
  else{
    mainBtn.textContent = "Start Match";
  }
}

mainBtn?.addEventListener("click", () => {

  let live = game.match?.live;
  const league = game.league?.current;

  if(game.phase === "setup"){
    game.phase = "idle";
  }

  if(!live){
    const round = league?.schedule?.[game.league?.currentRound || 0];
    const match = getMatchForMyTeam(round);

    if(match){
      initMatch(round);
      live = game.match.live;

      live.running = false;
      live.phase = "first_half";
    }
  }

  if(!live){
    console.warn("❌ Kein Match");
    return;
  }

  // =========================
  // 🏁 NEXT MATCH
  // =========================
  if(live.minute >= 90){

    game.league.currentRound++;

    const round = league?.schedule?.[game.league?.currentRound || 0];
    const match = getMatchForMyTeam(round);

    if(match){
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
    }

    renderSchedule();
    updateUI();
    updateMainButtonText();
    return;
  }

  // =========================
  // ⏸ HALFTIME
  // =========================
  if(
    live.phase === "halftime" ||
    (live.minute === 45 && !live.running)
  ){

    if(!live.running){
      matchLoopRunning = false;
    }

    if(matchLoopRunning && live.running) return;

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
  // ▶️ START / RESUME
  // =========================
  if(live.running === false){

    if(matchLoopRunning) return;

    if(live.minute === 0){
      live.phase = "first_half";
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

    updateMainButtonText();
    return;
  }

  // =========================
  // ⏸ PAUSE
  // =========================
  if(live.running === true){
    live.running = false;
    matchLoopRunning = false;
    updateMainButtonText();
    return;
  }
});

// =========================
// 🔄 RESET
// =========================
document.getElementById("resetBtn")?.addEventListener("click", () => {
  import("./services/storage.js").then(m => m.resetGame());
});



// =========================
// ▶️ START
// =========================
document.addEventListener("DOMContentLoaded", init);

export { init };
