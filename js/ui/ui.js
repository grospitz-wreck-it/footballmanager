// =========================
// 🖥 UI ENGINE (FULL + LIVE TABLE SAFE)
// =========================
import { game } from "../core/state.js";
import { buildCommentary } from "../engine/commentaryEngine.js";

// 🔥 FIX: richtiger Import (DEIN PFAD)
import { renderLiveTable } from "../modules/table.js";

// =========================
// 🔒 INTERNAL
// =========================
let initialized = false;
let lastRenderedEventId = null;
let liveTableInterval = null;

// =========================
// 🚀 INIT (EINMAL!)
// =========================
function initUI(){

  if(initialized) return;
  initialized = true;

  console.log("🧱 UI init");

  const burger = document.getElementById("burgerBtn");
  const wrapper = document.getElementById("sidebarWrapper");
  const overlay = document.getElementById("sidebarOverlay");

  if(!burger || !wrapper){
    console.error("❌ Sidebar DOM fehlt");
    return;
  }

  burger.addEventListener("click", () => {
    game.ui.sidebarOpen = !game.ui.sidebarOpen;
    applySidebar();
  });

  overlay?.addEventListener("click", () => {
    game.ui.sidebarOpen = false;
    applySidebar();
  });
}

// =========================
// 📂 SIDEBAR APPLY
// =========================
let lastSidebarState = null;

function applySidebar(){

  if(game.ui.sidebarOpen === lastSidebarState) return;

  lastSidebarState = game.ui.sidebarOpen;

  const wrapper = document.getElementById("sidebarWrapper");
  if(!wrapper) return;

  wrapper.classList.toggle("open", game.ui.sidebarOpen);
}

// =========================
// 🔄 GLOBAL UI UPDATE
// =========================
function updateUI(){

  initUI();

  applySidebar();

  updateScore();
  updateProgress();
  updateEvents();
  updateTabs();

  // 🔥 LIVE TABLE (nur wenn sichtbar)
  if(game.ui.tab === "table"){
    renderLiveTable();
    ensureLiveTableLoop();
  }
  if(game.ui.tab === "team"){
  renderTeam();
}
}

// =========================
// ⚽ SCORE
// =========================
function updateScore(){

  console.log("CURRENT MATCH:", game.match?.current);

  const match = game.match?.live;
  if(!match) return;

  const scoreEl = document.getElementById("topScore");
  const teamsEl = document.getElementById("topTeams");
  const minuteEl = document.getElementById("topMinute");

  if(teamsEl){
    const current = game.match?.current;

    if(current){
      const homeName =
        current.homeName ||
        (typeof current.home === "string"
          ? current.home
          : current.home?.name || current.home?.Team) ||
        "-";

      const awayName =
        current.awayName ||
        (typeof current.away === "string"
          ? current.away
          : current.away?.name || current.away?.Team) ||
        "-";

      teamsEl.textContent = `${homeName} vs ${awayName}`;
    }
  }

  if(!scoreEl || !teamsEl || !minuteEl) return;

  const home = match.score?.home ?? 0;
  const away = match.score?.away ?? 0;

  scoreEl.textContent = `${home} : ${away}`;

  const minute = match.minute ?? 0;
  minuteEl.textContent = `${minute}'`;
}

// =========================
// ⏱ PROGRESS
// =========================
function updateProgress(){

  const el = document.getElementById("progressFill");
  if(!el) return;

  const minute = game.match?.live?.minute || 0;
  const percent = Math.min((minute / 90) * 100, 100);

  el.style.width = percent + "%";
}

// =========================
// 📰 EVENTS (UNVERÄNDERT)
// =========================
function updateEvents(){

  const container = document.getElementById("liveFeed");
  if(!container) return;

  const events = game.events?.history;
  if(!events || events.length === 0) return;

  const newest = events[events.length - 1];

  if(newest.id === lastRenderedEventId) return;
  lastRenderedEventId = newest.id;

  let text = newest.text;

  if(!text){
    try {
      console.warn("⚠️ Missing text → fallback engine", newest);
      text = buildCommentary(newest);
    } catch(e){
      console.warn("⚠️ Commentary error", e);
    }
  }

  if(!text) return;

  const div = document.createElement("div");

  div.innerHTML = `
    <span style="color:#888">${newest.minute}'</span> 
    <span>${text}</span>
  `;

  if(newest.type === "GOAL"){
    div.style.color = "#00ff88";
    div.style.fontWeight = "bold";
  }

  if(newest.type === "FOUL"){
    div.style.color = "#ffcc00";
  }

  if(newest.type === "SAVE" || newest.type === "SHOT_SAVED"){
    div.style.color = "#00ccff";
  }

  if(newest.type === "CORNER"){
    div.style.color = "#ffaa00";
  }

  if(!game.events?.history?.length) return;

  console.log("🧠 UI updateEvents (skipped - main handles rendering)");
}

