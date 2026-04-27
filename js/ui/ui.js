console.log("UI LOADED");
// =======================
// 🖥 UI ENGINE (FULL + LIVE TABLE SAFE)
// =======================
import { game } from "../core/state.js";
import { buildCommentary } from "../engine/commentaryEngine.js";
import { track } from "../../tools/analytics.js";
import { renderLiveTable } from "../modules/table.js";
import { getPlayerTexture } from "../modules/playerGenerator/playerGenerator.js";
import { on } from "../core/events.js";
import { EVENTS } from "../core/events.constants.js";
import { renderSchedule as renderScheduleModule } from "../modules/scheduler.js";
import { getPlayersOfTeam } from "../modules/league.js";
import { mapPosition, mapPositionToRole, applyFormation, getBestXI } from "../core/football/position.js";
import { FORMATIONS, getFormationProfile } from "../core/football/formation.js";
import { openPlayerModal } from "../modal.js";
// =========================
// 🔒 INTERNAL
// =========================
let initialized = false;
let lastRenderedEventId = null;
let liveTableInterval = null;
let selectedPlayerId = null;
let lastTacticHash = null;

// =========================
// ⚙️ TACTICS PRESETS (GLOBAL)
// =========================
const PRESETS = {
  offensive: {
    tempo: "fast",
    pressing: "high",
    line: "high",
  },
  balanced: {
    tempo: "normal",
    pressing: "medium",
    line: "medium",
  },
  defensive: {
    tempo: "slow",
    pressing: "low",
    line: "low",
  },
};
// =========================
// 🧠 TACTICS DEFAULTS (SAFE)
// =========================
if (!game.tactics) {
  game.tactics = {};
}

game.tactics.style = game.tactics.style || "Balanced";
// =========================
// 🎨 PLAY STYLES
// =========================
const STYLES = {
  balanced: {
    attack: 1.0,
    defense: 1.0,
    control: 1.0,
  },

  possession: {
    attack: 0.95,
    defense: 1.0,
    control: 1.2,
  },

  counter: {
    attack: 1.25,
    defense: 0.95,
    control: 0.8,
  },

  wings: {
    attack: 1.15,
    defense: 1.0,
    control: 0.95,
  },

  longball: {
    attack: 1.2,
    defense: 0.95,
    control: 0.7,
  }
};

// =========================
// 📂 SIDEBAR APPLY
// =========================
let lastSidebarState = null;

function applySidebar() {
  if (game.ui.sidebarOpen === lastSidebarState) return;

  lastSidebarState = game.ui.sidebarOpen;

  const wrapper = document.getElementById("sidebarWrapper");
  if (!wrapper) return;

  wrapper.classList.toggle("open", game.ui.sidebarOpen);
}
// =========================
// 🍩 DONUT HELPER (GLOBAL)
// =========================
function setDonut(el, value) {
  const val = Math.max(0, Math.min(100, Math.round(value)));

  const current = parseFloat(el.style.getPropertyValue("--val")) || 0;

  // 👉 nur animieren wenn sich was ändert
  if (current === val) return;

  // 👉 smooth transition aktivieren
  el.style.transition = "none";
  el.style.setProperty("--val", current + "%");

  requestAnimationFrame(() => {
    el.style.transition = "all 0.6s ease";
    el.style.setProperty("--val", val + "%");
  });

  // 👉 Text
  const span = el.querySelector("span");
  if (span) span.textContent = val;
}
// =========================
// 🔄 GLOBAL UI UPDATE (FIX)
// =========================

