// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import { initLeagueSelect, setLeagueById } from "./modules/league.js";
import "./core/eventStore.js";

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
// 🔥 LOOP GUARD (NEU)
// =========================
let matchLoopRunning = false;

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
        .map(e => `<div>${e.minute}' - ${e.text}</div>`)
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

    matchLoopRunning = false; // 🔥 FIX

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
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

// 🔥 dein helper bleibt
function getMatchForMyTeam(round){

  const myTeamId = game.team?.selectedId;

  return round?.find(m =>
    m.homeTeamId === myTeamId ||
    m.awayTeamId === myTeamId
  ) || round?.[0];
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

    const { data: players } = await supabase.from("players").select("*");
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
      leagues
    };

    game.league = game.league || {};
    game.league.available = leagues;

    game.players = players;
    initPlayerPool(players);

const loaded = loadGame();

// 🔥 FIX: Wenn kein Team gewählt → als neues Spiel behandeln
if(!game.team?.selectedId){
  game.phase = "setup";
}
    if(!game.league.current){
      game.league.current = leagues[0];
    }

    if(!game.league.current.schedule || !game.league.current.schedule.length){
      generateSchedule();
    }

    initLeagueSelect();
    initTable();
    initDebugOverlay();
    renderSchedule();

    // 🔥 PLZ UI bleibt vollständig drin
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

          const round = league.schedule?.[league.currentRound || 0];
          const match = getMatchForMyTeam(round);

          if(match){
            initMatch([match]);

            // 🔥 FIX
            game.match.live.running = false;
            game.match.live.phase = "first_half";
          }

          renderSchedule();
          updateUI();
        }
      });
    }

// =========================
// 🎬 START FLOW (FEHLTE!)
// =========================
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

    // 🔥 CRITICAL FIX: ERSTES MATCH LADEN
    const league = game.league?.current;
    const round = league?.schedule?.[league.currentRound || 0];
    const match = getMatchForMyTeam(round);

    if(match){
      initMatch([match]);

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
  }

  // =========================
  // ▶️ MAIN BUTTON (FINAL FIX)
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
      const round = league?.schedule?.[league.currentRound || 0];
      const match = getMatchForMyTeam(round);

      if(match){
        initMatch([match]);
        live = game.match.live;

        // 🔥 FIX
        live.running = false;
        live.phase = "first_half";
      }
    }

    if(!live){
      console.warn("❌ Kein Match");
      return;
    }

    if(live.minute >= 90){

      advanceSchedule();

      const round = league?.schedule?.[league.currentRound || 0];
      const match = getMatchForMyTeam(round);

      if(match){
        initMatch([match]);

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

    if(live.phase === "halftime"){

      if(matchLoopRunning) return; // 🔥 FIX

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

      if(matchLoopRunning) return; // 🔥 FIX

      if(live.minute === 0){
        live.phase = "first_half";
      }

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
