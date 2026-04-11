// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import { initLeagueSelect, setLeagueById } from "./modules/league.js";
// 🔥 CRITICAL: EventStore aktivieren
import "./core/eventStore.js";

// =========================
// 🔌 SUPABASE
// =========================
import { supabase } from "./client.js";

// =========================
// 🔧 MODULES
// =========================
import { startAdEngine } from "./modules/ads.js";
import { generateSchedule } from "./modules/scheduler.js";
import { initTable } from "./modules/table.js";
import { initPlayerPool } from "./modules/playerPool.js";
import { importPlayers } from "../tools/importer.js";
window.importPlayers = importPlayers;
import { buildAllTeams } from "./modules/teamGenerator.js";
window.buildAllTeams = buildAllTeams;

// =========================
// 🎮 ENGINE
// =========================
import { handleMainAction } from "./core/engine.js";

// =========================
// 💾 STORAGE
// =========================
import { loadGame } from "./services/storage.js";

// =========================
// 🖥 UI
// =========================
import { updateUI } from "./ui/ui.js";

// =========================
// 🔥 EVENT RENDER
// =========================
function renderEvents(){

  const events = game.events?.history || [];

  console.log("📡 renderEvents | count:", events.length);

  const feed = document.getElementById("liveFeed");
  const headline = document.getElementById("eventText");

  const visible = events;

  if(feed){
    feed.innerHTML = visible.length > 0
      ? visible
          .slice(-20)
          .reverse()
          .map(e => `<div>${e.minute}' - ${e.text}</div>`)
          .join("")
      : "";
  }

  const top = visible.at(-1);

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
    console.log("♻️ STATE_CHANGED (UI)");
    renderEvents();
  });

  on(EVENTS.MATCH_FINISHED, () => {
    console.log("🏁 MATCH_FINISHED (UI refresh + cleanup)");

    if(game.events){
      game.events.history = [];
    }

    updateUI();
    renderEvents();
  });
}

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
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

  if(!data || data.length === 0){
    return [];
  }

  const regionIds = data.map(r => r.region_id);

  return game.league.available.filter(
    l => regionIds.includes(l.region_id)
  );
}

// =========================
// 🚀 INIT
// =========================
async function init(){

  console.log("🚀 Init läuft...");
  window.game = game;

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  initEventBindings();
  startAdEngine();

  try {

    console.log("⚽ Lade Supabase Daten...");

    const { data: players } = await supabase.from("players").select("*");
    window.playerPool = players;

    const { data: teams } = await supabase.from("teams").select("*");

    const { data: competitions } = await supabase
      .from("competitions")
      .select(`
        *,
        regions (
          name,
          states (
            name
          )
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

    game.data = {
      players,
      teams: teams.map(t => ({
        ...t,
        id: normalizeId(t.id)
      })),
      competitions,
      leagues
    };

    game.league = game.league || {};
    game.league.available = leagues;

    game.players = players;
    initPlayerPool(players);

    if(leagues.length === 0){
      throw new Error("❌ Keine Ligen aus DB geladen");
    }

    const loaded = loadGame();

    if(!game.league.current){
      game.league.current = leagues[0];
    }

    if(!game.team.selected){
      const firstTeam = game.league.current.teams?.[0];
      if(firstTeam){
        game.team.selected = firstTeam.name;
      }
    }

    // =========================
    // 🔥 FIX 1: SCHEDULE VOR UI
    // =========================
    initLeagueSelect();

// 🔥 JETZT ist league.current korrekt
if(!game.league.current.schedule?.length){
  console.log("📅 Generiere Spielplan (korrekte Liga)");
  generateSchedule();
}

initTable();

    // =========================
    // 🔥 FIX 2: UI DANACH
    // =========================
    initLeagueSelect();
    initTable();

    // =========================
    // 🔥 PLZ UI
    // =========================
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

        const league = game.league.available.find(l => l.id === leagueId);

        if(league){
          setLeagueById(league.id);
          updateUI();
        }
      });
    }

    const hasSave = !!loaded;

    if(hasSave){
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

        // 🔥 FIX 3: nochmal absichern
        if(!game.league.current.schedule?.length){
          generateSchedule();
        }

        updateUI();
        renderEvents();
      });
    }

  } catch (e){
    console.error("❌ INIT ERROR:", e);
  }

  document.getElementById("mainButton")?.addEventListener("click", handleMainAction);

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    import("./services/storage.js").then(m => m.resetGame());
  });

  console.log("✅ Init fertig");
}

// =========================
// ▶️ START
// =========================
document.addEventListener("DOMContentLoaded", init);

export { init };
