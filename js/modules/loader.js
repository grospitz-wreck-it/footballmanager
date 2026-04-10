
// =========================
// 📦 LOADER (CSV + SUPABASE)
// =========================

import { supabase } from "../client.js";

// 👉 GLOBAL SWITCH
const USE_SUPABASE = true;
// =========================
// 📄 CSV LOADER
// =========================
export async function loadCSV(path) {
  const res = await fetch(path);
  const text = await res.text();

  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};

    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });

    return obj;
  });
}

// =========================
// ☁️ SUPABASE GENERIC
// =========================
export async function loadFromSupabase(table){

  try {
    const { data, error } = await supabase
      .from(table)
      .select("*");

    if(error){
      console.warn("⚠️ Supabase fallback → CSV:", table);
      return null; // 👉 wichtig für fallback
    }

    return data;

  } catch (e){
    console.warn("⚠️ Supabase down → CSV fallback:", table);
    return null;
  }
}

// =========================
// 🏟 TEAMS
// =========================
export async function loadTeams(){

  if(USE_SUPABASE){
    const data = await loadFromSupabase("teams");

    if(data){
      return data.map(t => ({
        id: t.id,
        name: t.name,
        competitionId: t.competition_id,
        region: t.region
      }));
    }
  }

  // 🔁 FALLBACK CSV
  const csv = await loadCSV("/data/ligen.csv");

  return csv.map(t => ({
    id: t.id || t.name,
    name: t.name,
    competitionId: t.competitionId || null,
    region: t.region || null
  }));
}

// =========================
// 👤 PLAYERS
// =========================
export async function loadPlayers(){

  let players = [];

  if(USE_SUPABASE){
    const data = await loadFromSupabase("players");

    if(data){
      players = data;
    }
  }

  // 🔁 CSV FALLBACK
  if(!players || players.length === 0){
    players = await loadCSV("/data/spieler.csv");
  }

  // 🔥 WICHTIG: Teams laden für Mapping
  let teams = [];

  try {
    teams = await loadTeams();
  } catch(e){
    console.warn("⚠️ Teams für Mapping fehlen");
  }

  // 🔥 TEAM LOOKUP
  const teamMap = {};
  teams.forEach(t => {
    teamMap[t.id] = t.name;
  });

  // 🔥 FINAL PLAYER FORMAT (MATCHENGINE KOMPATIBEL)
  return players.map(p => {

    const teamName =
      teamMap[p.team_id] ||   // 🔥 Supabase
      p.Team ||               // 🔥 CSV alt
      p.team ||
      p.club ||
      null;

    return {
      id: p.id || p.name,

      // 🔥 NAMEN FIX
      Name: p.name || p.Name,

      // 🔥 TEAM FIX (DAS IST DER GAMECHANGER)
      Team: teamName,

      // optional Stats
      overall: Number(p.overall) || 50,
      shooting: Number(p.shooting) || 50,
      passing: Number(p.passing) || 50,
      defending: Number(p.defending) || 50,
      goalkeeping: Number(p.goalkeeping) || 50
    };
  });
}
// =========================
// 🏆 COMPETITIONS
// =========================
export async function loadCompetitions(){

  if(USE_SUPABASE){
    const data = await loadFromSupabase("competitions");

    if(data){
      return data.map(c => ({
        id: c.id,
        name: c.name,
        level: c.level,
        region: c.region
      }));
    }
  }

  // 🔁 FALLBACK CSV (optional)
  return [];
}
