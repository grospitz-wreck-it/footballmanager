// =========================
// 🖥 UI ENGINE (FULL + LIVE TABLE SAFE)
// =========================
import { game } from "../core/state.js";
import { buildCommentary } from "../engine/commentaryEngine.js";
import { renderLiveTable } from "../modules/table.js";
import { getPlayerTexture } from "../modules/playerGenerator/playerGenerator.js";
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

  scoreEl.textContent = `${match.score?.home ?? 0} : ${match.score?.away ?? 0}`;
  minuteEl.textContent = `${match.minute ?? 0}'`;
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
// 📰 EVENTS
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
      text = buildCommentary(newest);
    } catch(e){}
  }

  if(!text) return;

  const div = document.createElement("div");

  div.innerHTML = `
    <span style="color:#888">${newest.minute}'</span> 
    <span>${text}</span>
  `;

  container.appendChild(div);
  
}

// =========================
// 📊 TABS
// =========================
function updateTabs(){

  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(tab => {

    const name = tab.dataset.tab;

    tab.classList.toggle("active", name === game.ui.tab);

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
// ⚽ FORMATIONS
// =========================
const FORMATIONS = {
  "4-4-2": [
    { role: "GK", top: "50%", left: "10%" },
    { role: "DEF", top: "20%", left: "25%" },
    { role: "DEF", top: "40%", left: "25%" },
    { role: "DEF", top: "60%", left: "25%" },
    { role: "DEF", top: "80%", left: "25%" },
    { role: "MID", top: "20%", left: "50%" },
    { role: "MID", top: "40%", left: "50%" },
    { role: "MID", top: "60%", left: "50%" },
    { role: "MID", top: "80%", left: "50%" },
    { role: "ST", top: "40%", left: "75%" },
    { role: "ST", top: "60%", left: "75%" }
  ],

  "4-3-3": [
    { role: "GK", top: "50%", left: "10%" },
    { role: "DEF", top: "20%", left: "25%" },
    { role: "DEF", top: "40%", left: "25%" },
    { role: "DEF", top: "60%", left: "25%" },
    { role: "DEF", top: "80%", left: "25%" },
    { role: "MID", top: "30%", left: "50%" },
    { role: "MID", top: "50%", left: "50%" },
    { role: "MID", top: "70%", left: "50%" },
    { role: "ST", top: "20%", left: "75%" },
    { role: "ST", top: "50%", left: "75%" },
    { role: "ST", top: "80%", left: "75%" }
  ]
};

// =========================
// 🧠 ROLE PICKER
// =========================
function pickPlayer(role, byType){

  if(byType[role]?.length){
    return byType[role].shift();
  }

  return (
    byType.GK.shift() ||
    byType.DEF.shift() ||
    byType.MID.shift() ||
    byType.ST.shift()
  );
}

// =========================
// ⚽ TEAM
// =========================
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

  const byType = { GK: [], DEF: [], MID: [], ST: [] };

  players.forEach(p => {
    const type = p.position_type || "MID";
    (byType[type] || byType.MID).push(p);
  });

  // Sortieren
  Object.values(byType).forEach(arr => {
    arr.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  });

  const starters = [
    ...byType.GK.slice(0,1),
    ...byType.DEF.slice(0,4),
    ...byType.MID.slice(0,4),
    ...byType.ST.slice(0,2)
  ];

  const bench = players.filter(p => !starters.includes(p));

  const formation = game.team?.formation || "4-4-2";
  const layout = FORMATIONS[formation] || FORMATIONS["4-4-2"];

  const pool = {
    GK: [...byType.GK],
    DEF: [...byType.DEF],
    MID: [...byType.MID],
    ST: [...byType.ST]
  };

  let html = `
    <h3>Starting XI</h3>
    <div class="team-field">
  `;

  layout.forEach(slot => {

    const player = pickPlayer(slot.role, pool);
    if(!player) return;

    html += `
      <div class="player-pos" style="top:${slot.top}; left:${slot.left}">
        ${renderPlayerDot(player)}
      </div>
    `;
  });

  html += `</div>`;

  // Bench
  html += `<h3>Bench</h3>`;

  const benchByType = { GK: [], DEF: [], MID: [], ST: [] };

  bench.forEach(p => {
    const type = p.position_type || "MID";
    (benchByType[type] || benchByType.MID).push(p);
  });

  Object.values(benchByType).forEach(arr => {
    arr.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  });

  html += `<div class="bench-container">`;

  Object.entries(benchByType).forEach(([role, players]) => {

    if(players.length === 0) return;

    html += `
      <div class="bench-group">
        <div class="bench-title">${role}</div>
        <div class="bench-row">
    `;

    players.forEach(p => {
      html += renderPlayerDot(p);
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;

  // Clicks
  document.querySelectorAll(".player-dot").forEach(el => {
    el.onclick = () => {
      const id = el.dataset.id;
      const player = game.players.find(p => String(p.id) === String(id));
      if(player) openPlayerModal(player);
    };
  });
}

// =========================
// 🔵 PLAYER DOT
// =========================
function renderPlayerDot(player){

  const initials =
    (player.first_name?.[0] || "") +
    (player.last_name?.[0] || "");

  return `
    <div class="player-dot" data-id="${player.id}" data-tier="${player.tier}">
      <img src="./gfx/dotpurple1.webp" />
      <span class="label">${initials}</span>
    </div>
  `;
}

// =========================
// 📊 STATS
// =========================
function renderStat(label, value){

  const v = value ?? 0;

  return `
    <div class="stat-row">
      <span>${label}</span>
      <div class="stat-bar">
        <div class="fill" style="width:${v}%"></div>
      </div>
      <span>${v}</span>
    </div>
  `;
}

/* =========================
🪟 MODAL LAYER
========================= */

#playerModal {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.modal-overlay {
  position: absolute;
  inset: 0;

  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(8px);

  display: flex;
  align-items: center;
  justify-content: center;

  animation: fadeIn 0.2s ease;
}


/* =========================
🎴 PLAYER CARD (FINAL)
========================= */

.player-modal {
  width: 260px;
  max-width: 90%;

  border-radius: 22px;
  padding: 16px;

  position: relative;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  color: white;

  /* BASE */
  background: linear-gradient(160deg, #111A2B, #0B1220);

  /* 🔥 STRUCTURE */
  background-image:
    linear-gradient(160deg, rgba(255,255,255,0.05), transparent),
    repeating-linear-gradient(
      135deg,
      rgba(255,255,255,0.03) 0px,
      rgba(255,255,255,0.03) 2px,
      transparent 2px,
      transparent 6px
    );

  /* 🔥 DEPTH */
  box-shadow:
    0 30px 80px rgba(0,0,0,0.9),
    0 0 0 1px rgba(255,255,255,0.05),
    inset 0 0 30px rgba(255,255,255,0.05);

  /* 🎮 ENTRY */
  transform: scale(0.85) translateY(30px);
  opacity: 0;
  animation: modalIn 0.25s ease forwards;

  /* FX */
  --glow: rgba(34,197,94,0.25);
  --shine: rgba(255,255,255,0.2);
}


/* =========================
✨ SHINE ANIMATION
========================= */

.player-modal::before {
  content: "";
  position: absolute;
  inset: 0;

  background: linear-gradient(
    120deg,
    transparent 20%,
    var(--shine) 50%,
    transparent 80%
  );

  opacity: 0.25;
  pointer-events: none;

  animation: shineMove 4s linear infinite;
}


/* =========================
🔥 GLOW BORDER
========================= */

.player-modal::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 22px;

  box-shadow:
    0 0 0 2px var(--glow),
    0 0 60px var(--glow);

  pointer-events: none;
}


/* =========================
🏆 TOP BAR
========================= */

.card-top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding-right: 28px; /* Platz für X */
}

.rating {
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 1px;
}

.stars-top img {
  height: 20px;
}


/* =========================
👤 PLAYER
========================= */

.card-player {
  display: flex;
  justify-content: center;
}

#player-avatar {
  width: 96px;
  height: 96px;

  image-rendering: pixelated;

  filter:
    drop-shadow(0 10px 20px rgba(0,0,0,0.8))
    contrast(1.1);
}


/* =========================
📛 NAME
========================= */

.card-name {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}


/* =========================
📊 STATS
========================= */

.card-stats {
  width: 100%;
}


/* =========================
❌ CLOSE BUTTON (FIXED)
========================= */

.close-btn {
  position: absolute;
  top: 6px;
  right: 6px;

  width: 26px;
  height: 26px;

  border-radius: 50%;
  border: none;

  background: rgba(0,0,0,0.6);
  color: white;

  font-size: 14px;
  font-weight: 600;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  z-index: 5;

  transition: 
    background 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255,255,255,0.3);
}


/* =========================
🎨 TIERS
========================= */

.player-modal[data-tier="common"] {
  --glow: rgba(107,114,128,0.4);
}

.player-modal[data-tier="rare"] {
  --glow: rgba(59,130,246,0.5);
}

.player-modal[data-tier="epic"] {
  --glow: rgba(139,92,246,0.6);
}

.player-modal[data-tier="legend"] {
  --glow: rgba(251,191,36,0.9);

  background:
    linear-gradient(160deg, #3b2f00, #1a1200),
    repeating-linear-gradient(
      135deg,
      rgba(255,215,0,0.08) 0px,
      rgba(255,215,0,0.08) 2px,
      transparent 2px,
      transparent 6px
    );
}


/* =========================
⭐ STAR BOOST
========================= */

.player-modal[data-stars="5"] {
  transform: scale(1.05);
}


/* =========================
🎬 ANIMATIONS
========================= */

@keyframes modalIn {
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes shineMove {
  from { transform: translateX(-120%); }
  to { transform: translateX(120%); }
}

// =========================
// 📦 EXPORTS
// =========================
function renderCurrentMatch(){
  console.log("⚽ renderCurrentMatch");
}

function renderSchedule(){
  console.log("📅 renderSchedule");
}

export {
  updateUI,
  renderSchedule,
  renderCurrentMatch
};
