// =========================
// 👤 PLAYER MODULE
// =========================
import { game } from "../core/state.js";
import { saveGame } from "../services/storage.js";
import { updateHeader } from "../ui/ui.js";

console.log("PLAYER MODULE");

// =========================
// 👤 INIT PLAYER
// =========================
function initPlayer(){

  game.player = game.player || { name: "" };

  const input = document.getElementById("nameInput");

  if(input){
    input.value = game.player.name || "";
  }

  updateHeader();
}

// =========================
// 👤 SET NAME (FIXED)
// =========================
function setPlayerName(name){

  // 👉 absichern
  if(!name || name.trim().length < 2){
    console.warn("❌ Ungültiger Name");
    return false;
  }

  // 👉 sicherstellen
  game.player = game.player || {};

  game.player.name = name.trim();

  saveGame();
  updateHeader();

  console.log("👤 Player gesetzt:", game.player.name);

  return true;
}

// =========================
// ✏️ NAME ÄNDERN
// =========================
function changeName(){

  const input = document.getElementById("nameInput");
  if(!input) return;

  const success = setPlayerName(input.value);

  if(!success){
    alert("Bitte gültigen Namen eingeben");
  }
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initPlayer,
  setPlayerName,
  changeName
};
