// =========================
// 🖥 UI ENGINE (FULL + LIVE TABLE SAFE)
// =========================
import { game } from "../core/state.js";
import { buildCommentary } from "../engine/commentaryEngine.js";
import { track } from "../../tools/analytics.js";
import { renderLiveTable } from "../modules/table.js";
import { getPlayerTexture } from "../modules/playerGenerator/playerGenerator.js";
import { on } from "../core/events.js";
import { EVENTS } from "../core/events.constants.js";
import { renderSchedule as renderScheduleModule } from "../modules/scheduler.js";
import { getPlayersOfTeam } from "../modules/league.js";
// =========================
// 🔒 INTERNAL
// =========================
let initialized = false;
let lastRenderedEventId = null;
let liveTableInterval = null;
let selectedPlayerId = null;

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
// 🔄 GLOBAL UI UPDATE (FIX)
// =========================

function updateUI(){

  initUI();

  // 🔥 OVERLAY PRIORITY SYSTEM (FIX)
  const matchOverlay = document.getElementById("matchOverlay");

  if(matchOverlay){
    // 👉 wenn hidden → darf NIE blockieren
    if(matchOverlay.classList.contains("hidden")){
      matchOverlay.style.pointerEvents = "none";
    }

    // 👉 wenn sichtbar → nur dann klickbar
    if(matchOverlay.classList.contains("show")){
      matchOverlay.style.pointerEvents = "auto";
    }

    // 👉 safety: wenn match läuft und overlay NICHT aktiv → kill
    if(game.match?.live?.running && !matchOverlay.classList.contains("show")){
      matchOverlay.classList.add("hidden");
      matchOverlay.style.pointerEvents = "none";
    }
  }

  applySidebar();

  updateScore();
  updateProgress();

  updateTabs();

  // =========================
  // 📊 TABLE
  // =========================
  if(game.ui.tab === "table"){

    renderLiveTable();

    if(game.match?.live?.running){
      ensureLiveTableLoop();
    }
  }

  // =========================
  // 👥 TEAM
  // =========================
  if(game.ui.tab === "team"){
    renderTeam();
  }

  // =========================
  // ⚙️ TACTICS
  // =========================
  updateTacticsUI();

 // 🔥 AUTO CLOSE OVERLAY BEI MATCH START
if(game.match?.live?.running && game.ui.tacticsOpen){
  game.ui.tacticsOpen = false;
}

// 🔥 FIX: NUR WENN OVERLAY OFFEN
if(game.ui.tacticsOpen){
  renderTacticStats();
}

  // =========================
  // 🪟 OVERLAY
  // =========================
  const tacticsOverlay = document.getElementById("tacticsOverlay");

  if(tacticsOverlay){
    tacticsOverlay.classList.toggle("open", !!game.ui.tacticsOpen);
  }
}
 

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

  // 🔥 STATE LISTENER
  on(EVENTS.STATE_CHANGED, () => {
  if(game.events?.history?.length){
    updateEvents();
  }
});

  // =========================
  // ⚙️ TACTICS BUTTON (OPEN)
  // =========================
  const tacticsBtn = document.getElementById("tacticsBtn");

  if(tacticsBtn){
    tacticsBtn.onclick = () => {
      game.ui.tacticsOpen = !game.ui.tacticsOpen;

      console.log("⚙️ tactics toggled:", game.ui.tacticsOpen);

      updateUI();
    };
  }

  // =========================
  // 🎮 TACTICS OVERLAY CLOSE
  // =========================
  const tacticsOverlay = document.getElementById("tacticsOverlay");

  if(tacticsOverlay){
    tacticsOverlay.onclick = (e) => {
      if(e.target === tacticsOverlay){
        game.ui.tacticsOpen = false;
        updateUI();
      }
    };
  }

  // =========================
  // 🎮 TACTICS SYSTEM (PRESETS)
  // =========================

  // safety init
  game.tactics = game.tactics || {
    preset: "balanced",
    tempo: "normal",
    pressing: "medium",
    line: "medium"
  };

  const PRESETS = {
    offensive: {
      tempo: "fast",
      pressing: "high",
      line: "high"
    },
    balanced: {
      tempo: "normal",
      pressing: "medium",
      line: "medium"
    },
    defensive: {
      tempo: "slow",
      pressing: "low",
      line: "low"
    }
  };

  // =========================
  // 🎯 PRESET BUTTONS
  // =========================
  document.querySelectorAll("[data-preset]").forEach(btn => {

    btn.onclick = () => {

      const preset = btn.dataset.preset;
      if(!preset) return;

      const config = PRESETS[preset];
      if(!config) return;

      game.tactics.preset = preset;
      game.tactics.tempo = config.tempo;
      game.tactics.pressing = config.pressing;
      game.tactics.line = config.line;

      console.log("⚙️ preset applied:", preset, config);

      // UI highlight
      document.querySelectorAll("[data-preset]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      updateTacticsUI();
      renderTacticStats();
    };

  });

  // initial sync
  updateTacticsUI();
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
  const tacticsEl = document.getElementById("topTactics"); // 🔥 NEU (optional)

  // =========================
  // 🏷 TEAM NAMES
  // =========================
  if(teamsEl){

    const current = game.match?.current;

    if(current){

      const homeName =
  game.match?.home?.name ||
  current?.home?.name ||
  "-";

const awayName =
  game.match?.away?.name ||
  current?.away?.name ||
  "-";

      teamsEl.textContent = `${homeName} vs ${awayName}`;
    }
  }

  // =========================
  // ⚽ SCORE + MINUTE
  // =========================
  if(scoreEl){
    scoreEl.textContent = `${match.score?.home ?? 0} : ${match.score?.away ?? 0}`;
  }

  if(minuteEl){
    minuteEl.textContent = `${match.minute ?? 0}'`;
  }

  // =========================
  // ⚙️ TACTICS (NEU, SAFE)
  // =========================
  if(tacticsEl && game.tactics){

    const preset = game.tactics.preset || "balanced";

    tacticsEl.textContent =
      preset === "custom"
        ? "CUSTOM"
        : preset.toUpperCase();
  }
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
  if(!events?.length) return;

  const newest = events[events.length - 1];

  if(!newest) return;

  console.log("🧪 EVENT DEBUG:", newest);

  // 🔥 doppelte Render verhindern
  if(newest.id === lastRenderedEventId) return;
  lastRenderedEventId = newest.id;

  track("game_event", {
    minute: newest.minute,
    text: newest.text || null
  });

  // =========================
  // 🧠 TEXT
  // =========================
  let text = newest.text;

  if(!text){
    try {
      text = buildCommentary(newest);
    } catch(e){
      console.warn("⚠️ Commentary failed", e);
    }
  }

  if(!text) return;

  // =========================
  // 📰 FEED UPDATE
  // =========================
  const div = document.createElement("div");

  div.innerHTML = `
    <span style="color:#888">${newest.minute}'</span> 
    <span>${text}</span>
  `;

  container.appendChild(div);

  // =========================
  // 🎬 OVERLAY (optional)
  // =========================
  if(newest.assets?.length){

    const asset = newest.assets[0];
    const url = asset?.url;

    if(url){
      console.log("🎬 CALL OVERLAY:", url);
      showOverlay(url, text);
    }
  }
}

