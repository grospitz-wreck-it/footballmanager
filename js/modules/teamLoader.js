import { getAvailablePlayers, markAssigned } from "./playerPool.js";

/**
 * 🔒 ID NORMALIZATION (ADD ONLY, NO BREAKING CHANGES)
 */
function normalizeTeamId(id){
  if (id === null || id === undefined) return null;
  return String(id);
}

function resolveTeamId(team){
  if (!team) return null;

  if (typeof team === "string") return normalizeTeamId(team);
  if (typeof team === "number") return normalizeTeamId(team);

  if (typeof team === "object"){
    return normalizeTeamId(team.id);
  }

  return null;
}

function normalizeTeamObject(team){
  if (!team) return team;

  return {
    ...team,
    id: normalizeTeamId(team.id)
  };
}

/**
 * 🔧 EXISTING LOGIC (UNCHANGED)
 */
function sample(arr, n){
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export function generateTeam(team){

  // 🔒 ensure normalized team (non-breaking)
  team = normalizeTeamObject(team);

  let squad = [];

  function pick(pos, n){
    const pool = getAvailablePlayers(pos);
    return sample(pool, n);
  }

  squad.push(...pick("Torwart", 2));
  squad.push(...pick("Verteidiger", 5));
  squad.push(...pick("Mittelfeld", 6));
  squad.push(...pick("Stürmer", 3));

  // fallback
  if(squad.length < 16){
    const rest = getAvailablePlayers("Mittelfeld"); // fallback flexibel
    squad.push(...sample(rest, 16 - squad.length));
  }

  /**
   * 🔒 ID-FIX (NON-DESTRUCTIVE)
   * Vorher: team.name
   * Jetzt: bevorzugt team.id, fallback bleibt erhalten
   */
  const teamRef = resolveTeamId(team) || team.name;

  markAssigned(squad, teamRef);

  return squad;
}

/**
 * 🔧 CSV PLAYER MAPPING (MINIMAL FIX)
 */
function mapCsvPlayer(p){

  const base = Number(p.Stärke) || 50;

  return {
    Name: `${p.Vorname} ${p.Nachname}`,
    Position: p.Position,

    /**
     * 🔒 ID NORMALIZATION (CRITICAL)
     */
    Team: normalizeTeamId(p.Team_ID) || null,

    Finishing: clamp(base + rand(-10, 10)),
    Passing: clamp(base + rand(-10, 10)),
    Aggression: clamp(base + rand(-20, 20)),

    overall: base
  };
}

/**
 * 🔧 HELPERS (UNCHANGED)
 */
function rand(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v){
  return Math.max(1, Math.min(99, v));
}
