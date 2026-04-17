// =========================
// 💾 STORAGE MODULE (FINAL ID SAFE)
// =========================
import { game } from "../core/state.js";
import { generateSchedule } from "../modules/scheduler.js";

const STORAGE_KEY = "kreisliga_save";
const SAVE_VERSION = 2;

// =========================
// 💾 SAVE
// =========================
export function saveGame(){   // ✅ FIX

  try {

    const { ui, ...gameData } = game;

    const data = {
      version: SAVE_VERSION,
      game: gameData
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    console.log("✅ Spiel gespeichert");

  } catch(e){
    console.error("❌ Save Fehler", e);
  }
}

// =========================
// 📂 LOAD
// =========================
export function loadGame(){   // ✅ FIX

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if(!raw){
      console.log("ℹ️ Kein Save gefunden");
      return false;
    }

    const data = JSON.parse(raw);

    if(!data || !data.game){
      console.warn("⚠️ Ungültiger Save");
      return false;
    }

    deepMerge(game, data.game);
    rebuildIds();
    ensureUI();

    if(
      (!game.league?.current?.schedule ||
        game.league.current.schedule.length === 0) &&
      game.league?.current?.teams?.length
    ){
      console.warn("⚠️ Kein Spielplan → neu generieren");
      generateSchedule();
    }

    console.log("✅ Spiel geladen");

    return true;

  } catch(e){
    console.error("❌ Load Fehler", e);
    return false;
  }
}

// =========================
// 🗑 DELETE
// =========================
export function clearSave(){   // ✅ FIX
  localStorage.removeItem(STORAGE_KEY);
  console.log("🗑 Save gelöscht");
}

// =========================
// 🧠 DEEP MERGE (SAFE)
// =========================
function deepMerge(target, source){

  for(const key in source){

    if(key === "ui") continue;

    if(
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ){
      if(!target[key]){
        target[key] = {};
      }

      deepMerge(target[key], source[key]);
    }
    else{
      target[key] = source[key];
    }
  }
}

// =========================
// 🆔 ID REBUILD (CRITICAL)
// =========================
function rebuildIds(){

  const league = game.league?.current;
  if(!league) return;

  // =========================
  // 🏷 TEAM IDs FIXEN
  // =========================
  league.teams?.forEach(team => {

    if(!team.id){
      team.id = createId(team.name);
    }

  });

  // =========================
  // 📊 TABLE IDs FIXEN
  // =========================
  league.table?.forEach(entry => {

    if(!entry.id){
      const team = league.teams.find(t => t.name === entry.name);
      entry.id = team?.id || createId(entry.name);
    }

  });

  // =========================
  // 🎯 SELECTED TEAM FIXEN
  // =========================
  if(!game.team) game.team = {};

  if(!game.team.selectedId && game.team.selected){

    const team = league.teams.find(
      t => t.name === game.team.selected
    );

    if(team){
      game.team.selectedId = team.id;
    }
  }

// =========================
// 📅 SCHEDULE FIX (SAFE – BUGFIX)
// =========================
league.schedule?.forEach(round => {
  round.forEach(match => {

    if(typeof match.home === "object"){
      const val = match.home?.id || match.home?.name;
      if(val){
        match.home = val;
      } else {
        console.error("❌ Ungültiges home-Team im Save", match.home);
      }
    }

    if(typeof match.away === "object"){
      const val = match.away?.id || match.away?.name;
      if(val){
        match.away = val;
      } else {
        console.error("❌ Ungültiges away-Team im Save", match.away);
      }
    }

  });
});
  console.log("🆔 IDs rekonstruiert");
}
// =========================
// 🧱 UI GARANTIE
// =========================
function ensureUI(){

  if(!game.ui){
    game.ui = {};
  }

  if(typeof game.ui.sidebarOpen !== "boolean"){
    game.ui.sidebarOpen = false;
  }

  if(!game.ui.tab){
    game.ui.tab = "table";
  }
}

// =========================
// 🧠 ID GENERATOR
// =========================
function createId(name){

  return name
    ?.toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "") +
    "_" +
    Math.random().toString(36).substring(2, 6);
}
// =========================
// 🧨 RESET (FULL SAFE)
// =========================
export function resetGame(){

  console.log("🔄 RESET GAME");

  // =========================
  // 💾 STORAGE CLEAR
  // =========================
  localStorage.clear();


 // =========================
// 🧠 MEMORY RESET (FINAL CLEAN)
// =========================
if(game){

  // =========================
  // 👤 TEAM
  // =========================
  game.team = {
    selectedId: null
  };

 // =========================
// 🏆 LEAGUE
// =========================
game.league = game.league || {};

game.league.current = null;


  // =========================
  // 🎮 MATCH
  // =========================
  game.match = null;

  // =========================
  // 📢 EVENTS
  // =========================
  game.events = {
    history: []
  };

  // =========================
  // 🖥 UI
  // =========================
  game.ui = {
    sidebarOpen: false,
    tab: "table"
  };

}

console.log("✅ Game state cleared");
}