function updateUI() {
  initUI();

  // =========================
  // 🎮 MATCH OVERLAY
  // =========================
  const matchOverlay = document.getElementById("matchOverlay");

  if (matchOverlay) {
    const isVisible = matchOverlay.classList.contains("show");

    matchOverlay.style.pointerEvents = isVisible ? "auto" : "none";

    if (game.match?.live?.running && !isVisible) {
      matchOverlay.classList.add("hidden");
    }
  }

  // =========================
  // 🧱 CORE UI
  // =========================
  applySidebar();
  updateScore();
  updateProgress();
  updateTacticsUI();
  if (game.ui.tacticsOpen) {
  renderFormationPreview();
  renderTacticStats();
}
  updateTabs();

  // =========================
  // 📐 FORMATION BUTTON SYNC (🔥 NEU)
  // =========================
  const currentFormation = game.tactics?.formation || "4-4-2";

  document.querySelectorAll("[data-formation]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.formation === currentFormation);
  });

  // =========================
  // 🔄 SELECT RESTORE
  // =========================
  const leagueSelect = document.getElementById("leagueSelect");
  const teamSelect = document.getElementById("teamSelect");

  if (leagueSelect && game.league?.selectedId) {
    leagueSelect.value = game.league.selectedId;
  }

  if (teamSelect && game.team?.selectedId) {
    teamSelect.value = game.team.selectedId;
  }

  // =========================
  // 📊 TABLE
  // =========================
  if (game.ui.tab === "table") {
    renderLiveTable();

    if (game.match?.live?.running) {
      ensureLiveTableLoop();
    }
  }

  // =========================
  // 👥 TEAM
  // =========================
  if (game.ui.tab === "team") {
    renderTeam();
  }

  // =========================
  // ⚙️ TACTICS
  // =========================
  if (game.ui.tacticsOpen && !game.match?.live?.running) {
    renderTacticStats();
  }

// =========================
// 🎮 OVERLAY CLOSE (TAP OUTSIDE FIX)
// =========================
const tacticsOverlay = document.getElementById("tacticsOverlay");

if (tacticsOverlay) {
  tacticsOverlay.addEventListener("click", (e) => {

    // 👉 nur backdrop klick
    if (e.target === tacticsOverlay) {
      game.ui.tacticsOpen = false;
      updateUI();
    }

  });
}

  // =========================
  // 🍔 SIDEBAR
  // =========================
  const burger = document.getElementById("burgerBtn");
  const wrapper = document.getElementById("sidebarWrapper");
  const overlay = document.getElementById("sidebarOverlay");

  if (burger && wrapper) {
    burger.onclick = () => {
      game.ui.sidebarOpen = !game.ui.sidebarOpen;
      applySidebar();
    };

    overlay?.addEventListener("click", () => {
      game.ui.sidebarOpen = false;
      applySidebar();
    });
  }

  // =========================
  // 🔥 STATE LISTENER
  // =========================
  on(EVENTS.STATE_CHANGED, () => {
    if (game.events?.history?.length) {
      updateEvents();
    }
  });

  // =========================
  // ⚙️ TACTICS BUTTON
  // =========================
  const tacticsBtn = document.getElementById("tacticsBtn");

  if (tacticsBtn) {
    tacticsBtn.onclick = () => {
      game.ui.tacticsOpen = !game.ui.tacticsOpen;
      updateUI();
    };
  }


  // =========================
  // 🎛 DROPDOWNS
  // =========================
  function setupDropdown(id, onSelect) {
    const el = document.getElementById(id);
    if (!el) return;

    const selected = el.querySelector(".dd-selected");
    const options = el.querySelector(".dd-options");

    if (!selected || !options) return;

    selected.onclick = () => {
      el.classList.toggle("open");
    };

    options.querySelectorAll("div").forEach((opt) => {
      opt.onclick = () => {
        const value = opt.dataset.value;

        selected.textContent = opt.textContent;
        el.classList.remove("open");

        onSelect(value);
      };
    });

    document.addEventListener("click", (e) => {
      if (!el.contains(e.target)) {
        el.classList.remove("open");
      }
    });
  }

  // 📐 FORMATION
  setupDropdown("formationDropdown", (value) => {
    game.tactics.formation = value;

    if (game.team?.lineup) {
      game.team.lineup.formation = value;
    }

    updateUI();
  });

  setupDropdown("presetDropdown", (value) => {
  if (!game.tactics) game.tactics = {};

  const config = PRESETS[value];

  if (!config) {
    console.warn("❌ unknown preset:", value);
    return;
  }

  // =========================
  // 🎯 PRESET SETZEN
  // =========================
  game.tactics.preset = value;

  // =========================
  // 🔥 WERTE ÜBERNEHMEN (RESET SAFE)
  // =========================
  game.tactics.tempo = config.tempo || "normal";
  game.tactics.pressing = config.pressing || "medium";
  game.tactics.line = config.line || "medium";

  // =========================
  // 🎨 STYLE RESET (optional aber sinnvoll)
  // =========================
  if (!game.tactics.style) {
    game.tactics.style = "balanced";
  }

  // =========================
  // 🧪 DEBUG
  // =========================
  console.log("⚙️ preset applied:", value, {
    tempo: game.tactics.tempo,
    pressing: game.tactics.pressing,
    line: game.tactics.line,
    style: game.tactics.style
  });

  // =========================
  // 🔄 UI UPDATE
  // =========================
  updateUI();
});

  // =========================
