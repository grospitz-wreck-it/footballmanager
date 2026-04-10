// =========================
// 📦 IMPORTS
// =========================
import { loadCSV } from "./loader.js";

// =========================
// 🏆 LOAD LEAGUES FROM CSV
// =========================
export async function loadLeaguesFromCSV(path){

  console.log("📥 Lade Ligen aus:", path);

  const rows = await loadCSV(path);

  console.log("🧪 Erste CSV-Zeile RAW:", rows?.[0]);

  if(!rows || rows.length === 0){
    console.warn("❌ CSV leer oder nicht geladen");
    return {};
  }

  const leagues = {};

  rows.forEach((row, index) => {

    // =========================
    // 🔥 HEADER NORMALISIEREN
    // =========================
    const obj = {};

    Object.keys(row).forEach(k => {
      const clean = k
        .replace(/^\uFEFF/, "") // BOM entfernen
        .replace(/\r/g, "")     // Windows CR entfernen
        .trim()
        .toLowerCase();

      obj[clean] = row[k];
    });

    // DEBUG
    if(index === 0){
      console.log("🧪 Normalisierte Keys:", obj);
    }

    // =========================
    // 🏷 LIGA ERKENNEN
    // =========================
    const liga =
      obj.liga ||
      obj["liga "] ||
      obj[" liga"] ||
      obj["liga\r"] ||
      Object.values(obj)[2]; // fallback: 3. Spalte

    if(!liga){
      console.warn(`⚠️ Zeile ${index}: KEINE LIGA GEFUNDEN`, obj);
      return;
    }

    const key = String(liga).toLowerCase().replace(/\s+/g, "_");

    // =========================
    // 👕 TEAMS EINLESEN
    // =========================
    const teams = [];

    for(let i = 1; i <= 20; i++){

      let name = obj[`team${i}`];

      if(typeof name !== "string") continue;

      name = name.trim();

      if(name !== ""){
        teams.push({
          id: name,
          name: name,

          // 🔥 Basiswerte
          strength: 50,
          played: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0
        });
      }
    }

    // =========================
    // ⚠️ VALIDIERUNG
    // =========================
    if(teams.length === 0){
      console.warn(`❌ ${liga}: KEINE TEAMS GEFUNDEN`, obj);
      return;
    }

    // =========================
    // ⚖️ GERADE TEAMANZAHL
    // =========================
    if(teams.length % 2 !== 0){
      console.warn(`⚠️ ${liga}: Ungerade Teams → Freilos hinzugefügt`);

      teams.push({
        id: "freilos",
        name: "Freilos",
        isBye: true
      });
    }

    // =========================
    // 📦 SPEICHERN
    // =========================
    leagues[key] = {
      name: liga,
      teams,
      table: [],
      schedule: []
    };

    console.log(`🏆 ${liga}: ${teams.length} Teams geladen`);
  });

  // =========================
  // 📊 SUMMARY
  // =========================
  const count = Object.keys(leagues).length;

  console.log("📊 Gesamt Ligen:", count);

  if(count === 0){
    console.error("❌ KEINE LIGEN GELADEN → CSV PROBLEM!");
  }

  return leagues;
}
