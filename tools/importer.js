// =========================
// 🔌 SUPABASE
// =========================
import { supabase } from "../js/client.js";

// =========================
// 🧼 HELPERS
// =========================
function clean(s){
  return String(s || "")
    .toLowerCase()
    .trim();
}

// =========================
// 📄 CSV LOADER (ROBUST)
// =========================
export async function loadCSV(path){

  const res = await fetch(path);

  if(!res.ok){
    throw new Error("❌ CSV NOT FOUND: " + path);
  }

  const text = await res.text();

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};

    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim();
    });

    return obj;
  });
}

// =========================
// 👤 BUILD PLAYER OBJECT
// =========================
function buildPlayer(row){

  return {
    name: row.name || row.Name || "Unknown",

    age: Number(row.age) || 18,
    nationality: row.nationality || row.country || "DE",

    position: row.position || "MID",

    // ❗ KEIN TEAM → wird später im Game gesetzt
    team_id: null,

    // ⚽ CORE STATS
    shooting: Number(row.shooting) || 50,
    passing: Number(row.passing) || 50,
    dribbling: Number(row.dribbling) || 50,
    defending: Number(row.defending) || 50,
    physical: Number(row.physical) || 50,
    pace: Number(row.pace) || 50,
    stamina: Number(row.stamina) || 50,
    heading: Number(row.heading) || 50,
    goalkeeping: Number(row.goalkeeping) || 0,
    leadership: Number(row.leadership) || 50,

    // 📈 DEVELOPMENT SYSTEM
    potential: Number(row.potential) || 60,
    form: Number(row.form) || 0,
    morale: Number(row.morale) || 50,
    fitness: Number(row.fitness) || 80,
    experience: Number(row.experience) || 0,

    // 💰 VALUE SYSTEM
    market_value: Number(row.market_value) || 100000,
    rating: Number(row.rating) || 50,

    // 🔄 PROGRESSION
    growth_rate: Number(row.growth_rate) || 1,
    decline_rate: Number(row.decline_rate) || 1,
    peak_age: Number(row.peak_age) || 28
  };
}

// =========================
// 🚀 PLAYER IMPORT (FINAL)
// =========================
export async function importPlayers(){

  console.log("🚀 PLAYER IMPORT START");

  const rows = await loadCSV("./data/spieler.csv");

  console.log("📄 Spieler Rows:", rows.length);
  console.log("🔍 Sample:", rows[0]);

  let batch = [];
  let inserted = 0;
  let skipped = 0;

  for(const r of rows){

    // ❗ Nur Name ist Pflicht
    if(!r.name && !r.Name){
      skipped++;
      continue;
    }

    const player = buildPlayer(r);

    batch.push(player);

    // 🔥 Batch Insert
    if(batch.length >= 100){

      const { error } = await supabase
        .from("players")
        .insert(batch);

      if(error){
        console.error("❌ Batch Fehler:", error.message);
      } else {
        inserted += batch.length;
        console.log(`✅ Batch inserted: ${inserted}`);
      }

      batch = [];
    }
  }

  // 🔥 Rest
  if(batch.length > 0){
    const { error } = await supabase
      .from("players")
      .insert(batch);

    if(error){
      console.error("❌ Final Batch:", error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`🎉 IMPORT FERTIG: ${inserted}`);
  console.log(`⚠️ Übersprungen: ${skipped}`);
}

// =========================
// ▶️ DEBUG ACCESS (WICHTIG)
// =========================
window.importPlayers = importPlayers;
