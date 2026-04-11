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

// 🔥 UI Helper
function getMatchForMyTeam(round){

  const myTeamId = normalizeId(game.team?.selectedId);

  const match = round?.find(m =>
    normalizeId(m.homeTeamId) === myTeamId ||
    normalizeId(m.awayTeamId) === myTeamId
  );

  return match || null;
}

// =========================
// 🔥 SHUFFLE
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

  let teamsRaw = league.teams.map(normalizeTeam);

  const seen = new Set();
  let teams = [];

  teamsRaw.forEach(t => {

    const id = resolveTeamId(t);

    if(!id){
      console.error("❌ Team ohne ID (wird ignoriert):", t);
      return;
    }

    if(seen.has(id)){
      console.warn("⚠️ Duplicate Team erkannt:", id);
      return;
    }

    seen.add(id);
    teams.push(t);
  });

  const originalCount = teams.length;

  if(teams.length % 2 !== 0){
    teams.push({ id: "BYE", name: "BYE" });
  }

  const totalRounds = teams.length - 1;
  const half = teams.length / 2;

  const rounds = [];
  let rotation = [...teams];

  // =========================
  // 🔁 HINRUNDE
  // =========================
  for(let r = 0; r < totalRounds; r++){

    const round = [];

    for(let i = 0; i < half; i++){

      const teamA = rotation[i];
      const teamB = rotation[rotation.length - 1 - i];

      const isSwap = r % 2 === 1;

      const home = isSwap ? teamB : teamA;
      const away = isSwap ? teamA : teamB;

      const homeId = resolveTeamId(home);
      const awayId = resolveTeamId(away);

      if(!homeId || !awayId || homeId === awayId){
        continue;
      }

      if(home.name !== "BYE" && away.name !== "BYE"){

        round.push({
          id: crypto.randomUUID(),
          homeTeamId: homeId,
          awayTeamId: awayId,
          home,
          away,
          result: null,
          _processed: false
        });
      }
    }

    shuffleArray(round);

    rounds.push(round);

    const fixed = rotation[0];
    const rest = rotation.slice(1);

    rest.unshift(rest.pop());
    rotation = [fixed, ...rest];
  }

  // =========================
  // 🔁 RÜCKRUNDE (ECHTE SPIEGELUNG)
  // =========================
  const returnRounds = rounds.map(round => {

    return round.map(match => ({
      id: crypto.randomUUID(),
      homeTeamId: normalizeId(match.awayTeamId),
      awayTeamId: normalizeId(match.homeTeamId),
      home: match.away,
      away: match.home,
      result: null,
      _processed: false
    }));

  });

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

  let currentRound = game.league.playerRound ?? 0;

  let roundRef = schedule[currentRound];
  let myMatch = getMatchForMyTeam(roundRef);

  if(!myMatch){
    for(let i = 0; i < schedule.length; i++){
      const testMatch = getMatchForMyTeam(schedule[i]);
      if(testMatch){
        currentRound = i;
        roundRef = schedule[i];
        myMatch = testMatch;
        break;
      }
    }
  }

  // =========================
  // 🔥 DEBUG START
  // =========================
  console.log("=== DEBUG SCHEDULE ===");
  console.log("Player Team:", game.team?.selectedId);
  console.log("Current Round (UI):", currentRound);

  console.log("Matches in Round:");
  roundRef.forEach(m => {
    console.log({
      id: m.id,
      home: m.homeTeamId,
      away: m.awayTeamId
    });
  });

  console.log("MATCH FROM HELPER:");
  console.log(myMatch);
  // =========================
  // 🔥 DEBUG END
  // =========================

  let html = "";

  schedule.forEach((round, rIndex) => {

    html += `<div class="round">
      <h3>Spieltag ${rIndex + 1}</h3>
      <ul style="list-style:none;padding:0;">`;

    round.forEach((match) => {

      const isActive =
        rIndex === currentRound &&
        myMatch &&
        match.id === myMatch.id;

      const home = getTeamName(match.home);
      const away = getTeamName(match.away);

      const scoreText =
        match._processed
          ? `${match.result.home}:${match.result.away}`
          : match.live
            ? `${match.live.score.home}:${match.live.score.away} (${match.live.minute}')`
            : "vs";

      html += `
        <li style="
          padding:6px;
          margin:2px 0;
          border-radius:4px;
          ${isActive ? "background:#1a1a1a;color:#00ff88;font-weight:bold;" : ""}
        ">
${home} ${scoreText} ${away}
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
window.renderSchedule = renderSchedule;