// =========================
// 🎮 OVERLAY TRIGGER
// =========================

let overlayTimeout = null;
let overlayHideTimeout = null;

export function showOverlay(imageUrl, text, duration = 2500){

  const overlayEl = document.getElementById("matchOverlay");
  const overlayImg = document.getElementById("overlayImage");
  const overlayText = document.getElementById("overlayText");

  if(!overlayEl || !overlayImg || !overlayText){
    console.warn("❌ Overlay DOM fehlt");
    return;
  }

  // 🔥 Timer cleanup (stabilisiert bei Spam)
  if(overlayTimeout){
    clearTimeout(overlayTimeout);
    overlayTimeout = null;
  }

  if(overlayHideTimeout){
    clearTimeout(overlayHideTimeout);
    overlayHideTimeout = null;
  }

  // 🔥 Content setzen
  overlayImg.src = imageUrl || "";
  overlayText.innerText = text || "";

  // 🔥 HARD RESET
  overlayEl.classList.remove("show");
  overlayEl.classList.remove("hidden");

  // 🔥 Reflow (safe)
  overlayEl.getBoundingClientRect();

  // 🔥 SHOW
  requestAnimationFrame(() => {
    overlayEl.classList.add("show");
  });

  // 🔥 AUTO HIDE (guarded)
  overlayTimeout = setTimeout(() => {

    overlayEl.classList.remove("show");

    overlayHideTimeout = setTimeout(() => {
      overlayEl.classList.add("hidden");
    }, 250);

  }, Math.max(0, duration || 0));
}

