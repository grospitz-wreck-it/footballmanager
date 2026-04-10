// =========================
// 🧠 PLAYER POOL (STABLE)
// =========================

let playerPool = [];

// optional: für spätere Features (Transfers etc.)
let assigned = new Map(); // teamId -> players[]

// =========================
// 📥 INIT
// =========================
export function initPlayerPool(players = []){
  playerPool = players;
  assigned.clear();
}

// Alias (falls du setPlayerPool irgendwo nutzt)
export const setPlayerPool = initPlayerPool;

// =========================
// 📊 GETTERS
// =========================
export function getPlayerPool(){
  return playerPool;
}

// =========================
// 🔍 AVAILABLE PLAYERS
// =========================
export function getAvailablePlayers(position){

  return playerPool.filter(p => {

    // noch keinem Team zugewiesen
    const free = !p.Team;

    // Position optional
    if(!position) return free;

    return free && p.Position === position;
  });
}

// =========================
// 🏷 ASSIGN PLAYERS
// =========================
export function markAssigned(players, teamId){

  if(!players || !players.length) return;

  players.forEach(p => {
    p.Team = teamId;
  });

  // optional tracking
  if(!assigned.has(teamId)){
    assigned.set(teamId, []);
  }

  assigned.get(teamId).push(...players);
}

// =========================
// 📤 GET TEAM PLAYERS
// =========================
export function getPlayersByTeam(teamId){
  return playerPool.filter(p => p.Team === teamId);
}

// =========================
// 🧠 CSV → PLAYER MAPPING
// =========================
export function mapCsvPlayer(p){

  const base = Number(p.Stärke) || 50;

  return {
    Name: `${p.Vorname} ${p.Nachname}`,
    Position: normalizePosition(p.Position),

    // ❗ wichtig: erstmal NULL → wird später gesetzt
    Team: null,

    // 🔥 Skills
    Finishing: clamp(base + rand(-10, 10)),
    Passing: clamp(base + rand(-10, 10)),
    Aggression: clamp(base + rand(-20, 20)),

    overall: base
  };
}

// =========================
// 🧠 POSITION NORMALIZER
// =========================
function normalizePosition(pos){

  if(!pos) return "Mittelfeld";

  const p = pos.toLowerCase();

  if(p.includes("tor")) return "Torwart";
  if(p.includes("abwehr") || p.includes("verteid")) return "Verteidiger";
  if(p.includes("sturm")) return "Stürmer";

  return "Mittelfeld";
}

// =========================
// 🎲 HELPERS
// =========================
function rand(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v){
  return Math.max(1, Math.min(99, v));
}
