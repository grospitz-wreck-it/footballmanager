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
import {
  mapPosition,
  mapPositionToRole,
  applyFormation,
  getBestXI,
} from "../core/football/position.js";
import { FORMATIONS, getFormationProfile } from "../core/football/formation.js";
import { openPlayerModal } from "../modal.js";
import {
  isPlayerAvailable,
  isPlayerSuspended,
  isPlayerInjured,
} from "../modules/playerAvailability.js";
// =========================
// 🔒 INTERNAL
// =========================
let initialized = false;
let lastRenderedEventId = null;
let liveTableInterval = null;
let selectedPlayerId = null;
let lastTacticHash = null;

// =========================
// 🖱 Color Picker
// =========================
function initColorPicker() {
  const picker = document.getElementById("colorPicker");
  if (!picker) return;

  const saved = localStorage.getItem("userColor");

  if (saved) {
    picker.value = saved;
    applyColor(saved);
  } else {
    applyColor(picker.value);
  }

  picker.addEventListener("input", (e) => {
    const color = e.target.value;

    applyColor(color);
    localStorage.setItem("userColor", color);

    if (typeof showToast === "function") {
      showToast("Farbe aktualisiert");
    }
  });
}

// =========================
// 🎨 COLOR HELPERS (SAFE)
// =========================

// HEX → RGBA
function hexToRgba(hex, alpha = 1) {
  if (!hex || hex.length < 7) return `rgba(255,255,255,${alpha})`;

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// HEX → HSL
function hexToHsl(hex) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;

    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// HSL → HEX
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);

  const f = (n) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))),
    );

  return `#${[f(0), f(8), f(4)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function applyColor(color) {
  const opp = getComplementaryColor(color);

  // 👉 Hauptfarbe
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty(
    "--accent-soft",
    hexToRgba(color, 0.2),
  );
  document.documentElement.style.setProperty(
    "--accent-glow",
    hexToRgba(color, 0.5),
  );

  // 👉 Gegnerfarbe (SMART complement)
  document.documentElement.style.setProperty("--accent-opp", opp);
  document.documentElement.style.setProperty(
    "--accent-opp-glow",
    hexToRgba(opp, 0.45),
  );
}

// =========================
// 🎨 SMART COMPLEMENT COLOR
// =========================

function getComplementaryColor(hex) {
  const { h, s, l } = hexToHsl(hex);

  // 🔥 nicht 180°, sondern softer shift
  let newHue = (h + 150) % 360;

  // leichte Anpassung für UI Harmonie
  const newSat = Math.min(100, s * 0.9);
  const newLight = Math.min(85, l * 1.05);

  return hslToHex(newHue, newSat, newLight);
}

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
  },
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

function showGameOverScreen() {
  let overlay = document.getElementById("gameOverOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "gameOverOverlay";

    overlay.innerHTML = `
      <div class="gameover-card">
        <h1>💀 GAME OVER</h1>
        <p>Abstieg aus der Kreisliga A.</p>
        <p>Deine Trainerkarriere ist beendet.</p>
        <button id="restartCareerBtn">Neue Karriere starten</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn =
      overlay.querySelector(
        "#restartCareerBtn",
      );

    if (btn) {
      btn.onclick = () => {
        location.reload();
      };
    }
  }

  overlay.style.display = "flex";
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
// 🎨 INIT COLOR PICKER (FIX)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  initColorPicker();
});
// =========================
// 🔄 GLOBAL UI UPDATE (FIX)
// =========================

function updateUI() {
  initUI();
// =========================
  // 💀 GAME OVER
  // =========================
  if (game.phase === "gameover") {
    showGameOverScreen();
    return;
  }
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
  // 🪟 TACTICS OVERLAY
  // =========================
  const tacticsOverlay = document.getElementById("tacticsOverlay");

  if (tacticsOverlay) {
    tacticsOverlay.classList.toggle("open", !!game.ui.tacticsOpen);
  }
}

function initUI() {
  if (initialized) return;
  initialized = true;

  console.log("🧱 UI init");

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
  // 🎮 OVERLAY CLOSE
  // =========================
  const tacticsOverlay = document.getElementById("tacticsOverlay");

  if (tacticsOverlay) {
    tacticsOverlay.onclick = (e) => {
      if (e.target === tacticsOverlay) {
        game.ui.tacticsOpen = false;
        updateUI();
      }
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
      style: game.tactics.style,
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
      // ❌ kein laufendes Spiel
      if (!game.match?.live?.running) {
        showToast("⚠️ Erst im laufenden Spiel aktiv");
        return;
      }

      // ✅ normales Verhalten
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

function showToast(text) {
  // ❌ wenn Splash sichtbar → abbrechen
  const splash = document.getElementById("splashScreen");
  if (splash && !splash.classList.contains("hidden")) return;

  let el = document.getElementById("toast");

  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }

  el.textContent = text;
  el.classList.add("show");

  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.classList.remove("show");
  }, 2000);
}

