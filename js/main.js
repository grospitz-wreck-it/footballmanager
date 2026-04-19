// =========================
// 🚀 MAIN.JS START
// =========================
console.log("🚀 MAIN.JS LOADED");

// =========================
// 📦 IMPORTS
// =========================
import { game } from "./core/state.js";
import { on } from "./core/events.js";
import { EVENTS } from "./core/events.constants.js";
import "./core/eventStore.js";

import { supabase } from "./client.js";

import { initLeagueSelect, setLeagueById } from "./modules/league.js";
import { loadPlayers } from "./modules/loader.js";
import { startAdEngine } from "./modules/ads.js";
import {
  generateSchedule,
  advanceSchedule,
  renderSchedule
} from "./modules/scheduler.js";

import {
  runMatchLoop,
  initMatch,
  simulateOtherMatches
} from "./matchEngine.js";

import { updateUI } from "./ui/ui.js";

console.log("🔥 IMPORTS DONE");

// =========================
// 🧠 GLOBAL STATE
// =========================
let matchLoopRunning = false;
let simInterval = null;

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}
// =========================
// 🤖 BACKGROUND SIM
// =========================
function stopBackgroundSimulation(){
  if(simInterval){
    clearInterval(simInterval);
    simInterval = null;
  }
}

function startBackgroundSimulation(){

  if(simInterval) return;

  simInterval = setInterval(() => {

    const league = game.league?.current;
    const round = league?.schedule?.[game.league?.currentRound || 0];
    if(!round) return;

    const myTeamId = normalizeId(game.team?.selectedId);

    round.forEach(match => {

      if(
        normalizeId(match.homeTeamId) === myTeamId ||
        normalizeId(match.awayTeamId) === myTeamId
      ) return;

      if(match._processed || match.live?.running === false) return;

      if(!match.live){
        match.live = {
          minute: 0,
          score: { home: 0, away: 0 },
          running: true,
          started: false,
          startDelay: Math.random() * 6
        };
      }

      if(!match.live.started){
        match.live.startDelay -= 2;
        if(match.live.startDelay > 0) return;
        match.live.started = true;
      }

      match.live.minute += Math.floor(Math.random()*5)+1;

      if(Math.random() < 0.18){
        Math.random() < 0.5
          ? match.live.score.home++
          : match.live.score.away++;
      }

      if(match.live.minute >= 90){
        match.live.minute = 90;
        match.live.running = false;
        match.result = match.live.score;
        match._processed = true;
      }

    });

    updateUI();

  }, 2000);
}

// =========================
// 🔥 EVENTS
// =========================
function initEventBindings(){

  on(EVENTS.STATE_CHANGED, renderEvents);

  on(EVENTS.MATCH_FINISHED, () => {

    stopBackgroundSimulation();
    matchLoopRunning = false;

    if(game.match?.live){
      game.match.live.running = false;
    }

    if(game.events){
      game.events.history = [];
    }

    advanceSchedule();

    updateUI();
    renderEvents();
    renderSchedule();
  });
}
// =========================
// 📺 EVENTS UI
// =========================
function renderEvents(){

  const events = game.events?.history || [];
  const feed = document.getElementById("liveFeed");

  if(!feed) return;

  feed.innerHTML = events.slice(-20).reverse().map(e => {
    const safe = String(e.text)
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
    return `<div>${e.minute}' - ${safe}</div>`;
  }).join("");
}

