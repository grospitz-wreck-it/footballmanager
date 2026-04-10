// =========================
// 📦 IMPORTS
// =========================
import { updateUI } from "../ui/ui.js";
import { renderTable, renderLiveTable } from "../modules/table.js";
import { renderSchedule, nextMatch, advanceSchedule } from "../modules/scheduler.js";

import { game } from "./state.js";

import { emit } from "./events.js";
import { EVENTS } from "./events.constants.js";

// 🔥 FIX: richtiger Pfad!
import {
  initMatch,
  runMatchLoop,
  simulateOtherMatches,
  pauseMatch,
  resumeMatch
} from "../matchEngine.js";

import { saveGame } from "../services/storage.js";

// =========================
// 🧠 BUTTON LABEL
// =========================
function updateMainButton(){

  const btn = document.getElementById("mainButton");
  if(!btn) return;

  const phase = game.phase;
  const live = game.match?.live;

  if(phase === "setup"){
    btn.textContent = "Start";
    return;
  }

  if(phase === "idle"){
    btn.textContent = "Spiel starten";
    return;
  }

  if(phase === "live"){

    if(live?.phase === "halftime"){
      btn.textContent = "2. Halbzeit starten";
      return;
    }

    if(live?.running){
      btn.textContent = "Pause";
      return;
    }

    btn.textContent = "Weiter";
    return;
  }

  if(phase === "postmatch"){
    btn.textContent = "Nächstes Spiel";
    return;
  }

  if(phase === "season_end"){
    btn.textContent = "Saison beendet";
    return;
  }
}

// =========================
// ▶️ BUTTON ACTION
// =========================
function handleMainAction(){

  const live = game.match?.live;
  const phase = game.phase;

  console.log("▶️ Action:", phase, live);

  if(phase === "postmatch"){
    advanceGame();
    startMatch();
    updateMainButton();
    return;
  }

  if(phase === "setup" || phase === "idle"){
    startMatch();
    updateMainButton();
    return;
  }

  if(phase === "live"){

    if(live?.phase === "halftime"){
      resumeMatch();
      updateMainButton();
      return;
    }

    if(live?.running){
      pauseMatch();
      updateMainButton();
      return;
    }

    resumeMatch();
    updateMainButton();
  }
}

// =========================
// 🏁 START MATCH
// =========================
function startMatch(){

  console.log("🚀 START MATCH");

  const match = nextMatch();

  if(!match){
    game.phase = "season_end";
    updateMainButton();
    return;
  }

  const r = game.league.currentRound;
  const m = game.league.currentMatchIndex;

  const round = game.league.schedule?.[r];
  const realMatch = match;

  if(!round){
    console.error("❌ Kein Spieltag gefunden");
    return;
  }

  // 🔥 Gegner simulieren
  if(!round._simulated){
    simulateOtherMatches(round);
    round._simulated = true;
    console.log("🧠 Spieltag simuliert:", r);
  }

  const success = initMatch([realMatch]);

  if(!success){
    console.error("❌ initMatch failed");
    return;
  }

  game.match.current._ref = realMatch;

  // 🔥 Spieler laden (robust)
  try {
    const current = game.match?.current;

    if(current){
      const pool = window.playerPool || [];

      current.homePlayers = pool.filter(p =>
        p.Team === current.home ||
        p.team === current.home ||
        p.club === current.home
      );

      current.awayPlayers = pool.filter(p =>
        p.Team === current.away ||
        p.team === current.away ||
        p.club === current.away
      );
    }

  } catch(e){
    console.warn("⚠️ Player attach failed", e);
  }

  // 🔁 RESET
  game.match.live = {
    minute: 0,
    running: false,
    score: { home: 0, away: 0 },
    events: [],
    phase: "first_half"
  };

  game.phase = "live";

  emit(EVENTS.GAME_START);

  updateUI();
  renderTable();
  renderSchedule();
  updateMainButton();

  runMatchLoop({
    onTick: () => {
      updateUI();
      renderLiveTable();
      renderSchedule();
      updateMainButton();
    },

    onEnd: () => {

      console.log("🏁 MATCH ENDE");

      const matchRef = game.league.schedule?.[r]?.[m];

      if(matchRef){
        matchRef._processed = true;
        matchRef.result = {
          home: game.match.live.score.home,
          away: game.match.live.score.away
        };
      }

      game.phase = "postmatch";

      saveGame();

      updateUI();
      renderTable();
      renderSchedule();
      updateMainButton();
    }
  });
}

// =========================
// ➡️ ADVANCE GAME
// =========================
function advanceGame(){

  advanceSchedule();

  const schedule = game.league.schedule;
  const r = game.league.currentRound;
  const m = game.league.currentMatchIndex;

  const next = schedule?.[r]?.[m];

  if(!next){
    game.phase = "season_end";

    saveGame();
    updateUI();
    updateMainButton();
    return;
  }

  game.match.current = null;

  game.match.live = {
    minute: 0,
    running: false,
    score: { home: 0, away: 0 },
    events: [],
    phase: "first_half"
  };

  game.phase = "idle";

  saveGame();

  updateUI();
  renderSchedule();
  updateMainButton();
}

// =========================
// 📦 EXPORTS
// =========================
export {
  startMatch,
  handleMainAction,
  updateMainButton
};
