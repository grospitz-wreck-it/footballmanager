// =========================
// 📦 CORE
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";

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
import { initLeagueSelect } from "./modules/league.js";
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
// 🧠 HELPERS (ADD ONLY)
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
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

    const { data: players } = await supabase
      .from("players")
      .select("*");

    window.playerPool = players;

    const { data: teams } = await supabase
      .from("teams")
      .select("*");

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
// =========================
// 🔍 DEBUG SUPABASE
// =========================
console.log("=== COMPETITIONS RAW ===");
console.table(competitions);

console.log("=== LEAGUE NAMES ===");
console.table(
  competitions.map(c => ({
    id: c.id,
    name: c.name,
    region: c.regions?.name,
    group: c.group
  }))
);
    // =========================
    // 🔒 LEAGUE BUILD (FIXED)
    // =========================
    const leagueMap = new Map();

    competitions.forEach(c => {

      const leagueId = normalizeId(c.id);
      if(leagueMap.has(leagueId)) return;

      const leagueTeams = teams.filter(
        t => normalizeId(t.competition_id) === leagueId
      );

      leagueMap.set(leagueId, {
        id: leagueId,
        name: `${c.name} ${c.regions?.name} ${c.group || ""}`.trim(),
        teams: leagueTeams.map(t => ({
          ...t,
          id: normalizeId(t.id)
        }))
      });
    });

    const leagues = Array.from(leagueMap.values());

    // =========================
    // 💾 STATE WRITE
    // =========================
    game.data = {
      players,
      teams: teams.map(t => ({
        ...t,
        id: normalizeId(t.id)
      })),
      competitions,
      leagues
    };

    // 🔥 CRITICAL FIX (UI SOURCE)
    game.league = game.league || {};
    game.league.available = leagues;

    game.players = players;
    initPlayerPool(players);

    console.log(`✅ Spieler: ${players.length}`);
    console.log(`✅ Teams: ${teams.length}`);
    console.log(`✅ Ligen: ${leagues.length}`);

    if(leagues.length === 0){
      throw new Error("❌ Keine Ligen aus DB geladen");
    }

    const loaded = loadGame();

    if(loaded){
      console.log("✅ Save geladen");
    }

    if(!game.league.current){
      game.league.current = leagues[0];
    }

    if(!game.team.selected){
      const firstTeam = game.league.current.teams?.[0];
      if(firstTeam){
        game.team.selected = firstTeam.name;
      }
    }

    if(!game.league.schedule?.length){
      console.log("📅 Generiere Spielplan...");
      generateSchedule();
    }

    initLeagueSelect();
    initTable();

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

        generateSchedule();
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
