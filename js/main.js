// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { track, trackEnd } from "../tools/analytics.js";
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
// 🔥 EVENT RENDER (FIXED)
// =========================
function renderEvents(){

  const events = game.events?.history || [];

  const feed = document.getElementById("liveFeed");
  const headline = document.getElementById("eventText");

  if(feed){
    feed.innerHTML = events.length > 0
      ? (
          events
            .slice(-20)
            .reverse()
            .map(e => {
              const safeText = String(e.text)
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              
              return `<div>${e.minute}' - ${safeText}</div>`;
            })
            .join("")
        )
      : "";
  }

  const top = events.length
    ? events[events.length - 1]
    : null;

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


const PLZ_TO_REGION = {
  "10": "DE-BE","11": "DE-BB","12": "DE-BB","13": "DE-BB",
  "20": "DE-HH","21": "DE-NI","22": "DE-HH",
  "30": "DE-NI","31": "DE-NI","32": "DE-NW","33": "DE-NW",
  "34": "DE-HE","35": "DE-HE","36": "DE-HE","37": "DE-NI",
  "38": "DE-NI","39": "DE-ST",

  "40": "DE-NW","41": "DE-NW","42": "DE-NW","43": "DE-NW",
  "44": "DE-NW","45": "DE-NW","46": "DE-NW","47": "DE-NW",
  "48": "DE-NW","49": "DE-NW",

  "50": "DE-NW","51": "DE-NW","52": "DE-NW","53": "DE-NW",

  "60": "DE-HE","61": "DE-HE","62": "DE-HE","63": "DE-HE",

  "70": "DE-BW","71": "DE-BW","72": "DE-BW","73": "DE-BW",
  "74": "DE-BW","75": "DE-BW","76": "DE-BW","77": "DE-BW",
  "78": "DE-BW","79": "DE-BW",

  "80": "DE-BY","81": "DE-BY","82": "DE-BY","83": "DE-BY",
  "84": "DE-BY","85": "DE-BY","86": "DE-BY","87": "DE-BY",
  "88": "DE-BW","89": "DE-BY",

  "90": "DE-BY","91": "DE-BY","92": "DE-BY","93": "DE-BY",
  "94": "DE-BY","95": "DE-BY","96": "DE-BY","97": "DE-BY",
  "98": "DE-TH","99": "DE-TH"
};
function getRegionFromPLZ(plz){
  if(!plz || plz.length < 2) return null;

  const prefix = plz.slice(0,2);
  return PLZ_TO_REGION[prefix] || null;
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
// 🚀 INIT (FIXED)
// =========================
async function init(){

  const plz = document.getElementById("plzInput")?.value;

  track("app_open", {
    session_id: localStorage.getItem("session_id"),
    region_id: getRegionFromPLZ(plz)
  });

  if(!localStorage.getItem("has_started")){

    const sessionId = crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);

    track("session_start", {
      session_id: sessionId,
      region_id: getRegionFromPLZ(plz)
    });

    track("app_start");

    localStorage.setItem("has_started", "true");
  }

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
      gameEvents: gameEvents || []
    };

    game.league = game.league || {};
    game.league.available = leagues;

    game.players = players;
    initPlayerPool(players);

    loadGame();

    if(!game.team?.selectedId){
      game.phase = "setup";
    }

    if(!game.league.current){
      game.league.current = leagues[0];
    }

    if(!game.league.current.schedule || !game.league.current.schedule.length){
      generateSchedule();
    }

    if(game.league.currentRound === undefined){
      game.league.currentRound = 0;
    }

    initLeagueSelect();
    initTable();
    initDebugOverlay();
    initMatchEventSlides();
    renderSchedule();
    initPLZSystem();

  } catch (e){
    console.error("❌ INIT ERROR:", e);
  }
}
// =========================
// 🌍 PLZ + LEAGUE SYSTEM (FIXED)
// =========================
function initPLZSystem(){

  const plzInput = document.getElementById("plzInput");
  const results = document.getElementById("leagueResults");

  if(!plzInput || !results) return;

  const saved = localStorage.getItem("user_plz");
  if(saved){
    plzInput.value = saved;
  }

  // ✅ MERGED LISTENER
  plzInput.addEventListener("input", async (e) => {

    const value = e.target.value;

    localStorage.setItem("user_plz", value);

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

    if(!league) return;

    setLeagueById(league.id);

    if(!league.schedule || !league.schedule.length){
      generateSchedule();
    }

    if(game.league.currentRound === undefined){
      game.league.currentRound = 0;
    }

    const round = league.schedule?.[game.league.currentRound || 0];
    const match = getMatchForMyTeam(round);

    if(match){
      initMatch(round);

      const plz = localStorage.getItem("user_plz");

      track("match_start", {
        round: game.league.currentRound,
        teamId: game.team?.selectedId,
        session_id: localStorage.getItem("session_id"),
        region_id: getRegionFromPLZ(plz)
      });

      game.match.live.running = false;
      game.match.live.phase = "first_half";
    }

    renderSchedule();
    updateUI();
  });
}
    
// =========================
// ▶️ MAIN BUTTON (FIXED)
// =========================
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

  // ✅ MATCH FINISHED
  if(live.minute >= 90){

    game.league.currentRound++;

    const round = league?.schedule?.[game.league.currentRound || 0];
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
        }
      });
    }

    return; // 🔥 wichtig
  }

  // ✅ HALFTIME
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

  // ✅ START / RESUME
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

  // ✅ PAUSE
  if(live.running === true){
    live.running = false;
    matchLoopRunning = false;
    updateMainButtonText();
    return;
  }
});
// =========================
// 🔚 SESSION END TRACKING
// =========================
window.addEventListener("beforeunload", () => {
  trackEnd("session_end");
});

// 📱 MOBILE FIX (sehr wichtig!)
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "hidden"){
    trackEnd("session_end");
  }
});

// =========================
// ▶️ START
// =========================
document.addEventListener("DOMContentLoaded", init);
 
