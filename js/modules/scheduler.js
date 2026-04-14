// =========================
// 📅 SPIELPLAN GENERIEREN (FINAL CLEAN)
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
// 🧠 HELPERS (UI)
// =========================
function getTeamName(team){
  if(!team) return "Unbekannt";
  return team.name || "Unbekannt";
}

// =========================
// 🔀 SHUFFLE
// =========================
function shuffleArray(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// =========================
// 📅 GENERATE SCHEDULE
// =========================
function generateSchedule(){

  const league = game.league?.current;

  if(!league || !Array.isArray(league.teams) || league.teams.length < 2){
    console.error("❌ Ungültige Liga / zu wenig Teams");
    return;
  }

  if(league.schedule && league.schedule.length > 0){
    console.log("ℹ️ Spielplan existiert bereits");
    return;
  }

  // =========================
  // 🧠 TEAMS NORMALIZEN
  // =========================
  const seen = new Set();
  let teams = [];

  league.teams.forEach(t => {

    const id = resolveTeamId(t);

    if(!id) return;
    if(seen.has(id)) return;

    seen.add(id);

    teams.push({
      id: id,
      name: t.name || "Unbekannt"
    });
  });

  const originalCount = teams.length;

  // =========================
  // 🔁 BYE
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
  // 🔁 RÜCKRUNDE
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
  // 📊 FINAL
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
// 🧪 VALIDATION
// =========================
function validateSchedule(expectedTeamCount){

  const schedule = game.league.current?.schedule;
  if(!schedule?.length) return;

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
  }
}

// =========================
// ▶️ NEXT MATCH
// =========================
function nextMatch(){

  const schedule = game.league?.current?.schedule;
  if(!schedule?.length) return null;

  const myTeamId = normalizeId(game.team?.selectedId);

  for(let r = 0; r < schedule.length; r++){
    for(let m = 0; m < schedule[r].length; m++){

      const match = schedule[r][m];
      if(match._processed) continue;

      if(
        normalizeId(match.homeTeamId) === myTeamId ||
        normalizeId(match.awayTeamId) === myTeamId
      ){
        game.league.currentRound = r;
        game.league.currentMatchIndex = m;
        return match;
      }
    }
  }

  return null;
}

// =========================
// ⏭ ADVANCE
// =========================
function advanceSchedule(){

  const schedule = game.league.current?.schedule;
  if(!schedule?.length) return;

  let r = game.league.currentRound || 0;
  let m = game.league.currentMatchIndex || 0;

  m++;

  if(m >= schedule[r].length){
    m = 0;
    r++;
  }

  game.league.currentRound = r;
  game.league.currentMatchIndex = m;
}

// =========================
// 🏁 SEASON END
// =========================
function isSeasonFinished(){

  const schedule = game.league.current?.schedule;
  if(!schedule?.length) return true;

  return schedule.every(round =>
    round.every(match => match._processed)
  );
}

// =========================
// 📅 RENDER
// =========================
function renderSchedule(){

  const container = document.getElementById("scheduleView");
  if(!container) return;

  const schedule = game.league?.current?.schedule;
  if(!schedule?.length){
    container.innerHTML = "<p>Kein Spielplan vorhanden</p>";
    return;
  }

  const myMatch = game.match?.current || null;

  let html = "";

  schedule.forEach((round, rIndex) => {

    html += `<div class="round">
      <h3>Spieltag ${rIndex + 1}</h3>
      <ul style="list-style:none;padding:0;">`;

    round.forEach(match => {

      const isActive = myMatch && match.id === myMatch.id;

      html += `
        <li style="
          padding:6px;
          margin:2px 0;
          border-radius:4px;
          ${isActive ? "background:#1a1a1a;color:#00ff88;font-weight:bold;" : ""}
        ">
${getTeamName(match.home)} ${match.result ? match.result.home + ":" + match.result.away : "vs"} ${getTeamName(match.away)}
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
