// =========================
// ⚙️ CONTROLS FIXED
// =========================

// 🔥 globale Variable (Engine nutzt die gleiche!)
window.speedMultiplier = 1;

// =========================
// 🚀 SPEED
// =========================
function setSpeed(val){
  window.setSpeed(val); // an engine delegieren
}

// =========================
// 🎮 OPTIONAL: LIVE MODES
// =========================
function setLiveMode(mode){
  console.log("Live Mode:", mode);
}

function setTactic(){
  console.log("Taktik geändert");
}

function setFormation(){
  console.log("Formation geändert");
}

function makeSub(){
  console.log("Wechsel durchgeführt");
}

function setIntensity(val){
  console.log("Intensität:", val);
}
window.selectLeague = selectLeague;
window.selectTeam = selectTeam;
window.resetGame = resetGame;
window.setSpeed = setSpeed;
