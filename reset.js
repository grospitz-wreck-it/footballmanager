// =========================
// 🔄 HARD RESET
// =========================

import { game } from "../core/state.js";

function resetGame(){

  console.log("🔄 RESET GAME");

  // 🔥 localStorage killen
  localStorage.removeItem("kreisliga_save");

  // 🔥 State komplett zurücksetzen
  game.phase = "setup";

  game.team = {
    selected: null,
    selectedId: null
  };

  game.league = {
    current: null,
    schedule: [],
    currentRound: 0,
    currentMatchIndex: 0
  };

  game.match = {
    current: null,
    live: {
      minute: 0,
      running: false,
      score: { home: 0, away: 0 },
      events: [],
      phase: "first_half"
    }
  };

  // 🔥 UI reload (sauberster Weg)
  location.reload();
}

export { resetGame };
