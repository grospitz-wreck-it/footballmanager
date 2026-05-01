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
    currentMatchIndex: 0,
  },

  // =========================
  // 📚 DATA
  // =========================
  data: {
    leagues: [],
    events: [],
    campaigns: [],
    gameEvents: [],
  },

  // =========================
  // 👕 TEAM
  // =========================
 team: {
  selected: null,
  selectedId: null,

  // =========================
  // 🚫 PLAYER AVAILABILITY
  // =========================
  availability: {
    suspended: {},
    injured: {}
  },

  // =========================
  // 🟨 DISCIPLINE SYSTEM
  // =========================
  discipline: {
    yellowCards: {}
  },

  // 🔥 LINEUP SYSTEM
  lineup: {
    formation: "4-4-2",

    // 🔥 wichtig: klare Slot-Struktur
    slots: {
      GK: null,

      DEF_1: null,
      DEF_2: null,
      DEF_3: null,
      DEF_4: null,

      MID_1: null,
      MID_2: null,
      MID_3: null,
      MID_4: null,

      ST_1: null,
      ST_2: null
    }
  }
},
  // =========================
  // ⚽ MATCH
  // =========================
  match: {
    current: null,
    live: createLiveMatchState()
  },

  // =========================
  // 🎯 TACTICS (🔥 NEU)
  // =========================
  tactics: createTacticsState(),

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
  // 🖥 UI STATE
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
// 🧩 FACTORIES
// =========================

function createUIState(){
  return {
    sidebarOpen: false,
    tab: "table",

    // 🔥 optional direkt vorbereitet
    tacticsOpen: false
  };
}

// =========================
// 🔥 TACTICS FACTORY (NEU)
// =========================
function createTacticsState(){
  return {
    preset: "balanced",

    tempo: "normal",     // slow | normal | fast
    pressing: "medium",  // low | medium | high
    line: "medium",      // low | medium | high

    lastChangeMinute: 0
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
// 🧹 RESET GAME
// =========================
function resetGame() {
  localStorage.clear();

  game.player.name = "";

  game.league = {
    current: null,
    schedule: [],
    currentRound: 0,
    currentMatchIndex: 0,
  };

  game.team = {
    selected: null,
    selectedId: null,

    availability: {
      suspended: {},
      injured: {},
    },

    discipline: {
      yellowCards: {},
    },

    lineup: {
      formation: "4-4-2",
      slots: {
        GK: null,

        DEF_1: null,
        DEF_2: null,
        DEF_3: null,
        DEF_4: null,

        MID_1: null,
        MID_2: null,
        MID_3: null,
        MID_4: null,

        ST_1: null,
        ST_2: null,
      },
    },
  };

  game.match = {
    current: null,
    live: createLiveMatchState(),
  };

  game.tactics = createTacticsState();
  game.events = createEventsState();
  game.ads = createAdsState();
  game.analytics = createAnalyticsState();
  game.ui = createUIState();

  game.phase = "setup";

  game.season = {
    year: 1,
  };

  // 🔥 DOM RESET
  const eventText = document.getElementById("eventText");
  if (eventText) {
    eventText.textContent = "Willkommen im Spiel";
  }

  const historyList = document.getElementById("eventHistoryList");
  if (historyList) {
    historyList.innerHTML = "";
  }

  const overlay = document.getElementById("matchOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("show");
  }

  console.log("🧹 Game komplett zurückgesetzt");
}

// =========================
// 🌐 DEBUG
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
