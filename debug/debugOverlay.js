// =========================
// 🧪 DEBUG OVERLAY (READ ONLY)
// =========================
import { game } from "../core/state.js";

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
    width: "320px",
    maxHeight: "80vh",
    overflow: "auto",
    background: "rgba(0,0,0,0.9)",
    color: "#00ff88",
    fontSize: "12px",
    fontFamily: "monospace",
    padding: "10px",
    borderRadius: "8px",
    zIndex: 99999,
    boxShadow: "0 0 10px rgba(0,255,136,0.3)"
  });

  const header = el("div", {
    fontWeight: "bold",
    marginBottom: "8px",
    cursor: "pointer"
  });

  header.textContent = "🐞 DEBUG (click to toggle)";

  const content = el("div");

  header.onclick = () => {
    content.style.display =
      content.style.display === "none" ? "block" : "none";
  };

  container.appendChild(header);
  container.appendChild(content);
  document.body.appendChild(container);

  return content;
}

// =========================
// 🔄 RENDER
// =========================
function render(content){

  const league = game.league?.current;
  const match = game.match?.current;
  const live = game.match?.live;

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
`;
}

// =========================
// 🚀 INIT
// =========================
function initDebugOverlay(){

  const content = createOverlay();

  setInterval(() => {
    render(content);
  }, 300);
}

export { initDebugOverlay };
