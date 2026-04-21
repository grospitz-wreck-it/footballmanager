// =========================
// 📅 SPIELPLAN GENERIEREN (FINAL CLEAN FIXED)
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
function getTeamName(teamOrId){

  if(!teamOrId) return "Unbekannt";

  // 👉 wenn Objekt mit name → easy
  if(typeof teamOrId === "object" && teamOrId.name){
    return teamOrId.name;
  }

  // 👉 fallback: über ID auflösen
  const id = typeof teamOrId === "object"
    ? teamOrId.id
    : teamOrId;

  const league = game.league?.current;

  const team = league?.teams?.find(
    t => String(t.id) === String(id)
  );

  return team?.name || "Unbekannt";
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
function generateSchedule(league){

  if(!league || !Array.isArray(league.teams) || league.teams.length < 2){
    console.error("❌ Ungültige Liga / zu wenig Teams");
    return null;
  }

  // 🔥 Schedule behalten nur wenn Teamzahl identisch
  if(
    league.schedule &&
    league.schedule.length > 0 &&
    league._teamCount === league.teams.length
  ){
    console.log("ℹ️ Spielplan existiert bereits");
    return league.schedule;
  }

  // =========================
  // 🧠 TEAMS NORMALIZEN
  // =========================
  const seen = new Set();
  let teams = [];

  league.teams.forEach(t => {

    const id = t?.id ? String(t.id) : null;

    if(!id){
      console.error("❌ Team ohne ID:", t);
      return;
    }

    if(seen.has(id)){
      console.warn("⚠️ Duplicate Team ID:", id);
      return;
    }

    seen.add(id);
    teams.push(t);
  });

  if(teams.length < 2){
    console.error("❌ Zu wenig gültige Teams");
    return null;
  }

  console.log("✅ Validierte Teams:", teams.length);

  // =========================
  // 🔁 BYE
  // =========================
  if(teams.length % 2 !== 0){
    teams.push({ id: "BYE", name: "BYE" });
  }

  const effectiveTeamCount = teams.filter(t => t.id !== "BYE").length;

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

    const swap = r % 2 === 1;

    const home = swap ? teamB : teamA;
    const away = swap ? teamA : teamB;

    if(home.id === "BYE" || away.id === "BYE") continue;

    round.push({
      id: crypto.randomUUID(),
      homeTeamId: String(home.id),
      awayTeamId: String(away.id),

      // 🔥 FIX: KEINE TEAM OBJEKTE MEHR
      home: null,
      away: null,

      result: null,
      _processed: false
    });
  }

  // Shuffle
  for(let i = round.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [round[i], round[j]] = [round[j], round[i]];
  }

  rounds.push(round);

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

    return {
      id: crypto.randomUUID(),
      homeTeamId: String(match.awayTeamId),
      awayTeamId: String(match.homeTeamId),

      // 🔥 FIX: KEINE FAKE TEAMS
      home: null,
      away: null,

      result: null,
      _processed: false
    };
  });

  // Shuffle
  for(let i = newRound.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [newRound[i], newRound[j]] = [newRound[j], newRound[i]];
  }

  return newRound;
});

  // =========================
  // 📊 FINAL
  // =========================
  league.schedule = [...rounds, ...returnRounds];

  league.schedule.forEach(r => {
    r._simulated = false;
  });

  league.currentRound = 0;
  league.currentMatchIndex = 0;
  league._teamCount = league.teams.length;

  console.log("✅ Spielplan erstellt:", league.schedule.length);

  return league.schedule;
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

  let fallback = null;

  for(let r = 0; r < schedule.length; r++){
    for(let m = 0; m < schedule[r].length; m++){

      const match = schedule[r][m];

      if(match._processed) continue;

      if(!fallback){
        fallback = match;
      }

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

  if(!fallback){
    console.warn("⚠️ Keine offenen Matches mehr");
    return null;
  }

  return fallback;
}

// =========================
// ⏭ ADVANCE
// =========================
function advanceSchedule(){

  const schedule = game.league?.current?.schedule;
  if(!schedule?.length) return;

  let r = game.league.currentRound ?? 0;
  let m = game.league.currentMatchIndex ?? 0;

  // 👉 nächstes Match
  m++;

  // 👉 nächster Spieltag
  if(m >= (schedule[r]?.length || 0)){
    m = 0;
    r++;
  }

  // 👉 Saison Ende Guard
  if(r >= schedule.length){
    console.log("🏁 Saison beendet");
    game.league.currentRound = schedule.length - 1;
    game.league.currentMatchIndex = 0;
    return;
  }

  // 👉 State setzen
  game.league.currentRound = r;
  game.league.currentMatchIndex = m;

  // 👉 UI SYNC (🔥 wichtig für deinen Swipe-View)
  if(typeof window !== "undefined"){
    window.scheduleViewIndex = r;
  }

  // 👉 optional Debug
  console.log("➡️ Advance:", {
    round: r,
    match: m
  });
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

    round.forEach((match, mIndex) => {

      const isActive =
        (myMatch && match.id === myMatch.id) ||
        (rIndex === game.league.currentRound &&
         mIndex === game.league.currentMatchIndex);

      html += `
        <li style="
          padding:6px;
          margin:2px 0;
          border-radius:4px;
          ${isActive ? "background:#1a1a1a;color:#00ff88;font-weight:bold;" : ""}
        ">
${getTeamName(match.homeTeamId)} ${match.result ? match.result.home + ":" + match.result.away : "vs"} ${getTeamName(match.awayTeamId)}
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
  renderSchedule
};