// =========================
// 📊 TABS
// =========================
function updateTabs(){

  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(tab => {

    const name = tab.dataset.tab;

    if(name === game.ui.tab){
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }

    tab.onclick = () => {

      game.ui.tab = name;

      document.querySelectorAll(".tab-view").forEach(v => {
        v.style.display = "none";
      });

      if(name === "table"){
        document.getElementById("tableView").style.display = "block";
      }

      if(name === "schedule"){
        document.getElementById("scheduleView").style.display = "block";
      }

      if(name === "team"){
        document.getElementById("teamView").style.display = "block";
      }

      updateUI();
    };
  });
}

// =========================
// 🔥 LIVE TABLE LOOP
// =========================
function ensureLiveTableLoop(){

  if(liveTableInterval) return;

  liveTableInterval = setInterval(() => {

    if(game.ui.tab !== "table") return;

    renderLiveTable();

  }, 1000);
}

// =========================
// 📅 SCHEDULE
// =========================
function renderSchedule(){
  console.log("📅 renderSchedule");
}

// =========================
// ⚽ CURRENT MATCH
// =========================
function renderCurrentMatch(){
  console.log("⚽ renderCurrentMatch");
}


function renderTeam(){

  const container = document.getElementById("teamView");
  if(!container) return;

  const teamId = game.team?.selectedId;

  const players = (game.players || []).filter(p => 
    String(p.team_id) === String(teamId)
  );

  if(!players.length){
    container.innerHTML = "<p>Keine Spieler vorhanden</p>";
    return;
  }

  // =========================
  // ⚽ SORTIERUNG
  // =========================
  const byType = {
    GK: [],
    DEF: [],
    MID: [],
    ST: []
  };

  players.forEach(p => {
    const type = p.position_type || "MID";
    if(byType[type]){
      byType[type].push(p);
    } else {
      byType.MID.push(p);
    }
  });

  const starters = [
    ...byType.GK.slice(0,1),
    ...byType.DEF.slice(0,4),
    ...byType.MID.slice(0,4),
    ...byType.ST.slice(0,2)
  ];

  const usedIds = new Set(starters.map(p => p.id));
  const bench = players.filter(p => !usedIds.has(p.id));

  // =========================
  // 🎨 FIELD
  // =========================
  let html = `
    <h3>Starting XI</h3>
    <div class="team-field">
  `;

  const positions = [
    { top: "90%", left: "50%" }, // GK

    { top: "70%", left: "20%" },
    { top: "70%", left: "40%" },
    { top: "70%", left: "60%" },
    { top: "70%", left: "80%" },

    { top: "45%", left: "25%" },
    { top: "45%", left: "50%" },
    { top: "45%", left: "75%" },

    { top: "20%", left: "35%" },
    { top: "20%", left: "65%" }
  ];

  starters.forEach((p, i) => {
    const pos = positions[i] || { top: "50%", left: "50%" };

    html += `
      <div class="player-pos" style="top:${pos.top}; left:${pos.left}">
        ${renderPlayerDot(p)}
      </div>
    `;
  });

  html += `</div>`;

  // =========================
  // 🪑 BENCH
  // =========================
  html += `
    <h3>Bench</h3>
    <div class="bench-row">
  `;

  bench.forEach(p => {
    html += renderPlayerDot(p);
  });

  html += `</div>`;

  container.innerHTML = html;

  // =========================
  // 🖱 CLICK HANDLER
  // =========================
  setTimeout(() => {
    document.querySelectorAll(".player-dot").forEach(el => {
      el.onclick = () => {
        const id = el.dataset.id;
        const player = game.players.find(p => p.id === id);
        if(player) openPlayerModal(player);
      };
    });
  }, 0);
}

// =========================
// 📦 EXPORTS
// =========================
export {
  updateUI,
  renderSchedule,
  renderCurrentMatch
};
