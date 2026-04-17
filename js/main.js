console.log("🚀 MAIN.JS LOADED");

// =========================
// 📦 IMPORTS (CLEAN)
// =========================

// CORE
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import "./core/eventStore.js";

// SUPABASE
import { supabase } from "./client.js";

// MODULES
import { initLeagueSelect, setLeagueById } from "./modules/league.js";
import { loadPlayers } from "./modules/loader.js";
import { startAdEngine } from "./modules/ads.js";
import { generateSchedule, advanceSchedule, renderSchedule, nextMatch } from "./modules/scheduler.js";
import { initTable } from "./modules/table.js";
import { initPlayerPool } from "./modules/playerPool.js";
import { buildAllTeams } from "./modules/teamGenerator.js";

// TOOLS
import { importPlayers } from "../tools/importer.js";
window.importPlayers = importPlayers;
window.buildAllTeams = buildAllTeams;

// ENGINE
import { runMatchLoop, initMatch, simulateOtherMatches } from "./matchEngine.js";
import { initMatchEventSlides } from "./engine/matchEventSlideSystem.js";

// SERVICES
import { loadGame } from "./services/storage.js";
import { loadGameEvents, subscribeGameEvents } from "./services/gameEventsRealtime.js";

// UI
import { updateUI } from "./ui/ui.js";

// DEBUG
import { initDebugOverlay } from "../debug/debugOverlay.js";

console.log("🔥 IMPORTS DONE");


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

  if(!myTeamId){
    console.warn("❌ Kein Team gewählt");
    return null;
  }

  if(!round || !round.length){
    console.warn("❌ Kein Round vorhanden");
    return null;
  }

  const match = round.find(m => {

    const home = normalizeId(m.homeTeamId);
    const away = normalizeId(m.awayTeamId);

    return home === myTeamId || away === myTeamId;
  });

  // 🔥 DEBUG
  console.log("🔍 MATCH SEARCH:", {
    myTeamId,
    found: !!match,
    round: round.map(m => ({
      home: m.homeTeamId,
      away: m.awayTeamId
    }))
  });

  return match || null;
}

function handleAppVisibility(){

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  if(game.team?.selectedId){

    splash && (splash.style.display = "none");
    app && app.classList.remove("hidden");

  } else {

    splash && (splash.style.display = "flex");
    app && app.classList.add("hidden");
  }
}



// =========================
// 📍 DISTRICT AUS PLZ₃ HOLEN
// =========================
async function getDistrictsByPLZPrefix(code){

  if(!code) return [];

  const { data, error } = await supabase
    .from("cities")
    .select("district_id")
    .eq("plz", code); // 🔥 plz_3

  if(error){
    console.error("❌ cities lookup error:", error);
    return [];
  }

  const districtIds = [...new Set(
    (data || [])
      .map(d => d.district_id)
      .filter(Boolean)
      .map(id => String(id).trim())
  )];

  console.log("🌍 DISTRICTS:", districtIds);

  return districtIds;
}


