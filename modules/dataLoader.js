// =========================
// 📦 DATA LOADER (FINAL)
// =========================

import { loadFromSupabase } from "./supabaseLoader.js";
import { loadFromCSV } from "./csvLoader.js";
import { game } from "../core/state.js";

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

function normalizeTeams(teams){
  if(!Array.isArray(teams)) return [];
  return teams.map(t => ({
    ...t,
    id: normalizeId(t.id)
  }));
}

function normalizeLeagues(leagues){
  if(!Array.isArray(leagues)) return [];
  return leagues.map(l => ({
    ...l,
    id: normalizeId(l.id)
  }));
}

// =========================
// 🚀 MAIN
// =========================
export async function loadGameData(){

  let teams = [];
  let leagues = [];
  let source = "none";

  // =========================
  // 🟢 SUPABASE
  // =========================
  try {

    const supa = await loadFromSupabase();

    if(supa?.teams?.length){

      teams = normalizeTeams(supa.teams);
      leagues = normalizeLeagues(supa.leagues);

      source = "supabase";

      console.log("🟢 Supabase aktiv");
    }

  } catch(e){
    console.warn("⚠️ Supabase fehlgeschlagen → CSV");
  }

  // =========================
  // 🟡 CSV FALLBACK
  // =========================
  if(!teams.length){

    const csv = await loadFromCSV();

    if(csv?.teams?.length){

      teams = normalizeTeams(csv.teams);
      leagues = normalizeLeagues(csv.leagues);

      source = "csv";

      console.log("🟡 CSV aktiv");
    }
  }

  if(!teams.length){
    console.error("❌ KEINE DATEN");
    return false;
  }

  // =========================
  // 💾 STATE WRITE
  // =========================
  game.data = game.data || {};

  game.data.teams = teams;
  game.data.leagues = leagues;
  game.data._source = source;

  // 🔥 WICHTIG: DIREKT BINDEN (FIX!)
  game.league = game.league || {};
  game.league.available = leagues;

  return true;
}
