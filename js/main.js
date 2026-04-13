// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { track } from "../tools/analytics.js";
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
function startBackgroundSimulation(){

  if(simInterval) return;

  simInterval = setInterval(() => {

    const league = game.league.current;
    const round = league?.schedule?.[game.league.currentRound || 0];
    if(!round) return;

    round.forEach(match => {

      if(
        match.homeTeamId === game.team?.selectedId ||
        match.awayTeamId === game.team?.selectedId
      ) return;

      // 🔥 LIVE INIT (NEU)
      if(!match.live){
        match.live = {
          minute: 0,
          score: { home: 0, away: 0 }
        };
      }
      track("app_open");
      if(match._processed) return;

      // 🔥 Minute läuft hoch
      match.live.minute += Math.floor(Math.random() * 5);

      // 🔥 Tore fallen zufällig
      if(Math.random() < 0.2){
        if(Math.random() < 0.5){
          match.live.score.home++;
        } else {
          match.live.score.away++;
        }
      }

      // 🔥 Spiel wird beendet
      if(match.live.minute >= 90){

        match.result = {
          home: match.live.score.home,
          away: match.live.score.away
        };

        match._processed = true;
      }
    });

    updateUI();

  }, 2000);
}

function stopBackgroundSimulation(){
  if(simInterval){
    clearInterval(simInterval);
    simInterval = null;
  }
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
track("app_start");
  window.game = game;

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  initEventBindings();
  startAdEngine();

  try {


const players = await loadPlayers();
window.playerPool = players;

    const { data: teams } = await supabase.from("teams").select("*");

    const { data: competitions } = await supabase
  .from("competitions")
  .select(`
    *,
    regions (
      name,
      states ( name )
    )
  `);

// 🔥 GAME EVENTS LADEN (FIX)
const { data: gameEvents } = await supabase
  .from("game_events")
  .select("*");

console.log("🎮 GAME EVENTS LOADED:", gameEvents);

    const leagueMap = new Map();

    competitions.forEach(c => {

      const leagueId = normalizeId(c.id);
      if(leagueMap.has(leagueId)) return;

      if(c.level !== 7) return;
      if(!c.name?.toLowerCase().includes("kreisliga a")) return;

      const leagueTeams = teams.filter(
        t => normalizeId(t.competition_id) === leagueId
      );

      if(!leagueTeams.length) return;

      leagueMap.set(leagueId, {
        id: leagueId,
        name: `${c.name}${c.regions?.name ? " " + c.regions.name : ""}`,
        teams: leagueTeams.map(t => ({
          ...t,
          id: normalizeId(t.id)
        })),
        region_id: c.region_id,
        level: c.level
      });
    });

    const leagues = Array.from(leagueMap.values());

    if(!leagues.length){
      throw new Error("❌ Keine Ligen geladen");
    }

    game.data = {
  players,
  teams: teams.map(t => ({ ...t, id: normalizeId(t.id) })),
  competitions,
  leagues,

  // 🔥 CRITICAL FIX
  gameEvents: gameEvents || []
};

    game.league = game.league || {};
    game.league.available = leagues;

    game.players = players;
    initPlayerPool(players);

    const loaded = loadGame();

    if(!game.team?.selectedId){
      game.phase = "setup";
    }

    if(!game.league.current){
      game.league.current = leagues[0];
    }

    if(!game.league.current.schedule || !game.league.current.schedule.length){
      generateSchedule();
    }

    // 🔥 FIX
    if(game.league.currentRound === undefined){
      game.league.currentRound = 0;
    }

    initLeagueSelect();
    initTable();
    initDebugOverlay();
    initMatchEventSlides();
    renderSchedule();

    const plzInput = document.getElementById("plzInput");
    const results = document.getElementById("leagueResults");

    if(plzInput && results){

      plzInput.addEventListener("input", async (e) => {

        const value = e.target.value;

        if(value.length < 2){
          results.innerHTML = "";
          return;
        }

        const leagues = await findLeaguesByCode(value);

        results.innerHTML = leagues.map(l => `
          <div class="league-option" data-id="${l.id}">
            ${l.name}
          </div>
        `).join("");
      });

      results.addEventListener("click", (e) => {

        const el = e.target.closest(".league-option");
        if(!el) return;

        const leagueId = el.dataset.id;

        const league = game.league.available.find(
          l => normalizeId(l.id) === normalizeId(leagueId)
        );

        if(league){

          setLeagueById(league.id);

          if(!league.schedule || !league.schedule.length){
            generateSchedule();
          }

          // 🔥 FIX
          if(game.league.currentRound === undefined){
            game.league.currentRound = 0;
          }

          const round = league.schedule?.[game.league.currentRound || 0];
          const match = getMatchForMyTeam(round);

          if(match){
           initMatch(round);
            track("match_start", {
            round: game.league.currentRound,
            teamId: game.team?.selectedId
            });
            
            game.match.live.running = false;
            game.match.live.phase = "first_half";
          }

          renderSchedule();
          updateUI();
        }
      });
    }

    if(loaded){
      splash.style.display = "none";
      app.style.display = "block";
      updateUI();
      renderEvents();
    } else {

      game.phase = "setup";
      splash.style.display = "flex";
      app.style.display = "none";

      document.getElementById("startBtn")?.addEventListener("click", () => {

        game.phase = "idle";
        splash.style.display = "none";
        app.style.display = "block";

        const league = game.league?.current;

        // 🔥 FIX
        const round = league?.schedule?.[game.league.currentRound || 0];
        const match = getMatchForMyTeam(round);

        if(match){
          initMatch(round);
          track("match_start", {
          round: game.league.currentRound,
          teamId: game.team?.selectedId
          });
          const live = game.match.live;
          live.running = false;
          live.minute = 0;
          live.phase = "first_half";
        }

        updateUI();
        renderEvents();
      });
    }

  } catch (e){
    console.error("❌ INIT ERROR:", e);
    window.addEventListener("beforeunload", () => {
  track("session_end");
});
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
      const round = league?.schedule?.[game.league.currentRound || 0];
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

    if(live.minute >= 90){
    track("match_start");
      // 🔥 FIX
game.league.currentRound++;
      const round = league?.schedule?.[game.league.currentRound|| 0];
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

    if(live.running === true){
      live.running = false;
      matchLoopRunning = false;
      updateMainButtonText();
      return;
    }
  });

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    import("./services/storage.js").then(m => m.resetGame());
  });
}

// =========================
// ▶️ START
// =========================
document.addEventListener("DOMContentLoaded", init);

export { init };
