// =========================
// 🔗 UI BINDINGS (CLEAN FIX)
// =========================
import {
  selectTeam,
  initLeagueSelect
} from "../modules/league.js";

import { setPlayerName } from "../modules/player.js";
import { renderApp } from "./layout.js";
import { updateUI } from "./ui.js";

import { saveGame, loadGame, clearSave } from "../services/storage.js";
import { game } from "../core/state.js";

// =========================
// 🧠 BINDINGS
// =========================
function bindUI(){

  const teamSelect = document.getElementById("teamSelect");
  const startBtn = document.getElementById("startBtn");

  const saveBtn = document.getElementById("saveBtn");
  const loadBtn = document.getElementById("loadBtn");
  const resetBtn = document.getElementById("resetBtn");

  // =========================
  // 👕 TEAM WÄHLEN
  // =========================
  if(teamSelect){
    teamSelect.onchange = (e) => {
      selectTeam(e.target.value);
    };
  }

  // =========================
  // 🟡 SPLASH START
  // =========================
  if(startBtn){
    startBtn.onclick = () => {

      const input = document.getElementById("nameInput");
      if(!input) return;

      const success = setPlayerName(input.value);

      if(!success){
        alert("Bitte gültigen Namen eingeben");
        return;
      }

      game.phase = "idle";

      const splash = document.getElementById("splash");
      const app = document.getElementById("app");

      if(splash) splash.style.display = "none";
      if(app) app.style.display = "block";

      renderApp();

      // 🔥 WICHTIG: neue UI bauen
      updateUI();
    };
  }

  // =========================
  // 💾 SAVE
  // =========================
  if(saveBtn){
    saveBtn.onclick = () => {
      saveGame();
      console.log("💾 Spiel gespeichert");
    };
  }

  // =========================
  // 📂 LOAD
  // =========================
  if(loadBtn){
    loadBtn.onclick = () => {

      const loaded = loadGame();

      if(!loaded){
        alert("Kein Save gefunden");
        return;
      }

      game.phase = "idle";

      const splash = document.getElementById("splash");
      const app = document.getElementById("app");

      if(splash) splash.style.display = "none";
      if(app) app.style.display = "block";

      renderApp();

      // 🔥 UI korrekt neu bauen
      updateUI();

      initLeagueSelect();
    };
  }

  // =========================
  // 🗑 RESET
  // =========================
  if(resetBtn){
    resetBtn.onclick = () => {

      if(confirm("Spielstand wirklich löschen?")){
        clearSave();
        location.reload();
      }
    };
  }
}

// =========================
// 📦 EXPORT
// =========================
export { bindUI };