// =========================
// 🔎 LIGEN FINDEN (PLZ₃ FIX)
// =========================
async function findLeaguesByCode(input){

  console.log("🔍 INPUT:", input);
  console.log("📦 AVAILABLE LEAGUES:", game.league?.available);

  if(!input || input.length < 3) return [];

  const leagues = game.league?.available || [];

  console.log("📦 AVAILABLE LEAGUES:", leagues.length);

  // =========================
  // ⏳ RETRY
  // =========================
  if(!leagues.length){
    console.warn("⏳ Ligen noch nicht geladen → retry");

    await new Promise(r => setTimeout(r, 200));

    const retryLeagues = game.league?.available || [];

    if(!retryLeagues.length){
      return [];
    }

    return retryLeagues;
  }

  // 🔥 3-stellig (MASTERPROMPT)
  const code = input.slice(0, 3);

  let districtIds = [];

  try {
    districtIds = await getDistrictsByPLZPrefix(code);
  } catch(e){
    console.warn("⚠️ District lookup failed", e);
  }

  // =========================
  // 🔥 FALLBACK
  // =========================
  if(!districtIds || districtIds.length === 0){
    console.warn("⚠️ KEIN DISTRICT → nehme ALLE Ligen");
    return leagues;
  }

  console.log("🧠 DISTRICT IDS:", districtIds);

  // =========================
  // 🎯 FILTER
  // =========================
  const matches = leagues.filter(l => {

    console.log("CHECK:", {
      league: l.name,
      leagueDistrict: l.district_id,
      districtIds
    });

    // 👉 Ligen ohne district (z.B. Bezirksliga)
    if(!l.district_id) return true;

    const leagueDistrict = String(l.district_id).trim();

    return districtIds.includes(leagueDistrict);
  });

  // =========================
  // 🔥 FALLBACK 2
  // =========================
  if(!matches.length){
    console.warn("⚠️ KEINE MATCHES → nehme ALLE Ligen");
    return leagues;
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
    window.playerPool = (players || []).map(p => ({
  ...p,
  team_id: (p.team_id === "null" || p.team_id === undefined)
    ? null
    : p.team_id
}));

console.log("🧼 CLEANED PLAYERS:", window.playerPool.slice(0,5));


    
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
  id,
  name,
  level,
  region_id,
  regions (
    id,
    name,
    states ( name )
  )
`)

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
  .from("event_definitions")
  .select("*");

    console.log("🎮 GAME EVENTS LOADED:", gameEvents?.length || 0);

    // =========================
// 🧠 LEAGUE BUILD (FINAL CLEAN)
// =========================
const leagueMap = new Map();
// 🔥 HIER REIN
console.log("🧪 START LEAGUE BUILD");
console.log("🧪 competitions:", competitions);
console.log("🧪 teams:", teams);
competitions.forEach(c => {
console.log("🔁 COMP:", c?.name, c?.id);
  console.log("👉 region_id:", c?.region_id);
  if(!c) return;

  const rawName = (c.name || "").trim();
  const name = rawName.toLowerCase();

  // =========================
  // 🎯 FILTER
  // =========================
  

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
// 🔥 TEAM FILTER (FIX CRITICAL)
// =========================
let leagueTeams = teams.filter(t =>
  String(t.competition_id) === String(c.id)
);

// 🔥 SAFETY FALLBACK
if(!leagueTeams.length){
  console.warn("⚠️ Keine Teams für Liga → fallback:", c.name);

  leagueTeams = teams.slice(0, 10); // temporär fallback
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
  raw_name: rawName,
  region_id: c.region_id,
  teams: leagueTeams
});

});

// ✅ NACH DEM LOOP
const leagues = Array.from(leagueMap.values());

console.log("🧪 RAW LEAGUE MAP:", leagueMap);
console.log("🧪 BUILT LEAGUES:", leagues);

game.leagues = leagues;
game.league = game.league || {};
game.league.available = leagues;

console.log("🏁 Leagues built:", leagues.length);
    const plzInputEl = document.getElementById("plzInput");

if(plzInputEl){
  plzInputEl.disabled = false;
  console.log("✅ PLZ ready");
}
// =========================
// 🏆 LEAGUE SELECT
// =========================
initLeagueSelect(game.league.available);

// 🔥 WICHTIG: Default Liga setzen
if(game.league.available?.length){
  setLeagueById(game.league.available[0].id);
  generateSchedule();
}
// =========================
// 🔎 PLZ BINDING (FIXED)
// =========================
function bindPLZInput(){

  console.log("🚀 bindPLZInput CALLED");

  const plzInput = document.getElementById("plzInput");
  const resultsEl = document.getElementById("leagueResults");

  if(!plzInput || !resultsEl){
    console.error("❌ PLZ UI Elemente fehlen");
    return;
  }

  // 🔥 WICHTIG: NICHT hier aktivieren!
  // wird später in init gemacht

  plzInput.oninput = async (e) => {

    const value = e.target.value;

    console.log("🔥 INPUT EVENT:", value);

    // 👉 warten bis Ligen geladen sind
    if(!game.league?.available?.length){
      console.warn("⏳ warten auf Ligen...");
      return;
    }

    // 👉 reset
    if(!value || value.length < 2){
      resultsEl.innerHTML = "";
      return;
    }

    const leagues = await findLeaguesByCode(value);

    console.log("🏆 FOUND LEAGUES:", leagues);

    if(!leagues || !leagues.length){
      resultsEl.innerHTML = `<div style="padding:8px;opacity:0.6">Keine Ligen gefunden</div>`;
      return;
    }

    leagues.sort((a,b) => (a.level || 99) - (b.level || 99));

    // 👉 render liste
    resultsEl.innerHTML = leagues.map(l => `
      <div class="league-result" data-id="${l.id}">
        ${l.name || l.display_name}
      </div>
    `).join("");

    // 👉 click handler
    resultsEl.querySelectorAll(".league-result").forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        if(!id) return;

        setLeagueById(id);
        resultsEl.innerHTML = "";
      };
    });

    // 👉 auto select (1 Ergebnis)
    if(leagues.length === 1){

      const league = leagues[0];

      resultsEl.innerHTML = `
        <div style="padding:8px;color:#4caf50">
          ✅ ${league.name} ausgewählt
        </div>
      `;

      setLeagueById(league.id);

      setTimeout(() => {
        resultsEl.innerHTML = "";
      }, 1200);
    }

  };

  console.log("✅ PLZ Input gebunden");
}

    
// =========================
// 🔥 WICHTIG: AUFRUF!
// =========================
bindPLZInput();

// =========================
// UI
// =========================
handleAppVisibility();
updateUI();
} catch(e){
    console.error("💥 INIT CRASH:", e);
  }
}


// =========================
// ▶️ MAIN BUTTON (FINAL FIX)
// =========================
const mainBtn = document.getElementById("mainButton");

function updateMainButtonText(){

  const live = game.match?.live;

  if(!mainBtn){
    console.warn("⚠️ mainButton fehlt im DOM");
    return;
  }

  if(!live){
    mainBtn.textContent = "Start Match";
    return;
  }

  if(live.phase === "bye"){
    mainBtn.textContent = "No Match";
  }
  else if(live.minute >= 90){
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

  // =========================
  // ❌ KEINE LIGA
  // =========================
  if(!league){
    console.warn("❌ Keine Liga aktiv");
    return;
  }

  if(game.phase === "setup"){
    game.phase = "idle";
  }

  // =========================
  // 🆕 INIT MATCH
  // =========================
  if(!live){

  // 🔥 RICHTIG: einzelnes Match holen
  const match = nextMatch();

  if(!match){
    console.warn("❌ Kein Match verfügbar");
    return;
  }

  console.log("🎯 MATCH GEFUNDEN:", {
    home: match.homeTeamId,
    away: match.awayTeamId,
    myTeam: game.team?.selectedId
  });

  const ok = initMatch(match);

  if(!ok){
    console.error("❌ initMatch fehlgeschlagen");
    return;
  }

  live = game.match?.live;

  if(!live){
    console.error("❌ Live-State fehlt");
    return;
  }

  // 🔥 saubere Initialisierung
  live.running = false;
  live.phase = "first_half";
  live.minute = live.minute || 0;
}

if(!live){
  console.warn("❌ Kein Live-State nach Init");
  return;
}


 // =========================
// 🚫 BYE → AUTO SKIP
// =========================
if(live.phase === "bye"){
  console.warn("⚽ Spielfrei → skip");

  // =========================
  // 🖥 UI FEEDBACK
  // =========================
  const feed = document.getElementById("liveFeed");
  if(feed){
    feed.innerHTML = `<div style="padding:8px;color:#999">Spielfrei – nächster Spieltag...</div>`;
  }

  // =========================
  // ⏭ NEXT ROUND
  // =========================
  game.league.currentRound++;

  const nextRound = league.schedule?.[game.league.currentRound];

  if(!nextRound){
    console.warn("🏁 Saison Ende erreicht");
    return;
  }

  // =========================
  // 🆕 INIT MATCH
  // =========================
  const ok = initMatch(nextRound);
  if(!ok){
    console.error("❌ Skip Match init fehlgeschlagen");
    return;
  }

  // =========================
  // 🤖 ANDERE MATCHES SIMULIEREN
  // =========================
  simulateOtherMatches(nextRound);

  // =========================
  // 🔥 EVENT SYSTEM RESET (WICHTIG!)
  // =========================
  game.events = game.events || {};
  game.events.history = [];

  // =========================
  // 🧠 MATCH STATE FIX
  // =========================
  if(game.match?.live){
    game.match.live.running = false;   // wartet auf Button
    game.match.live.phase = "first_half";
    game.match.live.minute = 0;
  }

  matchLoopRunning = false;

  // =========================
  // 🖥 UI UPDATE
  // =========================
  updateUI();
  updateMainButtonText();

  return;
}


  
  // =========================
  // 🏁 NEXT MATCH
  // =========================
  if(live.minute >= 90){

    game.league.currentRound++;

    const round = league.schedule?.[game.league?.currentRound || 0];

    if(!round){
      console.warn("🏁 Saison Ende erreicht");
      return;
    }

    const ok = initMatch(round);

    if(!ok){
      console.error("❌ Next Match init fehlgeschlagen");
      return;
    }

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

}); // ✅ EINZIGER CLOSING BLOCK



// =========================
// 🔄 RESET
// =========================
document.getElementById("resetBtn")?.addEventListener("click", async () => {

  const m = await import("./services/storage.js");
  m.resetGame();

  // =========================
  // 🔥 UI NEU BEWERTEN
  // =========================
  handleAppVisibility();
  updateUI();

});

// =========================
// ▶️ START
// =========================
init();