// =========================
// 📊 TABS
// =========================
function updateTabs(){

  const tabs = document.querySelectorAll(".tab");
  if(!tabs.length) return;

  tabs.forEach(tab => {

    const name = tab.dataset.tab;
    if(!name) return;

    tab.classList.toggle("active", name === game.ui.tab);

    tab.onclick = () => {

      game.ui.tab = name;

      document.querySelectorAll(".tab-view").forEach(v => {
        v.style.display = "none";
      });

      // 🔥 safe DOM access
      if(name === "table"){
  const el = document.getElementById("tableView");
  if(el) el.style.display = "block";
}

if(name === "schedule"){
  const el = document.getElementById("scheduleView");
  if(el) el.style.display = "block";
  renderSchedule(); 
}

if(name === "team"){
  const el = document.getElementById("teamView");
  if(el) el.style.display = "block";
}

      updateUI();
    };
  });
}

// =========================
// ⚙️ TACTICS UI SYNC
// =========================
function updateTacticsUI(){

  if(!game.tactics) return;

  document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.preset === game.tactics.preset);
  });

  document.querySelectorAll("[data-tempo]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tempo === game.tactics.tempo);
  });

  document.querySelectorAll("[data-pressing]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.pressing === game.tactics.pressing);
  });

  document.querySelectorAll("[data-line]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.line === game.tactics.line);
  });
}