// =========================
// ⚽ SCORE (UPGRADED)
// =========================
let lastScoreState = { home: null, away: null };

function updateScore() {
  const match = game.match?.live;
  if (!match) return;

  const scoreEl = document.getElementById("topScore");
  const teamsEl = document.getElementById("topTeams");
  const minuteEl = document.getElementById("topMinute");
  const tacticsEl = document.getElementById("topTactics");

  // =========================
  // 🏷 TEAM NAMES (UPGRADED)
  // =========================
  if (teamsEl) {
    const current = game.match?.current;

    if (current) {
      const homeName = game.match?.home?.name || current?.home?.name || "-";

      const awayName = game.match?.away?.name || current?.away?.name || "-";

      teamsEl.innerHTML = `
        <span class="home">${homeName}</span>
        <span class="vs">vs</span>
        <span class="away">${awayName}</span>
      `;
    }
  }

  // =========================
  // ⚽ SCORE + GOAL DETECT
  // =========================
  const home = match.score?.home ?? 0;
  const away = match.score?.away ?? 0;

  if (scoreEl) {
    const isGoal =
      lastScoreState.home !== null &&
      (home !== lastScoreState.home || away !== lastScoreState.away);

    scoreEl.textContent = `${home} : ${away}`;

    // 🎯 GOAL ANIMATION
    if (isGoal) {
      scoreEl.classList.remove("goal", "shake");

      // 👉 reflow trick (wichtig!)
      void scoreEl.offsetWidth;

      scoreEl.classList.add("goal", "shake");

      setTimeout(() => {
        scoreEl.classList.remove("goal", "shake");
      }, 600);
    }
  }

  // save state
  lastScoreState = { home, away };

  // =========================
  // ⏱ MINUTE
  // =========================
  if (minuteEl) {
    minuteEl.textContent = `${match.minute ?? 0}'`;
  }

  // =========================
  // ⚙️ TACTICS LABEL
  // =========================
  if (tacticsEl && game.tactics) {
    const preset = game.tactics.preset || "balanced";

    tacticsEl.textContent =
      preset === "custom" ? "CUSTOM" : preset.toUpperCase();
  }
}

