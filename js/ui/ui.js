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
