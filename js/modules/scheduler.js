// =========================
// 📅 SPIELPLAN GENERIEREN (ID BASED + SAFE)
// =========================
import { game } from "../core/state.js";

// =========================
// 🧠 ID HELPERS
// =========================
function normalizeId(val){
  if(val === null || val === undefined) return null;
  return String(val);
}

function resolveTeamId(team){
  if(!team) return null;

  if(typeof team === "number") return normalizeId(team);

  if(typeof team === "object"){
    return normalizeId(team.id);
  }

  return null;
}

// =========================
// 🧠 HELPERS (UI bleibt)
// =========================
function getTeamName(team){
  if(!team) return "Unbekannt";
  return team.name || "Unbekannt";
}

function normalizeTeam(team){

  if(team && team.id !== undefined){
    return {
      ...team,
      id: normalizeId(team.id)
    };
  }

  return team;
}

// 🔥 NEW (nur für UI Highlight)
function getMatchForMyTeam(round){
  const myTeamId = game.team?.selectedId;

  return round?.find(m =>
    m.homeTeamId === myTeamId ||
    m.awayTeamId === myTeamId
  ) || null;
}

// =========================
// 🔥 NEW: SHUFFLE
// =========================
function shuffleArray(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// =========================
// 📅 GENERATE (ID ONLY)
// =========================

function generateSchedule(){

  const league = game.league?.current;

  if(!league || !Array.isArray(league.teams) || league.teams.length < 2){
    console.error("❌ Ungültige Liga / zu wenig Teams");
    return;
  }

  if(league.schedule && league.schedule.length > 0){
    console.log("ℹ️ Spielplan existiert bereits → wird nicht neu erstellt");
    return;
  }

  // =========================
  // 🧠 TEAMS NORMALIZEN
  // =========================
  const seen = new Set();
  let teams = [];

  league.teams.forEach(t => {

    const id = resolveTeamId(t);

    if(!id){
      console.error("❌ Team ohne ID:", t);
      return;
    }

    if(seen.has(id)){
      console.warn("⚠️ Duplicate Team:", id);
      return;
    }

    seen.add(id);

    teams.push({
      id: id,
      name: t.name || "Unbekannt"
    });
  });

  const originalCount = teams.length;

  // =========================
  // 🔁 BYE (ungerade Teams)
  // =========================
  if(teams.length % 2 !== 0){
    teams.push({ id: "BYE", name: "BYE" });
  }

  const totalRounds = teams.length - 1;
  const half = teams.length / 2;

  const rounds = [];
  let rotation = [...teams];

  // =========================
  // 🔥 HINRUNDE
  // =========================
  for(let r = 0; r < totalRounds; r++){

    const round = [];

    for(let i = 0; i < half; i++){

      const teamA = rotation[i];
      const teamB = rotation[rotation.length - 1 - i];

      const isSwap = r % 2 === 1;

      const home = isSwap ? teamB : teamA;
      const away = isSwap ? teamA : teamB;

      if(home.id === "BYE" || away.id === "BYE") continue;

      round.push({
        id: crypto.randomUUID(),

        homeTeamId: String(home.id),
        awayTeamId: String(away.id),

        home: { id: String(home.id), name: home.name },
        away: { id: String(away.id), name: away.name },

        result: null,
        _processed: false
      });
    }

    shuffleArray(round);
    rounds.push(round);

    // Rotation
    const fixed = rotation[0];
    const rest = rotation.slice(1);

    rest.unshift(rest.pop());
    rotation = [fixed, ...rest];
  }

  // =========================
  // 🔥 RÜCKRUNDE (SPIEGELN)
  // =========================
  const returnRounds = rounds.map(round => {

    const newRound = round.map(match => {

      const homeId = String(match.awayTeamId);
      const awayId = String(match.homeTeamId);

      return {
        id: crypto.randomUUID(),

        homeTeamId: homeId,
        awayTeamId: awayId,

        home: {
          id: homeId,
          name: match.away.name
        },
        away: {
          id: awayId,
          name: match.home.name
        },

        result: null,
        _processed: false
      };
    });

    shuffleArray(newRound);

    return newRound;
  });

  // =========================
  // 📊 FINAL SCHEDULE
  // =========================
  league.schedule = [...rounds, ...returnRounds];

  league.schedule.forEach(round => {
    round._simulated = false;
  });

  league.currentRound = 0;
  league.currentMatchIndex = 0;

  console.log("✅ Spielplan erstellt:", league.schedule.length);

  validateSchedule(originalCount);
}



// =========================
// 🧪 VALIDIERUNG
// =========================
function validateSchedule(expectedTeamCount){

  const schedule = game.league.current?.schedule;

  if(!schedule?.length){
    console.error("❌ Kein Spielplan vorhanden");
    return;
  }

  const firstRound = schedule[0];

  const teams = [];

  firstRound.forEach(match => {
    teams.push(normalizeId(match.homeTeamId));
    teams.push(normalizeId(match.awayTeamId));
  });

  const unique = new Set(teams);
  const expectedMatches = Math.floor(expectedTeamCount / 2);

  if(teams.length !== unique.size){
    console.error("❌ DUPLIKATE IM SPIELTAG!");
  }

  if(firstRound.length !== expectedMatches){
    console.error("❌ Falsche Spielanzahl:", firstRound.length);
  } else {
    console.log("✅ Spieltag korrekt:", expectedMatches);
  }
}

// =========================
// 👉 NEXT MATCH
// =========================
function nextMatch(){

  const schedule = game.league?.current?.schedule;

  if(!schedule?.length){
    console.warn("❌ Kein Spielplan");
    return null;
  }

  const myTeamId = normalizeId(game.team?.selectedId || game.team?.id);

  let r = game.league.currentRound || 0;
  let m = game.league.currentMatchIndex || 0;

  for(; r < schedule.length; r++){
    for(; m < schedule[r].length; m++){

      const match = schedule[r][m];

      if(match._processed) continue;

      if(myTeamId){
        if(
          normalizeId(match.homeTeamId) === myTeamId ||
          normalizeId(match.awayTeamId) === myTeamId
        ){
          game.league.currentRound = r;
          game.league.currentMatchIndex = m;
          return match;
        }
      }

      game.league.currentRound = r;
      game.league.currentMatchIndex = m;
      return match;
    }
    m = 0;
  }

  return null;
}

// =========================
// 👉 ADVANCE
// =========================
function advanceSchedule(){

  let roundIndex = game.league.currentRound || 0;
  let matchIndex = game.league.currentMatchIndex || 0;

  const schedule = game.league.current?.schedule;
  if(!schedule?.length) return;

  matchIndex++;

  if(matchIndex >= schedule[roundIndex].length){
    matchIndex = 0;
    roundIndex++;
  }

  game.league.currentRound = roundIndex;
  game.league.currentMatchIndex = matchIndex;
}

// =========================
// 🏁 SEASON END CHECK
// =========================
function isSeasonFinished(){

  const schedule = game.league.current?.schedule;
  if(!schedule?.length) return true;

  return schedule.every(round =>
    round.every(match => match._processed)
  );
}

// =========================
// 📅 RENDER (FIXED HIGHLIGHT)
// =========================
function renderSchedule(){

  const container = document.getElementById("scheduleView");
  if(!container) return;

  const schedule = game.league?.current?.schedule;

  if(!schedule?.length){
    container.innerHTML = "<p>Kein Spielplan vorhanden</p>";
    return;
  }

  const currentRound = game.league.playerRound ?? 0;
  const roundRef = schedule[currentRound];
const myMatch = game.match?.current || null;
  let html = "";

  schedule.forEach((round, rIndex) => {

    html += `<div class="round">
      <h3>Spieltag ${rIndex + 1}</h3>
      <ul style="list-style:none;padding:0;">`;

    round.forEach((match) => {

      const isActive =
  myMatch &&
  match.id === myMatch.id;

      const home = getTeamName(match.home);
      const away = getTeamName(match.away);

      html += `
        <li style="
          padding:6px;
          margin:2px 0;
          border-radius:4px;
          ${isActive ? "background:#1a1a1a;color:#00ff88;font-weight:bold;" : ""}
        ">
${home} ${match.result ? match.result.home + ":" + match.result.away : "vs"} ${away}
${match._processed ? " ✅" : ""}
        </li>
      `;
    });

    html += `</ul></div>`;
  });

  container.innerHTML = html;
}

// =========================
// 📦 EXPORTS
// =========================
export {
  generateSchedule,
  nextMatch,
  advanceSchedule,
  isSeasonFinished,
  renderSchedule
};