// 🎨 STYLE DROPDOWN
// =========================
setupDropdown("styleDropdown", (value) => {
  if (!STYLES[value]) return;

  game.tactics.style = value;

  updateUI();
});
  
  // =========================
  // 🎲 CHANCE BUTTON
  // =========================
  const chanceBtn = document.getElementById("chanceBtn");

  if (chanceBtn) {
    chanceBtn.onclick = () => {
      if (!game.match?.live?.running) {
        console.warn("⛔ kein laufendes Spiel");
        return;
      }

      game.events.history.push({
        id: Date.now(),
        minute: game.match.live.minute,
        type: "chance",
        text: "🔥 Große Chance durch taktische Umstellung!",
      });

      updateUI();
    };
  }
}


function initTacticsDrag() {
  const sheet = document.querySelector(".tactics-sheet");
  if (!sheet) return;
  if (sheet.dataset.dragInit) return;
sheet.dataset.dragInit = "1";
  let startY = 0;
  let currentY = 0;
  let startTranslate = 0;
  let dragging = false;
  let velocity = 0;
  let lastY = 0;
  let lastTime = 0;

  const getTranslate = () => {
    const style = window.getComputedStyle(sheet);
    const matrix = new DOMMatrix(style.transform);
    return matrix.m42;
  };

  const setTranslate = (y) => {
    sheet.style.transform = `translateY(${y}px)`;
  };

  const snapPoints = () => {
    const h = window.innerHeight;

    return [
      0,           // FULL
      h * 0.25,    // 75%
      h * 0.5,     // 50%
      h            // CLOSED
    ];
  };

  // =========================
// Snap to screen
// =========================
  
  const snapTo = (y) => {
    const points = snapPoints();

    let closest = points[0];
    let minDist = Infinity;

    points.forEach(p => {
      const dist = Math.abs(y - p);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    });

    sheet.classList.remove("dragging");
    sheet.style.transition = "transform 0.35s cubic-bezier(.2,.8,.2,1)";
    setTranslate(closest);

    // CLOSE LOGIC
    if (closest === window.innerHeight) {
      game.ui.tacticsOpen = false;
      updateUI();
    }
  };

  sheet.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    startTranslate = getTranslate();

    dragging = true;
    velocity = 0;

    lastY = startY;
    lastTime = Date.now();

    sheet.classList.add("dragging");
  });

  sheet.addEventListener("touchmove", (e) => {
    if (!dragging) return;

    currentY = e.touches[0].clientY;

    const delta = currentY - startY;
    let next = startTranslate + delta;

    // clamp
    next = Math.max(0, Math.min(window.innerHeight, next));

    setTranslate(next);

    // velocity calc
    const now = Date.now();
    const dy = currentY - lastY;
    const dt = now - lastTime;

    velocity = dy / (dt || 1);

    lastY = currentY;
    lastTime = now;
  });

  sheet.addEventListener("touchend", () => {
    dragging = false;

    let current = getTranslate();

    // 👉 momentum boost
    current += velocity * 120;

    snapTo(current);
  });
}


