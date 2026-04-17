// =========================
// 🤖 OTHER MATCHES ENGINE
// =========================

import { game } from "../core/state.js";

// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

function isMyMatch(match){
  const myTeamId =
    normalizeId(game.team?.selectedId) ||
    normalizeId(game.team?.id);

  if(!myTeamId) return false;

  return (
    normalizeId(match.homeTeamId) === myTeamId ||
    normalizeId(match.awayTeamId) === myTeamId
  );
}

// =========================
// 🟢 INIT
// =========================
function initOtherMatches(round){

  if(!round?.length) return;

  round.forEach(match => {

    if(isMyMatch(match)) return;

    match.live = {
      minute: 0,
      score: { home: 0, away: 0 },
      running: true
    };

    match._processed = false;
  });

  console.log("🤖 Other matches initialized");
}

// =========================
// 🔁 TICK
// =========================
function updateOtherMatches(round){

  if(!round?.length) return;

  round.forEach(match => {

    if(isMyMatch(match)) return;
    if(!match.live || !match.live.running) return;

    match.live.minute++;

    // einfache Simulation (bewusst simpel!)
    if(Math.random() < 0.05){
      match.live.score.home++;
    }

    if(Math.random() < 0.05){
      match.live.score.away++;
    }

    // Ende
    if(match.live.minute >= 90){

      match.live.running = false;

      match.result = {
        home: match.live.score.home,
        away: match.live.score.away
      };

      match._processed = true;
    }

  });

}
export {
  initOtherMatches,
  updateOtherMatches
};
