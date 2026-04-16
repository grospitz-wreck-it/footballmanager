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
// 📍 PLZ → REGION → LIGA (FINAL UI READY)
// =========================

// 🔹 Regionen aus PLZ holen
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


// 🔹 passende Ligen finden
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


// 🔥 HAUPTFUNKTION → AUTO SELECT (optional)
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

plzInput?.addEventListener("input", async (e) => {

  const value = e.target.value;

  // 👉 reset wenn zu kurz
  if(!value || value.length < 3){
    resultsEl.innerHTML = "";
    return;
  }

  const leagues = await findLeaguesByCode(value);

  if(!leagues.length){
    resultsEl.innerHTML = `<div style="padding:8px;opacity:0.6">Keine Ligen gefunden</div>`;
    return;
  }

  // 🔥 sort nach Level (falls vorhanden)
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
  };

});

  // =========================
  // ⚡ AUTO SELECT (wenn nur 1 Ergebnis)
  // =========================
  if(leagues.length === 1){
    setLeagueById(leagues[0].id);
    resultsEl.innerHTML = "";
  }

});

function initOverlayManager(){

  console.log("🧠 Overlay Manager active");

  setInterval(() => {

    const matchOverlay = document.getElementById("matchOverlay");
    const live = game.match?.live;

    // =========================
    // 🎮 MATCH START → CLOSE TACTICS
    // =========================
    if(live?.running && game.ui?.tacticsOpen){
      game.ui.tacticsOpen = false;
    }

    // =========================
    // ⚙️ TACTICS PRIORITY
    // =========================
    if(game.ui?.tacticsOpen && matchOverlay){
      matchOverlay.classList.remove("show");
      matchOverlay.classList.add("hidden");
    }

    // ❌ ENTFERNT:
    // kein permanentes hidden setzen mehr!

  }, 200);
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
// 🧠 LEAGUE BUILD (FINAL CLEAN)
// =========================
const leagueMap = new Map();

competitions.forEach(c => {

  if(!c) return;

  const rawName = (c.name || "").trim();
  const name = rawName.toLowerCase();

  // =========================
  // 🎯 FILTER
  // =========================
  if(!c.level) return;
  if(c.level > 7) return;

  // Müll raus
  if(name.includes("(region)")) return;
  if(name.includes("kreisliga b")) return;
  if(name.includes("kreisliga c")) return;
  if(name.includes("kreisliga d")) return;
  if(/\sa\s\d+$/.test(name)) return; // A 1, A 2 ...

  const leagueId = String(c.id);

  // Duplicate Guard
  if(leagueMap.has(leagueId)) return;

  // =========================
  // 🔥 TEAM MATCH (ROBUST)
  // =========================
  let leagueTeams = teams.filter(t => {

    if(!t) return false;

    // ✅ PRIMARY (UUID match)
    if(t.competition_id && c.id){
      return String(t.competition_id) === String(c.id);
    }

    // 🔄 FALLBACK (Name match)
    const teamLeagueName =
      (t.league || t.league_name || "").toLowerCase().trim();

    return teamLeagueName === name;
  });

  // =========================
  // 🧪 DEBUG (nur wenn kaputt)
  // =========================
  if(leagueTeams.length < 2){

    console.warn("⚠️ Zu wenig Teams für Liga:", rawName, leagueTeams.length);

    const sample = teams.slice(0,5).map(t => ({
      name: t.name,
      comp: t.competition_id
    }));

    console.log("👉 Beispiel Teams:", sample);

    return;
  }

  // =========================
  // 🧠 DISPLAY NAME FIX
  // =========================
  const regionName =
    c.regions?.name ||
    c.regions?.states?.name ||
    "";

  let displayName = rawName;

  // 👉 Region anhängen wenn sinnvoll
  if(regionName && !rawName.toLowerCase().includes(regionName.toLowerCase())){
    displayName = `${rawName} (${regionName})`;
  }

  // 👉 harte Fixes für generische Namen
  if(rawName === "Kreisliga A"){
    displayName = `Kreisliga A (${regionName || "Unbekannt"})`;
  }

  // 👉 Cleanup
  displayName = displayName
    .replace("(Region)", "")
    .replace(/\s+/g, " ")
    .trim();

  // =========================
  // ✅ SUCCESS
  // =========================
  console.log("✅ LEAGUE OK:", displayName, "| teams:", leagueTeams.length);

  // =========================
  // 🏗 BUILD
  // =========================
  leagueMap.set(leagueId, {
    id: leagueId,
    name: displayName,
    raw_name: rawName,      // 🔥 wichtig für später
    region_id: c.region_id, // 🔥 für PLZ
    teams: leagueTeams
  });

});

// ✅ WICHTIG: NACH DEM LOOP
const leagues = Array.from(leagueMap.values());

game.leagues = leagues;
game.league = game.league || {};
game.league.available = leagues;

console.log("🏁 Leagues built:", leagues.length);

initLeagueSelect(game.league.available);

if(game.league.available?.length){
  setLeagueById(game.league.available[0].id);
}

// =========================
// 🔥 APP START (FINAL SAFE)
// =========================

if(game.team?.selectedId){

  console.log("🎮 GAME START (team selected)");

  // 🔥 Splash wirklich entfernen (blockiert sonst alles)
  if(splash){
    splash.style.display = "none";
  }

  // 🔥 App sichtbar machen
  if(app){
    app.classList.remove("hidden");
  }

  // 🔥 Systeme initialisieren (Reihenfolge wichtig!)
  initOverlayManager();
  initMainButton();

  // 🔥 UI rendern
  updateUI();

  // 🔥 Button Text korrekt setzen
  updateMainButtonText();

} else {

  console.log("🟡 WAITING FOR TEAM SELECTION");

  // 👉 Splash bleibt sichtbar
  if(splash){
    splash.style.display = "flex";
  }

  // 👉 App verstecken bis Auswahl
  if(app){
    app.classList.add("hidden");
  }
}


// =========================
// ▶️ MAIN BUTTON (REAL FIX)
// =========================

let mainBtn = null;

// =========================
// 🔤 TEXT UPDATE
// =========================
function updateMainButtonText(){

  mainBtn = document.getElementById("startBtn");

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

// =========================
// 🔥 CLICK LOGIC
// =========================
function handleMainButtonClick(){

  console.log("🔥 BUTTON CLICKED ✅");

  let live = game.match?.live;
  const league = game.league?.current;

  if(!league){
    console.warn("❌ Keine Liga geladen");
    return;
  }

  if(!league.schedule || !league.schedule.length){
    console.warn("❌ Kein Schedule vorhanden");
    return;
  }

  if(game.phase === "setup"){
    game.phase = "idle";
  }

  // =========================
  // 🆕 MATCH INIT
  // =========================
  if(!live){

    const round = league.schedule[game.league?.currentRound || 0];
    if(!round?.length) return;

    let match = getMatchForMyTeam(round) || round[0];

    const ok = initMatch([match]);
    if(!ok) return;

    live = game.match.live;

    if(live){
      live.running = false;
      live.phase = "first_half";
    }
  }

  if(!live) return;

  // =========================
  // 🏁 NEXT MATCH
  // =========================
  if(live.minute >= 90){

    game.league.currentRound++;

    const round = league.schedule[game.league?.currentRound || 0];
    if(!round?.length) return;

    let match = getMatchForMyTeam(round) || round[0];

    const ok = initMatch([match]);
    if(!ok) return;

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

    renderSchedule();
    updateUI();
    updateMainButtonText();
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
  }
}

// =========================
// 🔥 EIN EINZIGER GLOBAL LISTENER (KEY FIX)
// =========================
function initMainButton(){

  console.log("🔧 initMainButton ACTIVE");

  document.addEventListener("click", (e) => {

    const btn = e.target.closest("#startBtn");

    if(!btn) return;

    console.log("🎯 MATCHED startBtn");

    mainBtn = btn;

    handleMainButtonClick();
  });
}

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