// =========================
// ⚽ SCORE
// =========================
function updateScore() {
  const match = game.match?.live;
  if (!match) return;

  const scoreEl = document.getElementById("topScore");
  const teamsEl = document.getElementById("topTeams");
  const minuteEl = document.getElementById("topMinute");
  const tacticsEl = document.getElementById("topTactics"); // 🔥 NEU (optional)

  // =========================
  // 🏷 TEAM NAMES
  // =========================
  if (teamsEl) {
    const current = game.match?.current;

    if (current) {
      const homeName = game.match?.home?.name || current?.home?.name || "-";

      const awayName = game.match?.away?.name || current?.away?.name || "-";

      teamsEl.textContent = `${homeName} vs ${awayName}`;
    }
  }

  // =========================
  // ⚽ SCORE + MINUTE
  // =========================
  if (scoreEl) {
    scoreEl.textContent = `${match.score?.home ?? 0} : ${match.score?.away ?? 0}`;
  }

  if (minuteEl) {
    minuteEl.textContent = `${match.minute ?? 0}'`;
  }

  // =========================
  // ⚙️ TACTICS (NEU, SAFE)
  // =========================
  if (tacticsEl && game.tactics) {
    const preset = game.tactics.preset || "balanced";

    tacticsEl.textContent =
      preset === "custom" ? "CUSTOM" : preset.toUpperCase();
  }
}

// =========================
// ⏱ PROGRESS
// =========================
function updateProgress() {
  const el = document.getElementById("progressFill");
  if (!el) return;

  const minute = game.match?.live?.minute || 0;
  const percent = Math.min((minute / 90) * 100, 100);

  el.style.width = percent + "%";
}

