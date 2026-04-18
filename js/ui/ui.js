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
import { openPlayerModal } from "../modal.js";

import { FORMATIONS } from "../core/football/formation.js";
import { mapPositionToRole } from "../core/football/position.js";
function mapRoleForUI(role){
  if(role === "ATT") return "ST";
  return role;
}
// =========================
// 🔒 INTERNAL
// =========================
let initialized = false;
let lastRenderedEventId = null;
let liveTableInterval = null;
let scheduleViewIndex = null;
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
// 📅 SCHEDULE
// =========================
if(game.ui.tab === "schedule"){
  renderSchedule();
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
// 🧠 ROLE PICKER
// =========================

function pickPlayer(role, byType){

  if(!byType) return null;

  // =========================
  // 🎯 1. PRIMARY ROLE
  // =========================
  if(byType[role]?.length){
    return byType[role].shift();
  }

  // =========================
  // 🔄 2. SMART FALLBACKS
  // =========================
  const fallbackMap = {
    GK: [],

    DEF: ["MID"],

    MID: ["DEF", "ST"],

    ST: ["MID"]
  };

  const fallbacks = fallbackMap[role] || [];

  for(const fb of fallbacks){
    if(byType[fb]?.length){
      return byType[fb].shift();
    }
  }

  // =========================
  // 🆘 3. LAST RESORT
  // =========================
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
function renderTeam(){

  const container = document.getElementById("teamView");
  if(!container) return;

  const teamId = game.team?.selectedId;

  const pool =
    (window.playerPool && window.playerPool.length)
      ? window.playerPool
      : (game.players || []);

  const players = pool.filter(p =>
    String(p.team_id) === String(teamId)
  );

  if(!players.length){
    container.innerHTML = "<p>Keine Spieler vorhanden</p>";
    return;
  }


  
  // =========================
  // 🧠 SORT + GROUP
  // =========================
  const byType = { GK: [], DEF: [], MID: [], ST: [] };

  // =========================
  // 🧠 GROUP BY ROLE (CLEAN)
  // =========================
  players.forEach(p => {

    const role = mapPositionToRole(p.position_type);

    if(!byType[role]){
      console.warn("⚠️ Unknown role:", role, p);
      return;
    }

    byType[role].push(p);
  });

  // =========================
  // 🔥 SORT (BEST FIRST)
  // =========================
  Object.values(byType).forEach(arr => {
    if(!Array.isArray(arr)) return;
    arr.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  });

  // =========================
  // ⚙️ FORMATION
  // =========================
  const formation = game.team?.formation || "4-4-2";
  const layout = FORMATIONS[formation] || FORMATIONS["4-4-2"];

  // 👉 copy pools (wichtig!)
  const poolCopy = {
    GK: [...byType.GK],
    DEF: [...byType.DEF],
    MID: [...byType.MID],
    ST: [...byType.ST]
  };

  // =========================
  // 🧠 SLOT → ROLE MAPPING (CLEAN)
  // =========================
  function normalizeSlotRole(roleRaw){

    const role = (roleRaw || "").toUpperCase();

    if(["CB","LB","RB","WB","RWB","LWB","DEF"].includes(role)) return "DEF";
    if(["CM","CDM","CAM","MID"].includes(role)) return "MID";
    if(["ST","CF","FW","LW","RW","ATT"].includes(role)) return "ST";
    if(role.includes("GK")) return "GK";

    return "MID"; // fallback
  }

  // =========================
  // 🧠 STARTING XI
  // =========================
  const starters = [];

  layout.forEach(slot => {

    const role = normalizeSlotRole(slot.role);

    const player = pickPlayer(role, poolCopy);

    if(player) starters.push(player);
  });

// =========================
// 🎨 RENDER FIELD
// =========================
let html = `
  <h3>Startelf (${formation})</h3>
  <div class="team-field">
`;

layout.forEach(slot => {

  const slotRole = normalizeSlotRole(slot.role);

  const player = starters.find(p =>
    !p._used && mapPositionToRole(p.position) === slotRole
  ) || starters.find(p => !p._used);

  if(!player) return;
  player._used = true;

  html += `
    <div class="player-pos" style="top:${slot.top}; left:${slot.left}">
      ${renderPlayerDot(player)}
    </div>
  `;
});

html += `</div>`;

// reset flags
starters.forEach(p => delete p._used);


// =========================
// 🪑 BENCH (NEU)
// =========================
html += `
  <h3>Bank</h3>
  <div class="bench-row">
`;

bench.forEach(p => {

  const stats = getPlayerStats(p);

  html += `
    <div class="bench-card" data-id="${p.id}">
      <div class="bench-name">${p.name}</div>
      <div class="bench-ovr">${p.overall}</div>

      <div class="bench-stats">
        <span>A ${stats.attack}</span>
        <span>D ${stats.defense}</span>
        <span>K ${stats.control}</span>
      </div>
    </div>
  `;
});

html += `</div>`;


// =========================
// 🧱 IN DOM
// =========================
container.innerHTML = html;


// =========================
// 🖱 CLICK SYSTEM
// =========================
container.querySelectorAll(".player-dot, .bench-card").forEach(el => {
  el.onclick = (e) => {
    e.stopPropagation();

    const id = el.dataset.id;
    if(!id) return;

    if(!selectedPlayerId){
      selectedPlayerId = id;
      highlightSelection(id);
      return;
    }

    if(selectedPlayerId === id){
      selectedPlayerId = null;
      clearSelection();
      return;
    }

    swapPlayers(selectedPlayerId, id);

    selectedPlayerId = null;
    clearSelection();

    renderTeam();
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

function swapPlayers(id1, id2){

  const lineup = game.team?.lineup;
  if(!lineup?.slots) return;

  let slotA = null;
  let slotB = null;

  // 👉 finde Slots
  for(const key in lineup.slots){
    if(lineup.slots[key] === id1) slotA = key;
    if(lineup.slots[key] === id2) slotB = key;
  }

  // 👉 beide im Feld → einfach tauschen
  if(slotA && slotB){
    [lineup.slots[slotA], lineup.slots[slotB]] =
    [lineup.slots[slotB], lineup.slots[slotA]];
    return;
  }

  // 👉 einer ist auf Bench
  if(slotA){
    lineup.slots[slotA] = id2;
    return;
  }

  if(slotB){
    lineup.slots[slotB] = id1;
    return;
  }
}

  function highlightSelection(id){
  document.querySelectorAll(".player-dot, .bench-card").forEach(el => {
    el.classList.toggle("selected", el.dataset.id === id);
  });
}

function clearSelection(){
  document.querySelectorAll(".selected").forEach(el => {
    el.classList.remove("selected");
  });
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

  // =========================
  // 🔥 DATENQUELLE
  // =========================
  const pool =
    (window.playerPool && window.playerPool.length)
      ? window.playerPool
      : (game.players || []);

  const allPlayers = pool.filter(p =>
    String(p.team_id) === String(teamId)
  );

  if(!allPlayers.length){
    console.warn("❌ Keine Spieler gefunden für Team:", teamId);
    return null;
  }

  // =========================
  // 🔥 LINEUP → STARTERS
  // =========================
  const lineup = game.team?.lineup;
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

// =========================
// 🧠 POSITION WEIGHTS
// =========================
const POSITION_WEIGHTS = {

  // 🧤 GK
  GK: { defense: 1.6 },

  // 🛡 DEFENSE
  CB: { defense: 1.4 },
  LB: { defense: 1.1, control: 0.3 },
  RB: { defense: 1.1, control: 0.3 },
  WB: { defense: 0.9, control: 0.5, attack: 0.3 },

  // 🧠 MIDFIELD
  CDM: { defense: 0.8, control: 1.2 },
  CM:  { control: 1.2, attack: 0.4 },
  CAM: { attack: 0.8, control: 1.0 },

  // ⚔️ ATTACK
  ST: { attack: 1.4 },
  CF: { attack: 1.2, control: 0.3 },
  FW: { attack: 1.3 }
};

// =========================
// 🔁 LOOP
// =========================
players.forEach(p => {

  const rating = p.overall ?? 50;

  const raw =
    (p.position_type ||
     p.position ||
     "MID")
    .toUpperCase();

  // 👉 passende Definition finden
  let weights = null;

  for(const key in POSITION_WEIGHTS){
    if(raw.includes(key)){
      weights = POSITION_WEIGHTS[key];
      break;
    }
  }

  // 👉 fallback
  if(!weights){
    weights = { control: 0.6 };
  }

  // 👉 apply
  attack  += rating * (weights.attack  || 0);
  defense += rating * (weights.defense || 0);
  control += rating * (weights.control || 0);

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

// =========================
// ⚙️ TACTIC MODIFIERS ENGINE
// =========================
function applyTactics(base){

  const t = game.tactics || {};

  let attack = base.attack;
  let defense = base.defense;
  let control = base.control;

  // =========================
  // 🎮 TEMPO
  // =========================
  if(t.tempo === "fast"){
    attack *= 1.2;
    control *= 0.85;
  }

  if(t.tempo === "slow"){
    defense *= 1.15;
    attack *= 0.9;
  }

  // =========================
  // 🔥 PRESSING
  // =========================
  if(t.pressing === "high"){
    attack *= 1.15;
    defense *= 0.85;
  }

  if(t.pressing === "low"){
    defense *= 1.25;
    attack *= 0.85;
  }

  // =========================
  // 📏 LINE HEIGHT
  // =========================
  if(t.line === "high"){
    attack *= 1.1;
    defense *= 0.8;
  }

  if(t.line === "low"){
    defense *= 1.3;
    attack *= 0.9;
  }

  // =========================
  // ⚖️ BALANCE NORMALIZATION
  // =========================
  const clamp = v => Math.max(0, Math.min(150, Math.round(v)));

  return {
    attack: clamp(attack),
    defense: clamp(defense),
    control: clamp(control)
  };
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

  // 🎮 TEMPO
  if(t.tempo === "fast"){
    attack *= 1.2;
    control *= 0.85;
  }

  if(t.tempo === "slow"){
    defense *= 1.15;
    attack *= 0.9;
  }

  // 🔥 PRESSING
  if(t.pressing === "high"){
    attack *= 1.15;
    defense *= 0.85;
  }

  if(t.pressing === "low"){
    defense *= 1.25;
    attack *= 0.85;
  }

  // 📏 LINE HEIGHT
  if(t.line === "high"){
    attack *= 1.1;
    defense *= 0.8;
  }

  if(t.line === "low"){
    defense *= 1.3;
    attack *= 0.9;
  }

  // =========================
  // 🔒 CLAMP + ROUND
  // =========================
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

// =========================
// 📦 EXPORTS
// =========================
function renderCurrentMatch(){
  console.log("⚽ renderCurrentMatch");
}

function renderSchedule(){

  const container = document.getElementById("scheduleView");
  if(!container) return;

  const schedule = game.league?.current?.schedule;
  if(!schedule?.length){
    container.innerHTML = "<p>Kein Spielplan vorhanden</p>";
    return;
  }

  if(scheduleViewIndex === null){
    scheduleViewIndex = game.league.currentRound || 0;
  }

  const round = schedule[scheduleViewIndex];
  if(!round) return;

  const myMatch = game.match?.current;

  const nav = `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:10px;
    ">
      <button id="prevRound">⬅</button>
      <strong>Spieltag ${scheduleViewIndex + 1}</strong>
      <button id="nextRound">➡</button>
    </div>
  `;

  const list = round.map((match, mIndex) => {

    const isActive =
      (myMatch && match.id === myMatch.id) ||
      (scheduleViewIndex === game.league.currentRound &&
       mIndex === game.league.currentMatchIndex);

    return `
      <div style="
        padding:8px;
        margin:4px 0;
        border-radius:6px;
        background:${isActive ? "#111" : "#0b0b0b"};
        color:${isActive ? "#00ff88" : "#ccc"};
        font-weight:${isActive ? "bold" : "normal"};
      ">
        ${match.home?.name || "-"}
        ${match.result ? match.result.home + ":" + match.result.away : "vs"}
        ${match.away?.name || "-"}
        ${match._processed ? " ✅" : ""}
      </div>
    `;
  }).join("");

  container.innerHTML = nav + list;

  // NAV
  document.getElementById("prevRound")?.addEventListener("click", () => {
    scheduleViewIndex = Math.max(0, scheduleViewIndex - 1);
    renderSchedule();
  });

  document.getElementById("nextRound")?.addEventListener("click", () => {
    scheduleViewIndex = Math.min(schedule.length - 1, scheduleViewIndex + 1);
    renderSchedule();
  });

  // SWIPE
  let startX = null;

  container.ontouchstart = (e) => {
    startX = e.touches[0].clientX;
  };

  container.ontouchend = (e) => {

    if(startX === null) return;

    const diff = startX - e.changedTouches[0].clientX;

    if(Math.abs(diff) < 50) return;

    if(diff > 0){
      scheduleViewIndex = Math.min(schedule.length - 1, scheduleViewIndex + 1);
    } else {
      scheduleViewIndex = Math.max(0, scheduleViewIndex - 1);
    }

    renderSchedule();
    startX = null;
  };
}

export {
  updateUI,
  renderSchedule,
  renderCurrentMatch
};
