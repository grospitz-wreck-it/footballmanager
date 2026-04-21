// =========================
// 📦 STATE
// =========================
import { game } from "../core/state.js";
import { handleAppVisibility } from "../main.js"; // 🔥 oben hinzufügen
// =========================
// 🎬 SCREEN SWITCH
// =========================
function renderApp(){

  const splash = document.getElementById("splash");
  const app    = document.getElementById("app");

  if(!splash || !app) return;

  console.log("PHASE:", game.phase); // 🔥 DEBUG

  if(game.phase === "setup"){
    splash.style.display = "flex";
    app.style.display = "none";
  } else {
    splash.style.display = "none";
    app.style.display = "block";
  }
}

// =========================
// 🚀 START GAME (nach Profil)
// =========================
function startGame(){

if(!game.player.name){
console.warn("❌ Kein Name gesetzt");
return;
}

game.phase = "idle";
renderApp();
}

// =========================
// 📦 EXPORTS
// =========================
export {
renderApp,
startGame
};