// =========================
// 👁 APP VISIBILITY
// =========================
function handleAppVisibility(){

  const splash = document.getElementById("splash");
  const app = document.getElementById("app");

  const hasTeam = !!game.team?.selectedId;

  console.log("👁 VISIBILITY", {
    hasTeam,
    team: game.team
  });

  if(hasTeam){

    if(splash){
      splash.style.display = "none";
    }

    if(app){
      app.style.display = "block";
    }

  } else {

    if(splash){
      splash.style.display = "flex";
    }

    if(app){
      app.style.display = "none";
    }
  }
}
// =========================
// 🚀 INIT
// =========================
async function init(){

  window.game = game;

  initEventBindings();
  startAdEngine();

  try {

    // =========================
    // 🏆 TEAMS
    // =========================
    const { data: teamsRaw } =
      await supabase.from("teams").select("*");

    const teams = teamsRaw || [];
    window.teams = teams;

    console.log("🏆 Teams:", teams.length);

    // =========================
    // 👥 PLAYERS
    // =========================
    const loadedPlayers = await loadPlayers();

    window.playerPool = (loadedPlayers || []).map(p => ({
      ...p,
      team_id: p.team_id || null
    }));

    game.players = window.playerPool;

    // =========================
    // 🏟 COMPETITIONS
    // =========================
    const { data: competitionsRaw } =
      await supabase.from("competitions").select("*");

    const competitions = competitionsRaw || [];

    const leagues = competitions.map(c => {

      const leagueTeams = teams.filter(t =>
        String(t.competition_id) === String(c.id)
      ) || [];

      return {
        id: String(c.id),
        name: c.name,
        level: Number(c.level) || 7,
        teams: leagueTeams
      };
    });

    game.leagues = leagues;
    game.league = { available: leagues };

    initLeagueSelect(leagues);

    if(leagues.length){

  setLeagueById(leagues[0].id);
  generateSchedule();

  console.log("📅 SCHEDULE:", game.league.current?.schedule);

  const firstTeam = leagues[0]?.teams?.[0];

  if(firstTeam){
    game.team = {
      selectedId: String(firstTeam.id)
    };
    console.log("✅ TEAM AUTO-SET:", game.team.selectedId);
  } else {
    console.warn("⚠️ Kein Team in Liga gefunden");
  }

  // 🔥 ALLES HIER REIN
  handleAppVisibility();
  updateUI();
}

    initMainButton();
    updateMainButtonText();
    initResetButton();

  } catch(e){
    console.error("💥 INIT CRASH:", e);
  }
}
    
// =========================
// 🎯 MAIN BUTTON
// =========================
function initMainButton(){

  const btn = document.getElementById("mainButton");
  if(!btn) return;

  btn.onclick = () => {

    let live = game.match?.live;
    const league = game.league?.current;

    if(!league) return;

    // INIT
    if(!live){

      const round = league.schedule?.[league.currentRound || 0];
      if(!round) return;

      if(!initMatch(round)) return;

      live = game.match.live;
      live.running = false;
      live.phase = "first_half";
      live.minute = 0;

      updateMainButtonText();
      return;
    }
// =========================
// 🔄 RESET BUTTON
// =========================
function initResetButton(){

  const btn = document.getElementById("resetBtn");

  if(!btn){
    console.warn("⚠️ resetBtn nicht gefunden");
    return;
  }

  console.log("🔄 resetBtn ready");

  btn.onclick = async () => {

    console.log("🔄 RESET CLICKED");

    const m = await import("./services/storage.js");
    m.resetGame();

    game.team = null;
    game.match = null;
    game.league.current = null;

    handleAppVisibility();
    updateUI();
  };
}
    // BYE
    if(live.phase === "bye"){

      game.league.currentRound++;

      const nextRound = league.schedule?.[game.league.currentRound];
      if(!nextRound) return;

      initMatch(nextRound);
      simulateOtherMatches(nextRound);

      game.events.history = [];

      updateUI();
      updateMainButtonText();
      return;
    }

    // NEXT MATCH
    if(live.minute >= 90){

      game.league.currentRound++;

      const round = league.schedule?.[game.league.currentRound];
      if(!round) return;

      initMatch(round);

      startBackgroundSimulation();

      game.match.live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      return;
    }
        // HALFTIME
    if(
      live.phase === "halftime" ||
      (live.minute === 45 && !live.running)
    ){

      if(matchLoopRunning) return;

      startBackgroundSimulation();

      live.phase = "second_half";
      live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      return;
    }

    // START / RESUME
    if(live.running === false){

      if(matchLoopRunning) return;

      startBackgroundSimulation();

      live.running = true;
      matchLoopRunning = true;

      runMatchLoop({
        onTick: () => {
          updateUI();
          updateMainButtonText();
        },
        onEnd: () => {
          matchLoopRunning = false;
          updateUI();
          updateMainButtonText();
        }
      });

      return;
    }

    // PAUSE
    if(live.running === true){
      live.running = false;
      matchLoopRunning = false;
      updateMainButtonText();
    }

  };
}

// =========================
// 🔘 BUTTON TEXT
// =========================
function updateMainButtonText(){

  const btn = document.getElementById("mainButton");
  if(!btn) return;

  const live = game.match?.live;

  if(!live){
    btn.textContent = "Start Match";
    return;
  }

  if(live.phase === "bye") btn.textContent = "No Match";
  else if(live.minute >= 90) btn.textContent = "Next Match";
  else if(live.phase === "halftime") btn.textContent = "Start 2nd Half";
  else if(live.running) btn.textContent = "Pause";
  else if(live.minute > 0) btn.textContent = "Resume";
  else btn.textContent = "Start Match";
}

// =========================
// 🚀 BOOT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  await init();
});
