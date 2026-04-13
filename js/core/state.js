// =========================
// 🌍 GLOBAL GAME STATE (FINAL STABLE)
// =========================
const game = {

  // =========================
  // 👤 PLAYER
  // =========================
  player: {
    name: ""
  },

  // =========================
  // 🏆 LIGA
  // =========================
  league: {
    current: null,
    schedule: [],
    currentRound: 0,
    currentMatchIndex: 0
  },

  // =========================
  // 📚 DATA
  // =========================
  data: {
  leagues: [],
  events: [],
  campaigns: [],
  gameEvents: [],
}

  // =========================
  // 👕 TEAM
  // =========================
  team: {
  selected: null,      // bleibt (für UI)
  selectedId: null,     // NEU
},

  // =========================
  // ⚽ MATCH
  // =========================
  match: {
    current: null,
    live: createLiveMatchState()
  },

  // =========================
  // 🎲 EVENTS SYSTEM
  // =========================
  events: createEventsState(),

  // =========================
  // 📢 ADS
  // =========================
  ads: createAdsState(),

  // =========================
  // 📊 ANALYTICS
  // =========================
  analytics: createAnalyticsState(),

  // =========================
  // ⚙️ SETTINGS
  // =========================
  settings: {
    sound: true,
    notifications: true
  },

  // =========================
  // 🌐 ONLINE
  // =========================
  online: {
    leagueId: null,
    playerId: null,
    connected: false
  },

  // =========================
  // 🖥 UI STATE (🔥 FINAL FIX)
  // =========================
  ui: createUIState(),

  // =========================
  // 🎮 FLOW
  // =========================
  phase: "setup",

  season: {
    year: 1
  }
};

// =========================
// 🧩 FACTORIES (🔥 WICHTIG)
// =========================

function createUIState(){
  return {
    sidebarOpen: false,
    tab: "table"
  };
}

function createLiveMatchState(){
  return {
    minute: 0,
    running: false,
    score: { home: 0, away: 0 },
    events: []
  };
}

function createEventsState(){
  return {
    history: [],
    last: null,
    active: [],
    cooldowns: {},
    triggeredCount: 0
  };
}

function createAdsState(){
  return {
    active: [],
    impressions: {},
    clicks: {},
    last: null
  };
}

function createAnalyticsState(){
  return {
    eventsTriggered: 0,
    adsSeen: 0,
    clicks: 0,
    sessionStart: Date.now(),
    playtime: 0
  };
}

// =========================
// 🧹 RESET GAME (FINAL FIX)
// =========================
function resetGame(){

  localStorage.clear();

  game.player.name = "";

  game.league = {
    current: null,
    schedule: [],
    currentRound: 0,
    currentMatchIndex: 0
  };

  game.team.selected = null;
  game.team.selectedId = null; // 👈 hinzufügen

  game.match.current = null;
  game.match.live = createLiveMatchState();

  game.events = createEventsState();
  game.ads = createAdsState();
  game.analytics = createAnalyticsState();

  // 🔥 CRITICAL: immer frische Referenz
  game.ui = createUIState();

  game.phase = "setup";
  game.season.year = 1;

  console.log("🧹 Game komplett zurückgesetzt");
}

// =========================
// 🌐 DEBUG (🔥 EXTREM WICHTIG)
// =========================
if (typeof window !== "undefined") {
  window.game = game;
}

// =========================
// 📦 EXPORTS
// =========================
export {
  game,
  resetGame
};
