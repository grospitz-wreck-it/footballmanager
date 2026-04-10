// =========================
// 🔌 SUPABASE
// =========================
import { supabase } from "../client.js";

// =========================
// 🎲 HELPERS (UNVERÄNDERT)
// =========================
function sample(arr, n){
  const copy = [...arr];
  const result = [];

  while(result.length < n && copy.length > 0){
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy[i]);
    copy.splice(i, 1);
  }

  return result;
}

function random(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

// =========================
// 🎯 TEAM STYLES
// =========================
const TEAM_STYLES = ["defensive", "balanced", "offensive"];

function getDistribution(style){
  switch(style){
    case "defensive": return { GK: 3, DEF: 10, MID: 8, ST: 4 };
    case "offensive": return { GK: 2, DEF: 8, MID: 10, ST: 5 };
    default: return { GK: 2, DEF: 9, MID: 9, ST: 5 };
  }
}

// =========================
// 🔥 POSITION FILTER (NEU - ROBUST)
// =========================
function buildPositionFilter(pos){

  switch(pos){

    case "GK":
      return "position_type.eq.GK,position.ilike.%gk%,position.ilike.%goal%,position.ilike.%tor%";

    case "DEF":
      return "position_type.eq.DEF,position.ilike.%def%,position.ilike.%verte%,position.ilike.%back%";

    case "MID":
      return "position_type.eq.MID,position.ilike.%mid%,position.ilike.%feld%,position.ilike.%wing%";

    case "ST":
      return "position_type.eq.ST,position.ilike.%st%,position.ilike.%strik%,position.ilike.%sturm%";
  }
}

// =========================
// 📥 FETCH PLAYERS
// =========================
async function fetchPlayers(pos, n){

  const filter = buildPositionFilter(pos);

  const { data, error } = await supabase
    .from("players")
    .select("id, position, position_type")
    .is("team_id", null)
    .or(filter)
    .limit(n * 4); // 🔥 Puffer

  if(error){
    console.error("❌ Fetch Fehler:", error.message);
    return [];
  }

  console.log(`📊 Fetch ${pos}:`, data.length);

  return sample(data, n);
}

// =========================
// 📥 FETCH ANY (FALLBACK)
// =========================
async function fetchAny(n){

  const { data, error } = await supabase
    .from("players")
    .select("id")
    .is("team_id", null)
    .limit(n * 4);

  if(error){
    console.error("❌ FetchAny Fehler:", error.message);
    return [];
  }

  return sample(data, n);
}

// =========================
// 💾 SAVE TEAM
// =========================
async function saveTeamToDB(ids, teamId){

  if(!ids.length) return;

  const { error } = await supabase
    .from("players")
    .update({ team_id: teamId })
    .in("id", ids);

  if(error){
    console.error("❌ Save Fehler:", error.message);
  }
}

// =========================
// 🏗 TEAM GENERATION
// =========================
export async function generateTeam(team){

  const style = random(TEAM_STYLES);
  const dist = getDistribution(style);

  console.log(`⚙️ ${team.name} → ${style}`);

  let squad = [];

  async function pick(pos, n){

    let players = await fetchPlayers(pos, n);

    if(!players.length){
      console.warn(`⚠️ Fallback → MID für: ${pos}`);
      players = await fetchPlayers("MID", n);
    }

    return players.map(p => p.id);
  }

  // 🎯 Positionsverteilung
  squad.push(...await pick("GK", dist.GK));
  squad.push(...await pick("DEF", dist.DEF));
  squad.push(...await pick("MID", dist.MID));
  squad.push(...await pick("ST", dist.ST));

  // 🔥 GARANTIE: 25 Spieler
  if(squad.length < 25){

    console.warn("⚠️ Fallback → GLOBAL");

    const rest = await fetchAny(25 - squad.length);
    squad.push(...rest.map(p => p.id));
  }

  await saveTeamToDB(squad, team.id);

  console.log(`✅ Team gebaut: ${team.name} (${squad.length})`);

  return squad;
}

// =========================
// 🚀 BUILD ALL
// =========================
export async function buildAllTeams(){

  console.log("🚀 Team-Building gestartet (ROBUST MODE)");

  const { data: teams, error } = await supabase
    .from("teams")
    .select("*");

  if(error){
    console.error("❌ Teams laden:", error.message);
    return;
  }

  console.log("🏟 Teams:", teams.length);

  for(const team of teams){
    await generateTeam(team);
  }

  console.log("🎉 ALLE TEAMS FERTIG");
}

// =========================
// 🧪 DEBUG
// =========================
window.buildAllTeams = buildAllTeams;
