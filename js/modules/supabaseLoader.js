// =========================
// 🟢 SUPABASE LOADER (FINAL)
// =========================

import { supabase } from "../client.js";

// 👉 GLOBAL SWITCH
const USE_SUPABASE = true;

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

// =========================
// 🚀 LOAD
// =========================
export async function loadFromSupabase(){

  if(!USE_SUPABASE){
    console.log("⚪ Supabase deaktiviert");
    return { teams: [], leagues: [] };
  }

  try {

    // 👉 STATES = LIGEN (wichtig!)
    const { data: leaguesData, error: leaguesError } = await supabase
      .from("states")
      .select("*");

    if(leaguesError) throw leaguesError;

    const leagues = (leaguesData || []).map(l => ({
      ...l,
      id: normalizeId(l.id)
    }));

    // 👉 TEAMS
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("*");

    if(teamsError) throw teamsError;

    const teams = (teamsData || []).map(t => ({
      ...t,
      id: normalizeId(t.id),
      state_id: normalizeId(t.state_id)
    }));

    console.log("🟢 Supabase geladen:", {
      leagues: leagues.length,
      teams: teams.length
    });

    return { teams, leagues };

  } catch(e){
    console.error("❌ Supabase Fehler:", e);
    throw e; // 👉 wichtig für fallback
  }
}