// =========================
// 🔥 LIVE TABLE LOOP
// =========================
function ensureLiveTableLoop(){

  if(liveTableInterval) return;

  liveTableInterval = setInterval(() => {

    // 🔥 extra guard
    if(game.ui?.tab !== "table") return;

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

  if(!byType) return null;

  if(byType[role]?.length){
    return byType[role].shift();
  }

  return (
    byType.GK?.shift() ||
    byType.DEF?.shift() ||
    byType.MID?.shift() ||
    byType.ST?.shift() ||
    null
  );
}
// =========================
// ⚽ TEAM
// =========================

function groupPlayers(players){

  const groups = {
    ST: [],
    MID: [],
    DEF: [],
    GK: []
  };

  players.forEach(p => {
    const type = (p.position_type || "MID").toUpperCase();

    if(type.includes("ST")) groups.ST.push(p);
    else if(type.includes("MID")) groups.MID.push(p);
    else if(type.includes("DEF")) groups.DEF.push(p);
    else if(type.includes("GK")) groups.GK.push(p);
    else groups.MID.push(p);
  });

  return groups;
}


function renderPlayerRow(p){

  const rawName = p.name || `${p.first_name || ""} ${p.last_name || ""}`;
  const name = rawName.toUpperCase();

  const POS_MAP = {
    GK: "TW",
    DEF: "IV",
    MID: "ZM",
    ST: "ST"
  };

  const rawPos = (p.position_type || "MID").toUpperCase();
  const pos = POS_MAP[rawPos] || rawPos;

  const rating = p.overall ?? 0;

  let ratingClass = "low";
  if(rating >= 85) ratingClass = "high";
  else if(rating >= 70) ratingClass = "mid";

  let stars = Math.max(1, Math.min(5, p.stars || 1));
  const tier = (p.tier || "bronze").toLowerCase();

  return `
    <div class="player-row" data-id="${p.id}">
      <span class="pos">${pos}</span>

      <span class="name ${tier}">
        ${name}
        <span class="stars">${"★".repeat(stars)}</span>
      </span>

      <span class="rating ${ratingClass}">${rating}</span>
    </div>
  `;
}

function renderTeam(){

  const container = document.getElementById("teamView");
  if(!container) return;

if(!game.team?.selectedId){
  container.innerHTML = "<p>Kein Team gewählt</p>";
  return;
}
  
  const teamId = game.team?.selectedId;
  const players = getPlayersOfTeam(teamId);
  const lineup = game.team?.lineup;

let starters = [];
let benchPlayers = [...players];
  
// 🔥 Lineup vorhanden → echte Startelf
if(lineup?.slots){

  const ids = Object.values(lineup.slots).filter(Boolean);

  if(ids.length){
    starters = players.filter(p => ids.includes(String(p.id)));
    benchPlayers = players.filter(p => !ids.includes(String(p.id)));
  }
}

// 🔥 Fallback (dein bestehendes System bleibt)
if(!starters.length){
  starters = players.slice(0, 11);
  bench = players.slice(11);
}
  console.log("🧪 teamId:", teamId);
 console.log("🧪 team players:", players.length);
console.log("🧪 starters:", starters.length);
console.log("🧪 bench:", benchPlayers.length);
  if(!players.length){
    container.innerHTML = "<p>Keine Spieler vorhanden</p>";
    return;
  }

  const byType = { GK: [], DEF: [], MID: [], ST: [] };

  players.forEach(p => {
    const type = p.position_type || "MID";
    (byType[type] || byType.MID).push(p);
  });

  // Sortieren (safe)
  Object.values(byType).forEach(arr => {
    if(!Array.isArray(arr)) return;
    arr.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  });

  // =========================
  // 🔥 LINEUP INTEGRATION
  // =========================


  if(lineup?.slots){

    const pool = window.playerPool || players;

    const ids = Object.values(lineup.slots).filter(Boolean);

    if(ids.length){
      starters = pool.filter(p =>
        ids.includes(String(p.id))
      );
    }
  }

  // 👉 FALLBACK (dein bestehendes System bleibt!)
  if(!starters.length){
    starters = [
      ...byType.GK.slice(0,1),
      ...byType.DEF.slice(0,4),
      ...byType.MID.slice(0,4),
      ...byType.ST.slice(0,2)
    ];
  }

const bench = players;
  
  const formation = lineup?.formation || game.team?.formation || "4-4-2";
  const layout = FORMATIONS[formation] || FORMATIONS["4-4-2"];

  // 🔥 Mapping Slot → Player (wichtig!)
  const slotOrder = [
    "GK",
    "DEF_1","DEF_2","DEF_3","DEF_4",
    "MID_1","MID_2","MID_3","MID_4",
    "ST_1","ST_2"
  ];

  const positionPool = {
    GK: [...byType.GK],
    DEF: [...byType.DEF],
    MID: [...byType.MID],
    ST: [...byType.ST]
  };

  let html = "";

// =========================
// 🧱 TEAM RENDER (FINAL)
// =========================
const stats = calculateTeamStats();
html = `
  <div class="team-stats">

    <div class="stat attack">
      <div class="donut" style="--val:${stats?.attack || 0}">
        <span>${stats?.attack ?? "-"}</span>
      </div>
      <div class="label">ATT</div>
    </div>

    <div class="stat defense">
      <div class="donut" style="--val:${stats?.defense || 0}">
        <span>${stats?.defense ?? "-"}</span>
      </div>
      <div class="label">DEF</div>
    </div>

    <div class="stat control">
      <div class="donut" style="--val:${stats?.control || 0}">
        <span>${stats?.control ?? "-"}</span>
      </div>
      <div class="label">CTRL</div>
    </div>

  </div>
`;
// =========================
// 🧠 GROUPED STARTERS
// =========================
const starterGroups = groupPlayers(starters);

function renderGroup(title, list){
  if(!list.length) return "";

  return `
    <div class="position-group">
      <div class="group-title">${title}</div>
      ${list.map(p => renderPlayerRow(p)).join("")}
    </div>
  `;
}

html += `
  <h3>Startelf</h3>
  ${renderGroup("STURM", starterGroups.ST)}
  ${renderGroup("MITTELFELD", starterGroups.MID)}
  ${renderGroup("ABWEHR", starterGroups.DEF)}
  ${renderGroup("TOR", starterGroups.GK)}
`;

// =========================
// 🪑 BANK
// =========================
const benchGroups = groupPlayers(benchPlayers);

html += `
  <div class="divider">BANK</div>

  ${renderGroup("STURM", benchGroups.ST)}
  ${renderGroup("MITTELFELD", benchGroups.MID)}
  ${renderGroup("ABWEHR", benchGroups.DEF)}
  ${renderGroup("TOR", benchGroups.GK)}
`;
  
// =========================
// 📦 INSERT DOM
// =========================

html += `</div>`;
container.innerHTML = html;

// =========================
// 🖱️ CLICK HANDLER (Richtig platziert!)
// =========================

let selectedPlayerId = null;

document.querySelectorAll(".player-row").forEach(el => {

  el.onclick = () => {

    const id = el.dataset.id;
    if(!id) return;

    // =========================
    // 🔁 SAME CLICK → RESET
    // =========================
    if(selectedPlayerId === id){
      selectedPlayerId = null;
      el.classList.remove("selected");
      return;
    }

    // =========================
    // 🧠 FIRST CLICK
    // =========================
    if(!selectedPlayerId){

      document.querySelectorAll(".player-row")
        .forEach(el => el.classList.remove("selected"));

      selectedPlayerId = id;
      el.classList.add("selected");

      return;
    }

    // =========================
    // 🔁 SECOND CLICK → SWAP
    // =========================
    const lineup = game.team?.lineup;

    if(lineup?.slots){

      const slots = lineup.slots;

      let slotA = null;
      let slotB = null;

      Object.entries(slots).forEach(([key, value]) => {
        if(String(value) === String(selectedPlayerId)) slotA = key;
        if(String(value) === String(id)) slotB = key;
      });

      // 🔄 Starter ↔ Starter
      if(slotA && slotB){
        const temp = slots[slotA];
        slots[slotA] = slots[slotB];
        slots[slotB] = temp;
      }

      // 🔄 Starter → Bank
      if(slotA && !slotB){
        slots[slotA] = id;
      }

      // 🔄 Bank → Starter
      if(!slotA && slotB){
        slots[slotB] = selectedPlayerId;
      }
    }

    // 🔄 Reset + UI refresh
    selectedPlayerId = null;
    updateUI();
  };
});


// =========================
// 🔵 PLAYER DOT
// =========================
function renderPlayerDot(player){

  if(!player) return "";

  const initials =
    (player.first_name?.[0] || "") +
    (player.last_name?.[0] || "");

  return `
    <div class="player-dot" data-id="${player.id}" data-tier="${player.tier}">
      <img src="./gfx/dotred.webp" />
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

function calculateTeamStats(){

  // =========================
  // 🔥 TEAM ID
  // =========================
  const teamId =
    game.team?.selectedId ||
    game.team?.id;

  if(!teamId){
    console.warn("❌ Kein teamId");
    return null;
  }

// 🔥 ensure lineup exists
const slotCount = Object.keys(game.team?.lineup?.slots || {}).length;

if(!game.team.lineup || slotCount < 11){
  const byType = { GK: [], DEF: [], MID: [], ST: [] };

  players.forEach(p => {
    const type = (p.position_type || "MID").toUpperCase();
    (byType[type] || byType.MID).push(p);
  });

let startersDefault = [
  ...byType.GK.slice(0,1),
  ...byType.DEF.slice(0,4),
  ...byType.MID.slice(0,4),
  ...byType.ST.slice(0,2)
];

// 🔥 Fallback: auffüllen bis 11 Spieler
if(startersDefault.length < 11){

  const rest = players.filter(p => !startersDefault.includes(p));

  startersDefault.push(...rest.slice(0, 11 - startersDefault.length));
}

  const slotKeys = [
    "GK",
    "DEF_1","DEF_2","DEF_3","DEF_4",
    "MID_1","MID_2","MID_3","MID_4",
    "ST_1","ST_2"
  ];

  game.team.lineup = {
    formation: "4-4-2",
    slots: {}
  };

  startersDefault.forEach((p, i) => {
    const key = slotKeys[i];
    if(key && p){
      game.team.lineup.slots[key] = String(p.id);
    }
  });

  console.log("🧠 Lineup FIXED:", game.team.lineup);
}

  
  // =========================
  // 🔥 DATENQUELLE
  // =========================
const team = game.league?.current?.teams
  ?.find(t => String(t.id) === String(teamId));

const allPlayers = team?.players || [];

if(!allPlayers.length){
  console.warn("❌ Keine Spieler gefunden für Team:", teamId);

  return {
    attack: 0,
    defense: 0,
    control: 0
  };
}

  // =========================
  // 🔥 LINEUP → STARTERS
  // =========================

  let players = [];

  if(lineup?.slots){

    const ids = Object.values(lineup.slots).filter(Boolean);

    if(ids.length){
      players = allPlayers.filter(p =>
        ids.includes(String(p.id))
      );
    }
  }

  // =========================
  // 🔄 FALLBACK (alle Spieler)
  // =========================
  if(!players.length){
    players = allPlayers;
  }

  // =========================
  // 🧠 STATS BERECHNUNG
  // =========================
  let attack = 0;
  let defense = 0;
  let control = 0;

  players.forEach(p => {

    const rating = p.overall ?? 50;
    const type = (p.position_type || "MID").toUpperCase();

    // ⚔️ Attack
    if(type.includes("ST")){
      attack += rating * 1.2;
    }

    // 🧠 Midfield
    else if(type.includes("MID")){
      attack += rating * 0.6;
      control += rating * 1.0;
    }

    // 🛡 Defense
    else if(type.includes("DEF")){
      defense += rating * 1.2;
    }

    // 🧤 Goalkeeper
    else if(type.includes("GK")){
      defense += rating * 1.5;
    }

    // 🔄 Unknown fallback
    else{
      control += rating * 0.5;
    }

  });

  // =========================
  // 📊 NORMALIZE
  // =========================
  const count = players.length || 1;

  let result = {
    attack: Math.round(attack / count),
    defense: Math.round(defense / count),
    control: Math.round(control / count)
  };

  // =========================
  // 🔒 SAFETY CLAMP
  // =========================
  const clamp = v => Math.max(0, Math.min(150, v));

  result.attack = clamp(result.attack);
  result.defense = clamp(result.defense);
  result.control = clamp(result.control);

  // =========================
  // 🧪 DEBUG (optional)
  // =========================
  console.log("📊 TeamStats:", result);

  return result;
}

function renderTacticStats(){

  const el = document.getElementById("tacticsStats");
  if(!el) return;

  const base = calculateTeamStats();

if(!base){
  el.innerHTML = "<p style='opacity:0.6'>Keine Teamdaten</p>";
  return;
}

  const t = game.tactics || {};

  let attack = base.attack;
  let defense = base.defense;
  let control = base.control;

  // =========================
  // ⚙️ TACTICS APPLY
  // =========================

  if(t.tempo === "fast"){
    attack *= 1.2;
    control *= 0.9;
  }

  if(t.tempo === "slow"){
    defense *= 1.15;
    attack *= 0.9;
  }

  if(t.pressing === "high"){
    attack *= 1.15;
    defense *= 0.9;
  }

  if(t.pressing === "low"){
    defense *= 1.2;
    attack *= 0.9;
  }

  if(t.line === "high"){
    attack *= 1.1;
    defense *= 0.85;
  }

  if(t.line === "low"){
    defense *= 1.2;
    attack *= 0.95;
  }

  // Clamp
  const clamp = v => Math.max(0, Math.min(150, Math.round(v)));

  attack = clamp(attack);
  defense = clamp(defense);
  control = clamp(control);

  // =========================
  // 🎨 RENDER
  // =========================
  el.innerHTML = `
    ${renderTacticBar("Attack", attack)}
    ${renderTacticBar("Defense", defense)}
    ${renderTacticBar("Control", control)}
  `;
}

function renderTacticBar(label, value){

  return `
    <div class="tactic-row">
      <div class="tactic-label">${label} (${value})</div>
      <div class="tactic-bar">
        <div class="tactic-fill" style="width:${value}%"></div>
      </div>
    </div>
  `;
}
}
// =========================
// 📦 EXPORTS
// =========================
function renderCurrentMatch(){
  console.log("⚽ renderCurrentMatch");
}

function renderSchedule(){
  renderScheduleModule();
}

export {
  updateUI,
  renderSchedule,
  renderCurrentMatch
};
