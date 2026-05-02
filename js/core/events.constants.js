// =========================
// 📡 GLOBAL EVENT CHANNELS
// =========================
export const EVENTS = {
  GAME_START: "game_start",
  MATCH_EVENT: "match_event",
  MATCH_FINISHED: "match_finished",
  STATE_CHANGED: "state_changed",
  TEAM_UPDATE: "team_update",

  // 🔥 GAMEPLAY SYSTEMS
  AD_TRIGGER: "ad_trigger",
  AD_REWARD: "ad_reward",

  GAME_EVENT: "game_event",
  GAME_EVENT_CHOICE: "game_event_choice"
};

// =========================
// ⚽ MATCH EVENT TYPES (ERWEITERT)
// =========================
export const EVENT_TYPES = {

  // =========================
  // 🎯 CORE ACTIONS
  // =========================
  GOAL: "GOAL",
  SHOT: "SHOT",
  SHOT_SAVED: "SHOT_SAVED",
  SHOT_MISS: "SHOT_MISS",

  PASS: "PASS",
  DRIBBLE: "DRIBBLE",
  DUEL: "DUEL",
  TACKLE: "TACKLE",
  INTERCEPTION: "INTERCEPTION",
  BALL_LOSS: "BALL_LOSS",
  BALL_RECOVERY: "BALL_RECOVERY",
  CLEARANCE: "CLEARANCE",

  // =========================
  // 🚫 FOULS & CARDS
  // =========================
  FOUL: "FOUL",
  YELLOW_CARD: "YELLOW_CARD",
  RED_CARD: "RED_CARD",

  // =========================
  // ⚙️ SET PIECES
  // =========================
  CORNER: "CORNER",
  FREE_KICK: "FREE_KICK",

  PENALTY: "PENALTY",
  PENALTY_SCORED: "PENALTY_SCORED",
  MISSED_PENALTY: "MISSED_PENALTY",

  // =========================
  // 📦 OTHER
  // =========================
  OFFSIDE: "OFFSIDE",
  OUT_OF_PLAY: "OUT_OF_PLAY",
  THROW_IN: "THROW_IN",
  GOAL_KICK: "GOAL_KICK",

  // =========================
  // ⏱ MATCH FLOW
  // =========================
  KICKOFF: "KICKOFF",
  HALFTIME: "HALFTIME",
  FULLTIME: "FULLTIME",

  // =========================
  // 🔧 TACTICS
  // =========================
  TACTIC_CHANGE: "TACTIC_CHANGE"
};


// =========================
// 🎯 EVENT OUTCOMES
// =========================
export const EVENT_OUTCOMES = {
  SUCCESS: "success",
  FAIL: "fail",
  SAVED: "saved",
  MISS: "miss",
  BLOCKED: "blocked",
  NEUTRAL: "neutral"
};