// =========================
// 📰 EVENTS
// =========================
function updateEvents() {
  const container = document.getElementById("liveFeed");
  if (!container) return;

  const events = game.events?.history;
  if (!events?.length) return;

  const newest = events[events.length - 1];

  if (!newest) return;

  console.log("🧪 EVENT DEBUG:", newest);

  // 🔥 doppelte Render verhindern
  if (newest.id === lastRenderedEventId) return;
  lastRenderedEventId = newest.id;

  track("game_event", {
    minute: newest.minute,
    text: newest.text || null,
  });

  // =========================
  // 🧠 TEXT
  // =========================
  let text = newest.text;

  if (!text) {
    try {
      text = buildCommentary(newest);
    } catch (e) {
      console.warn("⚠️ Commentary failed", e);
    }
  }

  if (!text) return;

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
  if (newest.assets?.length) {
    const asset = newest.assets[0];
    const url = asset?.url;

    if (url) {
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

export function showOverlay(imageUrl, text, duration = 2500) {
  const overlayEl = document.getElementById("matchOverlay");
  const overlayImg = document.getElementById("overlayImage");
  const overlayText = document.getElementById("overlayText");

  if (!overlayEl || !overlayImg || !overlayText) {
    console.warn("❌ Overlay DOM fehlt");
    return;
  }

  // 🔥 Timer cleanup (stabilisiert bei Spam)
  if (overlayTimeout) {
    clearTimeout(overlayTimeout);
    overlayTimeout = null;
  }

  if (overlayHideTimeout) {
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
  overlayTimeout = setTimeout(
    () => {
      overlayEl.classList.remove("show");

      overlayHideTimeout = setTimeout(() => {
        overlayEl.classList.add("hidden");
      }, 250);
    },
    Math.max(0, duration || 0),
  );
}

// =========================
// 📊 TABS
// =========================
function updateTabs() {
  const tabs = document.querySelectorAll(".tab");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    const name = tab.dataset.tab;
    if (!name) return;

    tab.classList.toggle("active", name === game.ui.tab);

    tab.onclick = () => {
      game.ui.tab = name;

      document.querySelectorAll(".tab-view").forEach((v) => {
        v.style.display = "none";
      });

      // 🔥 safe DOM access
      if (name === "table") {
        const el = document.getElementById("tableView");
        if (el) el.style.display = "block";
      }

      if (name === "schedule") {
        const el = document.getElementById("scheduleView");
        if (el) el.style.display = "block";
        renderSchedule();
      }

      if (name === "team") {
        const el = document.getElementById("teamView");
        if (el) el.style.display = "block";
      }

      updateUI();
    };
  });
}

// =========================
// ⚙️ TACTICS UI SYNC
// =========================
function updateTacticsUI() {
  if (!game.tactics) return;

  // =========================
  // 📐 FORMATION DROPDOWN
  // =========================
  const formationDD = document.getElementById("formationDropdown");
  if (formationDD) {
    const selected = formationDD.querySelector(".dd-selected");
    if (selected) {
      selected.textContent = game.tactics.formation || "4-4-2";
    }
  }

  // =========================
  // ⚙️ PRESET DROPDOWN
  // =========================
  const presetDD = document.getElementById("presetDropdown");
  if (presetDD) {
    const selected = presetDD.querySelector(".dd-selected");
    if (selected) {
      selected.textContent = game.tactics.preset || "balanced";
    }
  }

  // =========================
  // 🎨 STYLE DROPDOWN (NEU)
  // =========================
  const styleDD = document.getElementById("styleDropdown");
  if (styleDD) {
    const selected = styleDD.querySelector(".dd-selected");

    if (selected) {
      const style = game.tactics.style || "balanced";

      // 🔥 nicer labels
      const labels = {
        possession: "Ballbesitz",
        counter: "Konter",
        longball: "Lange Bälle",
        wings: "Flügelspiel",
        balanced: "Ausgeglichen"
      };

      selected.textContent = labels[style] || style;
    }
  }
}

// =========================
// 🔥 LIVE TABLE LOOP
// =========================
function ensureLiveTableLoop() {
  if (liveTableInterval) return;

  liveTableInterval = setInterval(() => {
    // 🔥 extra guard
    if (game.ui?.tab !== "table") return;

    renderLiveTable();
  }, 1000);
}


// =========================
// 🧠 ROLE PICKER
// =========================
function pickPlayer(role, byType) {
  if (!byType) return null;

  if (byType[role]?.length) {
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

function groupPlayers(players) {
  const groups = {
    ST: [],
    MID: [],
    DEF: [],
    GK: [],
  };

  if (!players?.length) return groups;

  players.forEach((p) => {
    const type = p.role || mapPositionToRole(p.position_type);

    // 🔥 FIX: ATT → ST mappen
    if (type === "ST" || type === "ATT") groups.ST.push(p);
    else if (type === "MID") groups.MID.push(p);
    else if (type === "DEF") groups.DEF.push(p);
    else if (type === "GK") groups.GK.push(p);
    else groups.MID.push(p);
  });

  return groups;
}

function renderPlayerRow(p) {
  const rawName = p.name || `${p.first_name || ""} ${p.last_name || ""}`;
  const name = rawName.toUpperCase();

  const POS_MAP = {
    GK: "TW",
    DEF: "IV",
    MID: "ZM",
    ST: "ST",
  };

  const rawPos = (p.position_type || "MID").toUpperCase();
  const pos = POS_MAP[rawPos] || rawPos;

  const rating = p.overall ?? 0;

  let ratingClass = "low";
  if (rating >= 85) ratingClass = "high";
  else if (rating >= 70) ratingClass = "mid";

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

function calculateTeamStats() {
  const lineup = game.team?.lineup;
  const teamId = game.team?.selectedId || game.team?.id;

  if (!teamId) {
    console.warn("❌ Kein teamId");
    return null;
  }

  // =========================
  // 🔥 TEAM + SPIELER LADEN
  // =========================
  const team = game.league?.current?.teams?.find(
    (t) => String(t.id) === String(teamId),
  );

  const allPlayers = team?.players || [];

  if (!allPlayers.length) {
    console.warn("❌ Keine Spieler gefunden für Team:", teamId);
    return {
      attack: 0,
      defense: 0,
      control: 0,
    };
  }

  // =========================
  // 🔥 LINEUP → AKTIVE SPIELER
  // =========================
  let players = [];

  if (lineup?.slots) {
    const ids = Object.values(lineup.slots).filter(Boolean);

    if (ids.length) {
      players = allPlayers.filter((p) => ids.includes(String(p.id)));
    }
  }

  // 🔄 FALLBACK
  if (!players.length) {
    players = allPlayers;
  }

  // =========================
  // 🧠 STATS BERECHNUNG
  // =========================
  let attack = 0;
let defense = 0;
let control = 0;

players.forEach((p) => {
  const rating = p.overall ?? 50;
  const type = mapPosition(p.position_type);

  if (type === "ATT") {
    attack += rating * 1.2;
    control += rating * 0.3;
  }

  else if (type === "MID") {
    attack += rating * 0.6;
    control += rating * 1.0;
  }

  else if (type === "DEF") {
    defense += rating * 1.1;
    control += rating * 0.4;
  }

  else if (type === "GK") {
    defense += rating * 1.4;
    control += rating * 0.2;
  }
});

  const formation = game.tactics?.formation || "4-4-2";
const profile = getFormationProfile(formation);

if (profile) {
  const total = profile.DEF + profile.MID + profile.ATT;

  if (total > 0) {
    const defRatio = profile.DEF / total;
    const midRatio = profile.MID / total;
    const attRatio = profile.ATT / total;

    attack *= 0.8 + attRatio * 0.6;
    defense *= 0.8 + defRatio * 0.6;
    control *= 0.8 + midRatio * 0.6;
  }
}

  // =========================
  // 📊 NORMALIZE
  // =========================
  const count = players.length || 1;

  const clamp = (v) => Math.max(0, Math.min(150, Math.round(v)));

  const result = {
    attack: clamp(attack / count),
    defense: clamp(defense / count),
    control: clamp(control / count),
  };

  console.log("📊 TeamStats:", result);

  return result;
}

function renderTeam() {
  const container = document.getElementById("teamView");
  if (!container) return;

  if (!game.team?.selectedId) {
    container.innerHTML = "<p>Kein Team gewählt</p>";
    return;
  }

  const teamId = game.team?.selectedId;
  const players = getPlayersOfTeam(teamId);
  const lineup = game.team?.lineup;

  if (!players.length) {
    container.innerHTML = "<p>Keine Spieler vorhanden</p>";
    return;
  }

  // =========================
  // 📐 FORMATION (EINMAL!)
  // =========================
  const formation =
    game.tactics?.formation ||
    lineup?.formation ||
    "4-4-2";

  let starters = [];
  let benchPlayers = [];

  // =========================
  // 🧠 AUTO BEST XI
  // =========================
  try {
    starters = getBestXI(players, formation);
  } catch (e) {
    console.error("❌ getBestXI failed:", e);
    starters = players.slice(0, 11);
  }

  // =========================
  // 🪑 BENCH CLEAN
  // =========================
  const starterIds = new Set(
    starters
      .filter(p => p?.id)
      .map(p => String(p.id))
  );

  benchPlayers = players.filter(
    p => !starterIds.has(String(p.id))
  );

  // =========================
  // 🧪 DEBUG
  // =========================
  console.log("🧪 teamId:", teamId);
  console.log("🧪 team players:", players.length);
  console.log("🧪 starters:", starters.length);
  console.log("🧪 bench:", benchPlayers.length);

  // =========================
  // 🧱 HTML BUILD
  // =========================
  let html = "";

  // =========================
  // 🧠 GROUPED STARTERS
  // =========================
  const starterGroups = groupPlayers(starters);

  function renderGroup(title, list) {
    if (!list.length) return "";

    return `
    <div class="position-group">
      <div class="group-title">${title}</div>
      ${list.map((p) => renderPlayerRow(p)).join("")}
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

  // 🔥 QUICK FIX: verhindert unnötiges Re-Rendern (Flicker Kill)
  if (container.dataset.renderHash === html) {
    return;
  }
  container.dataset.renderHash = html;

  container.innerHTML = html;

// =========================
// 🍩 TEAM STATS DONUTS (FIX)
// =========================
const stats = calculateTeamStats();

const donuts = container.querySelectorAll(".donut");

if (stats && donuts.length) {
  const values = [stats.attack, stats.defense, stats.control];

  donuts.forEach((d, i) => {
    setDonut(d, values[i] ?? 0);
  });
}

// =========================
// 🖱️ CLICK HANDLER
// =========================
document.querySelectorAll(".player-row").forEach((el) => {
  el.onclick = () => {
    const id = el.dataset.id;
    if (!id) return;

    if (selectedPlayerId === id) {
      selectedPlayerId = null;
      el.classList.remove("selected");
      return;
    }

    if (!selectedPlayerId) {
      document
        .querySelectorAll(".player-row")
        .forEach((el) => el.classList.remove("selected"));

      selectedPlayerId = id;
      el.classList.add("selected");
      return;
    }

    const lineup = game.team?.lineup;

    if (lineup?.slots) {
      const slots = lineup.slots;

      let slotA = null;
      let slotB = null;

      Object.entries(slots).forEach(([key, value]) => {
        if (String(value) === String(selectedPlayerId)) slotA = key;
        if (String(value) === String(id)) slotB = key;
      });

      const getType = (pid) => {
        const p = players.find((pl) => String(pl.id) === String(pid));
        return (p?.position_type || "MID").toUpperCase();
      };

      const getSlotType = (slot) => slot.split("_")[0];

      const typeA = getType(selectedPlayerId);
      const typeB = getType(id);

      if (slotA && slotB) {
        if (getSlotType(slotA) === typeB && getSlotType(slotB) === typeA) {
          const temp = slots[slotA];
          slots[slotA] = slots[slotB];
          slots[slotB] = temp;
        } else return;
      }

      else if (slotA && !slotB) {
        if (typeB === getSlotType(slotA)) {
          slots[slotA] = id;
        } else return;
      }

      else if (!slotA && slotB) {
        if (typeA === getSlotType(slotB)) {
          slots[slotB] = selectedPlayerId;
        } else return;
      }
    }

    selectedPlayerId = null;
    renderTeam();
    renderTacticStats();
  };
});

  // =========================
  // 🔵 PLAYER DOT
  // =========================
  function renderPlayerDot(player) {
    if (!player) return "";

    const initials =
      (player.first_name?.[0] || "") + (player.last_name?.[0] || "");

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
  function renderStat(label, value) {
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
}

function renderTacticStats() {
  const el = document.getElementById("tacticsStats");
  const barsEl = document.getElementById("tacticsBars");

  // =========================
  // 🛑 HARD GUARD (CRASH FIX)
  // =========================
  if (!el || !barsEl) {
    console.warn("⚠️ tactics DOM missing");
    return;
  }

  // 👉 nur rendern wenn Overlay offen
  if (!game.ui?.tacticsOpen) return;

  const base = calculateTeamStats();

  if (!base) {
    el.innerHTML = "<p style='opacity:0.6'>Keine Teamdaten</p>";
    barsEl.innerHTML = "";
    return;
  }

  const t = game.tactics || {};

  let attack = base.attack;
  let defense = base.defense;
  let control = base.control;

  // =========================
  // ⚙️ TACTICS APPLY
  // =========================
  if (t.tempo === "fast") {
    attack *= 1.2;
    control *= 0.9;
  }

  if (t.tempo === "slow") {
    defense *= 1.15;
    attack *= 0.9;
  }

  if (t.pressing === "high") {
    attack *= 1.15;
    defense *= 0.9;
  }

  if (t.pressing === "low") {
    defense *= 1.2;
    attack *= 0.9;
  }

  if (t.line === "high") {
    attack *= 1.1;
    defense *= 0.85;
  }

  if (t.line === "low") {
    defense *= 1.2;
    attack *= 0.95;
  }

  // =========================
  // 📊 NORMALIZE
  // =========================
  const clamp = (v) => Math.max(0, Math.min(150, Math.round(v)));

  attack = clamp(attack);
  defense = clamp(defense);
  control = clamp(control);

  const normalize = (v) => Math.max(0, Math.min(100, Math.round(v)));

  const attackVal = normalize(attack);
  const defenseVal = normalize(defense);
  const controlVal = normalize(control);

  // =========================
  // 🔁 HASH (optional)
  // =========================
  const dataHash = `${attackVal}-${defenseVal}-${controlVal}-${t.preset}-${t.tempo}-${t.pressing}-${t.line}`;

  if (dataHash === lastTacticHash) return;
  lastTacticHash = dataHash;

  // =========================
  // 🍩 DONUTS (NO WRAPPER BUG)
  // =========================
  el.innerHTML = `
    <div class="stat attack">
      <div class="donut" style="--val:0%">
        <span>${attackVal}</span>
      </div>
      <div class="label">ATT</div>
    </div>

    <div class="stat defense">
      <div class="donut" style="--val:0%">
        <span>${defenseVal}</span>
      </div>
      <div class="label">DEF</div>
    </div>

    <div class="stat control">
      <div class="donut" style="--val:0%">
        <span>${controlVal}</span>
      </div>
      <div class="label">CTRL</div>
    </div>
  `;

  // =========================
  // 📊 BARS (SYNC FIX)
  // =========================
  barsEl.innerHTML = `
    <div class="tactics-bar">
      <span>ATT</span>
      <div class="bar">
        <div class="fill att" style="width:${attackVal}%"></div>
      </div>
    </div>

    <div class="tactics-bar">
      <span>DEF</span>
      <div class="bar">
        <div class="fill def" style="width:${defenseVal}%"></div>
      </div>
    </div>

    <div class="tactics-bar">
      <span>CTRL</span>
      <div class="bar">
        <div class="fill ctrl" style="width:${controlVal}%"></div>
      </div>
    </div>
  `;

  // =========================
  // 🎬 DONUT ANIMATION (SAFE)
  // =========================
  requestAnimationFrame(() => {
    const donuts = el.querySelectorAll(".donut");

    if (donuts.length < 3) {
      console.warn("⚠️ donut render failed");
      return;
    }

    [attackVal, defenseVal, controlVal].forEach((v, i) => {
      setDonut(donuts[i], v);
    });
  });
}

function renderTacticBar(label, value) {
  return `
    <div class="tactic-row">
      <div class="tactic-label">${label} (${value})</div>
      <div class="tactic-bar">
        <div class="tactic-fill" style="width:${value}%"></div>
      </div>
    </div>
  `;
}
function renderFormationPreview() {
  const el = document.getElementById("formationPreview");
  if (!el) return;

  const formation = game.tactics?.formation || "4-4-2";
  const layout = FORMATIONS[formation];
  if (!layout) return;

  // =========================
  // 🧠 TEAM SAFE RESOLVE
  // =========================
  let players = [];

  if (Array.isArray(game.team)) {
    players = game.team;
  } else if (Array.isArray(game.team?.players)) {
    players = game.team.players;
  } else if (Array.isArray(game.players)) {
    players = game.players;
  }

  if (!players.length) {
    console.warn("⚠️ no players found for formation preview");
    return;
  }

  // =========================
  // ⚙️ BEST XI (SYNC MIT TEAM)
  // =========================
  let assigned = [];

  try {
    assigned = getBestXI(players, formation);
  } catch (e) {
    console.error("❌ getBestXI failed in preview:", e);
    assigned = players;
  }

  // =========================
  // 📦 GROUP BY ROLE
  // =========================
  const groups = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  };

  assigned.forEach(p => {
    if (groups[p.role]) {
      groups[p.role].push(p);
    }
  });

  const index = {
    GK: 0,
    DEF: 0,
    MID: 0,
    ATT: 0
  };

  // =========================
  // 🎯 RENDER DOTS
  // =========================
  el.innerHTML = layout
    .map((p) => {
      const player = groups[p.role]?.[index[p.role]++] || null;

      return `
        <div 
          class="fp-dot ${p.role}"
          data-id="${player?.id || ""}"
          style="
            top:${p.top};
            left:${p.left};
          "
        ></div>
      `;
    })
    .join("");

  // =========================
  // 🖱 CLICK HANDLER
  // =========================
  attachDotHandlers(players);
}


function attachDotHandlers(players) {
  document.querySelectorAll(".fp-dot").forEach((dot) => {
    dot.onclick = () => {
      const id = dot.dataset.id;
      if (!id) return;

      const player = players.find(
        (p) => String(p.id) === String(id)
      );

      if (!player) return;

      openPlayerModal(player);
    };
  });
}
// =========================
// 🚀 INITIAL UI RENDER (FIX)
// =========================
requestAnimationFrame(() => {
  console.log("🚀 initial UI render");
  updateUI();
});

// =========================
// 📦 EXPORTS
// =========================
function renderCurrentMatch() {
  console.log("⚽ renderCurrentMatch");
}

function renderSchedule() {
  renderScheduleModule();
}

export { updateUI, renderSchedule, renderCurrentMatch };
