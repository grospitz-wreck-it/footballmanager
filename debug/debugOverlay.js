// =========================
// 🐞 DEBUG OVERLAY (FINAL + EVENTS)
// =========================

import { game } from "../js/core/state.js";
function isDebugEnabled(){
  return localStorage.getItem("debugOverlay") === "true";
}
// =========================
// 🧠 GLOBAL EVENT BUFFER
// =========================
if(!window.__DEBUG_EVENTS){
  window.__DEBUG_EVENTS = [];
}

// =========================
// 🧠 HELPERS
// =========================
function safe(val){
  if(val === null || val === undefined) return "-";
  return val;
}

function el(tag, style){
  const e = document.createElement(tag);
  if(style) Object.assign(e.style, style);
  return e;
}

// =========================
// 🧱 BUILD UI
// =========================
function createOverlay(){

  const container = el("div", {
    position: "fixed",
    bottom: "10px",
    right: "10px",
    width: "340px",
    maxHeight: "80vh",
    overflow: "auto",
    background: "rgba(0,0,0,0.9)",
    color: "#00ff88",
    fontSize: "12px",
    fontFamily: "monospace",
    padding: "10px",
    borderRadius: "8px",
    zIndex: 99999,
    boxShadow: "0 0 10px rgba(0,255,136,0.3)",
    userSelect: "text"
  });

  const header = el("div", {
    fontWeight: "bold",
    marginBottom: "8px",
    cursor: "pointer"
  });

  const content = el("div");

  let frozen = false;

  header.textContent = "🐞 DEBUG";

  // Toggle sichtbar
  header.onclick = () => {
    content.style.display =
      content.style.display === "none" ? "block" : "none";
  };

  // Freeze
  header.ondblclick = () => {
    frozen = !frozen;
    header.textContent = frozen
      ? "🐞 DEBUG (FROZEN)"
      : "🐞 DEBUG";
  };

  container.appendChild(header);
  container.appendChild(content);
  document.body.appendChild(container);

  return { content, getFrozen: () => frozen };
}

// =========================
// 🔄 RENDER
// =========================
function render(content){

  const league = game.league?.current;
  const match = game.match?.current;
  const live = game.match?.live;

  const events = window.__DEBUG_EVENTS || [];

  content.innerHTML = `
<b>📊 LEAGUE</b>
ID: ${safe(league?.id)}
Name: ${safe(league?.name)}
Teams: ${safe(league?.teams?.length)}

<b>👤 TEAM</b>
Selected ID: ${safe(game.team?.selectedId)}
Selected Name: ${safe(game.team?.selected)}

<b>📅 SCHEDULE</b>
Rounds: ${safe(league?.schedule?.length)}
Current Round: ${safe(game.league?.currentRound)}
Match Index: ${safe(game.league?.currentMatchIndex)}

<b>⚽ MATCH</b>
Match ID: ${safe(match?.id)}
Home ID: ${safe(match?.homeTeamId)}
Away ID: ${safe(match?.awayTeamId)}
Home Name: ${safe(match?.homeName)}
Away Name: ${safe(match?.awayName)}

<b>🎮 LIVE</b>
Running: ${safe(live?.running)}
Minute: ${safe(live?.minute)}
Score: ${safe(live?.score?.home)} : ${safe(live?.score?.away)}

<b>🧠 STATE</b>
Phase: ${safe(game.phase)}

<b>📡 EVENTS</b>
${events.length
  ? events.map(e => `
    ${e.minute}' ${e.type}
    ${e.playerId ? `👤 ${e.playerId.slice(0,6)}` : ""}
    ${e.assets?.[0]?.url ? "🎥" : ""}
  `).join("<br>")
  : "-"
}
`;
}

// =========================
// 🚀 INIT
// =========================
function initDebugOverlay(){

  if(!isDebugEnabled()){
    console.log("🐞 Debug Overlay deaktiviert");
    return;
  }
  const { content, getFrozen } = createOverlay();

  let isHovering = false;

  content.addEventListener("mouseenter", () => {
    isHovering = true;
  });

  content.addEventListener("mouseleave", () => {
    isHovering = false;
  });

  setInterval(() => {
    if(!isHovering && !getFrozen()){
      render(content);
    }
  }, 500);
window.addEventListener("storage", () => {
  location.reload(); // simpel & stabil
});
  console.log("🐞 Debug Overlay aktiv");
}

// =========================
// 📦 EXPORT
// =========================
export { initDebugOverlay };
