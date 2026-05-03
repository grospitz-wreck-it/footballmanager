// /gameplay/integration/commentaryBridge.js

/**
 * Commentary Bridge V1
 *
 * Ziel:
 * Bestehende Commentary Engine später ohne Kernumbauten anschließen.
 *
 * Sandbox:
 * Keine echte Integration, nur Produktionsreifer Adapter + Event Mapping.
 */

const EVENT_TYPE_MAP = {
  BALL_WIN: "BALL_RECOVERY",
  BALL_RECOVERY: "BALL_RECOVERY",
  BUILDUP_RIGHT: "PASS",
  BUILDUP_LEFT: "PASS",
  THROUGH_PASS: "PASS",
  PASS: "PASS",
  DRIBBLE: "DRIBBLE",
  INTERCEPTION: "INTERCEPTION",
  BALL_LOSS: "BALL_LOSS",
  SHOT: "SHOT",
  SHOT_SAVED: "SHOT_SAVED",
  SAVE: "SAVE",
  GOAL: "GOAL",
  FOUL: "FOUL",
  CORNER: "CORNER",
  RED_CARD: "RED_CARD",
  INJURY: "INJURY",
};

function normalizeTeam(event) {
  if (!event?.team) return "HOME";

  if (typeof event.team === "string") {
    return event.team.toUpperCase();
  }

  return "HOME";
}

function buildFallbackText(event) {
  return event.timelineText || event.type || "Match Event";
}

export function normalizeMatchEvent(event) {
  if (!event) return null;

  return {
    type: EVENT_TYPE_MAP[event.type] || event.type,

    minute: event.minute || 0,
    second: event.second || 0,

    score: event.score || {
      home: 0,
      away: 0,
    },

    team: normalizeTeam(event),

    teamName:
      event.teamName ||
      (normalizeTeam(event) === "HOME" ? "Home" : "Away"),

    playerName:
      event.playerName ||
      event.player ||
      null,

    keeperName:
      event.keeperName ||
      null,

    timelineText: buildFallbackText(event),

    intensity:
      event.intensity || 1,

    momentum:
      event.momentum || 0,

    raw: event,
  };
}

/**
 * Main Bridge API
 */
export function attachCommentaryEngine(adapter) {
  return {
    attached: false,

    requiredAdapterMethods: [
      "emitCommentary(event)",
      "setMatchContext(context)",
    ],

    matchEventContract: {
      id: "string",
      minute: "number",
      second: "number",
      type: "string",
      team: "HOME|AWAY",
      timelineText: "string",
      intensity: "number",
      score: {
        home: "number",
        away: "number",
      },
    },

    normalizeEvent(event) {
      return normalizeMatchEvent(event);
    },

    emit(event) {
      if (!adapter?.emitCommentary) {
        return {
          emitted: false,
          reason: "No adapter connected.",
          normalizedEvent: normalizeMatchEvent(event),
        };
      }

      const normalized = normalizeMatchEvent(event);

      return adapter.emitCommentary(normalized);
    },

    setContext(context) {
      if (!adapter?.setMatchContext) {
        return {
          contextAttached: false,
          reason: "No adapter connected.",
          context,
        };
      }

      return adapter.setMatchContext(context);
    },

    adapter,

    note:
      "Bridge ready. Existing commentary engine can later attach without modifying gameplay core.",
  };
}
