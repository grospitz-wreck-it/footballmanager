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

  const id =
    typeof teamOrId === "object"
      ? teamOrId.id
      : teamOrId;

  const league = game.league?.current;

  if(!league?.teams) return "Unbekannt";

  const team = league.teams.find(
    t => String(t.id) === String(id)
  );

  return team?.name ?? team?.Name ?? "Unbekannt";
}
function hydrateMatchTeams(match){

  const league = game.league?.current;
  if(!league) return match;

  match.home = league.teams.find(
    t => String(t.id) === String(match.homeTeamId)
  ) || null;

  match.away = league.teams.find(
    t => String(t.id) === String(match.awayTeamId)
  ) || null;

  return match;
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
// ⚖️ HOME/AWAY BALANCE (NEU)
// =========================
const homeAwayBalance = {};

function getBalance(id){
  return homeAwayBalance[id] || 0;
}

function updateBalance(home, away){
  homeAwayBalance[home] = getBalance(home) + 1;
  homeAwayBalance[away] = getBalance(away) - 1;
}

  // =========================
  // 🔥 HINRUNDE
  // =========================
  for(let r = 0; r < totalRounds; r++){

  const round = [];

  for(let i = 0; i < half; i++){

    const teamA = rotation[i];
    const teamB = rotation[rotation.length - 1 - i];

    let home = teamA;
let away = teamB;

// 🔥 Balance prüfen
const balanceA = getBalance(teamA.id);
const balanceB = getBalance(teamB.id);

// 👉 Team mit mehr Heimspielen wird Auswärts
if(balanceA > balanceB){
  home = teamB;
  away = teamA;
}

updateBalance(home.id, away.id);

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
// 🎯 MATCHDAY SIMULATION (HIER EINFÜGEN)
// =========================

function simulateMatchFast(match){

  const homeGoals = Math.floor(Math.random() * 5);
  const awayGoals = Math.floor(Math.random() * 5);

  match.result = {
    home: homeGoals,
    away: awayGoals
  };

  match._processed = true;

  updateTable(match.homeTeamId, match.awayTeamId, homeGoals, awayGoals);
}


// =========================
// 📊 TABLE UPDATE
// =========================
function updateTable(homeId, awayId, homeGoals, awayGoals){

  const table = game.league?.current?.table;
  if(!table) return;

  const home = table.find(t => String(t.id) === String(homeId));
  const away = table.find(t => String(t.id) === String(awayId));

  if(!home || !away) return;

  home.played++;
  away.played++;

  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;

  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if(homeGoals > awayGoals){
    home.points += 3;
  } else if(awayGoals > homeGoals){
    away.points += 3;
  } else {
    home.points += 1;
    away.points += 1;
  }
}


// =========================
// 🎯 SIMULATE MATCHDAY
// =========================
function simulateMatchday(){

  const league = game.league?.current;
  if(!league) return;

  const roundIndex = league.currentRound ?? 0;
  const round = league.schedule?.[roundIndex];
  if(!round) return;

  const myTeamId = String(game.team?.selectedId || "");

  round.forEach(match => {

    const isMyMatch =
      myTeamId &&
      (
        String(match.homeTeamId) === myTeamId ||
        String(match.awayTeamId) === myTeamId
      );

    if(isMyMatch) return;
    if(match._processed) return;

    simulateMatchFast(match);
  });

  console.log("⚡ Spieltag simuliert (AI Matches)");
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
        return hydrateMatchTeams(match); // 🔥 FIX

      }
    }
  }

  if(!fallback){
    console.warn("⚠️ Keine offenen Matches mehr");
    return null;
  }

return hydrateMatchTeams(fallback); 
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

      const isUserMatch =
  game.match?.current &&
  match.id === game.match.current.id;

const isCurrent =
  rIndex === game.league.currentRound &&
  mIndex === game.league.currentMatchIndex;

      html += `
        <li style="
          padding:6px;
          margin:2px 0;
          border-radius:4px;
          ${
  isUserMatch
    ? "background:#1a1a1a;color:#00ff88;font-weight:bold;"
    : isCurrent
      ? "background:#111;color:#aaa;"
      : ""
}
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
  renderSchedule,
  simulateMatchday,
  updateTable
};