function triggerGoalAnimation(side) {
  const scoreEl = document.getElementById("topScore");
  const barEl = document.getElementById("topBar");

  if (!scoreEl || !barEl) return;

  // reset (damit Animation erneut triggert)
  scoreEl.classList.remove("goal", "shake");
  barEl.classList.remove("goal-home", "goal-away");

  void scoreEl.offsetWidth; // 🔥 reflow trick

  // apply
  scoreEl.classList.add("goal", "shake");
  barEl.classList.add(side === "home" ? "goal-home" : "goal-away");

  // cleanup
  setTimeout(() => {
    scoreEl.classList.remove("goal", "shake");
    barEl.classList.remove("goal-home", "goal-away");
  }, 700);
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

  // =========================
  // 🔁 DUPLICATE GUARD
  // =========================
  if (newest.id === lastRenderedEventId) return;
  lastRenderedEventId = newest.id;

  // =========================
  // 📊 TRACKING
  // =========================
  track("game_event", {
    minute: newest.minute,
    text: newest.text || null,
    type: newest.type || "UNKNOWN",
  });

  // =========================
  // 🎬 EVENT ICON (NEU)
  // =========================
  if (newest.type) {
    try {
      pushEventIcon(newest.type);
    } catch (e) {
      console.warn("⚠️ pushEventIcon failed", e);
    }
  }

  // =========================
  // 🧠 TEXT GENERATION
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
    <span style="color:#64748b">${newest.minute}'</span> 
    <span>${text}</span>
  `;

  container.appendChild(div);

  // 👉 optional: autoscroll
  container.scrollTop = container.scrollHeight;

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
        balanced: "Ausgeglichen",
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
  // =========================
  // 🚫 STATUS BADGES
  // =========================
  let statusBadge = "";

  const availability = game.team?.availability;

  if (isPlayerSuspended(p.id)) {
    const matches = availability?.suspended?.[String(p.id)]?.matchesLeft || 0;

    statusBadge = `
      <span class="status suspended">
        🟥 Sperre (${matches})
      </span>
    `;
  } else if (isPlayerInjured(p.id)) {
    const matches = availability?.injured?.[String(p.id)]?.matchesLeft || 0;

    statusBadge = `
      <span class="status injured">
        🤕 Verletzt (${matches})
      </span>
    `;
  }
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

${statusBadge}
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
    } else if (type === "MID") {
      attack += rating * 0.6;
      control += rating * 1.0;
    } else if (type === "DEF") {
      defense += rating * 1.1;
      control += rating * 0.4;
    } else if (type === "GK") {
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

  // =========================
  // 👥 SPIELER LADEN
  // =========================
  const allPlayers = getPlayersOfTeam(teamId);

  // 🔥 Nur verfügbare Spieler für Startelf
  const availablePlayers = allPlayers.filter((player) =>
    isPlayerAvailable(player.id),
  );

  let players = availablePlayers;

  const lineup = game.team?.lineup;

  if (!allPlayers.length) {
    container.innerHTML = "<p>Keine Spieler vorhanden</p>";
    return;
  }

  // =========================
  // 📐 FORMATION (EINMAL!)
  // =========================
  const formation = game.tactics?.formation || lineup?.formation || "4-4-2";

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
    starters.filter((p) => p?.id).map((p) => String(p.id)),
  );

  benchPlayers = allPlayers.filter((p) => !starterIds.has(String(p.id)));

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

      if (!isPlayerAvailable(id)) {
        showToast("⚠️ Spieler nicht verfügbar");
        return;
      }

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
        } else if (slotA && !slotB) {
          if (typeB === getSlotType(slotA)) {
            slots[slotA] = id;
          } else return;
        } else if (!slotA && slotB) {
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
    ATT: [],
  };

  assigned.forEach((p) => {
    if (groups[p.role]) {
      groups[p.role].push(p);
    }
  });

  const index = {
    GK: 0,
    DEF: 0,
    MID: 0,
    ATT: 0,
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

      const player = players.find((p) => String(p.id) === String(id));

      if (!player) return;

      openPlayerModal(player);
    };
  });
}

let lastIconTime = 0;
let lastSpamIconTime = 0;

function pushEventIcon(type) {
  const lane = document.getElementById("eventLane");
  if (!lane) return;

  const now = Date.now();

  // =========================
  // 🎯 PRIORITY SYSTEM
  // =========================
  const IMPORTANT = ["GOAL"];
  const MEDIUM = ["SHOT", "SAVE", "SHOT_SAVED", "FOUL", "CORNER", "DUEL"];
  const SPAM = [
    "PASS",
    "DRIBBLE",
    "INTERCEPTION",
    "BALL_LOSS",
    "BALL_RECOVERY",
    "CLEARANCE",
  ];

  // =========================
  // ⏱ GLOBAL COOLDOWN
  // =========================
  if (now - lastIconTime < 800) return;

  // =========================
  // 🧠 FILTER LOGIC
  // =========================

  // 🔥 Wichtige Events → immer
  if (IMPORTANT.includes(type)) {
    lastIconTime = now;
    renderIcon(type);
    return;
  }

  // 🟡 Medium → leicht gedrosselt
  if (MEDIUM.includes(type)) {
    if (Math.random() < 0.7) {
      lastIconTime = now;
      renderIcon(type);
    }
    return;
  }

  // ⚪ Spam → hart gedrosselt + extra cooldown
  if (SPAM.includes(type)) {
    if (now - lastSpamIconTime < 2000) return;

    if (Math.random() < 0.25) {
      lastIconTime = now;
      lastSpamIconTime = now;
      renderIcon(type);
    }
    return;
  }
}

// =========================
// 🎬 RENDER
// =========================
function renderIcon(type) {
  const lane = document.getElementById("eventLane");
  if (!lane) return;

  const ICONS = {
    GOAL: "⚽",
    SHOT: "🥅",
    SAVE: "🧤",
    SHOT_SAVED: "🧤",
    FOUL: "💢",
    CORNER: "🚩",
    DUEL: "⚔️",
    PASS: "➤",
    DRIBBLE: "🌀",
    INTERCEPTION: "✋",
    BALL_LOSS: "❌",
    BALL_RECOVERY: "♻️",
    CLEARANCE: "🛡️",
  };

  const icon = document.createElement("div");
  icon.className = "event-icon";
  icon.textContent = ICONS[type] || "•";

  lane.appendChild(icon);

  setTimeout(() => icon.remove(), 2200);
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
