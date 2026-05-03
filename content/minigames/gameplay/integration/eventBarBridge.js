// /gameplay/integration/eventBarBridge.js

/**
 * Event Bar Bridge V1
 *
 * Ziel:
 * Produktionsreifer Timeline-Vertrag
 * für spätere Integration in bestehende Event-Bar,
 * ohne bestehende Systeme anzufassen.
 */

const EVENT_PRIORITY = {
  GOAL: 100,
  RED_CARD: 95,
  PENALTY: 90,
  BIG_CHANCE: 85,
  SHOT: 70,
  SAVE: 68,
  FOUL: 60,
  CORNER: 55,
  THROUGH_PASS: 50,
  BUILDUP_RIGHT: 40,
  BUILDUP_LEFT: 40,
  PASS: 35,
  DRIBBLE: 30,
  BALL_WIN: 25,
  BALL_RECOVERY: 25,
  INTERCEPTION: 22,
  BALL_LOSS: 20,
  DEFAULT: 10,
};

const EVENT_STYLE = {
  GOAL: "highlight-goal",
  RED_CARD: "highlight-danger",
  PENALTY: "highlight-warning",
  BIG_CHANCE: "highlight-chance",
  SHOT: "highlight-shot",
  SAVE: "highlight-save",
  FOUL: "highlight-foul",
  DEFAULT: "standard",
};

export function normalizeTimelineEvent(event) {
  if (!event) return null;

  const type = event.type || "DEFAULT";

  return {
    id:
      event.id ||
      `timeline_${Date.now()}_${Math.floor(Math.random() * 9999)}`,

    minute: event.minute || 0,
    second: event.second || 0,

    type,

    priority:
      EVENT_PRIORITY[type] ||
      EVENT_PRIORITY.DEFAULT,

    style:
      EVENT_STYLE[type] ||
      EVENT_STYLE.DEFAULT,

    team:
      event.team || "HOME",

    text:
      event.timelineText ||
      event.text ||
      type,

    intensity:
      event.intensity || 1,

    momentum:
      event.momentum || 0,

    highlight:
      (EVENT_PRIORITY[type] || 0) >= 70,

    metadata: {
      camera: event.camera || null,
      score: event.score || null,
      playerName: event.playerName || null,
      tacticalContext: event.tacticalContext || null,
    },

    raw: event,
  };
}

export function attachToEventBar(adapter) {
  return {
    attached: false,

    requiredAdapterMethods: [
      "pushTimelineEvent(event)",
    ],

    normalizeEvent(event) {
      return normalizeTimelineEvent(event);
    },

    push(event) {
      const normalized = normalizeTimelineEvent(event);

      if (!adapter?.pushTimelineEvent) {
        return {
          pushed: false,
          reason: "No adapter connected.",
          normalizedEvent: normalized,
        };
      }

      return adapter.pushTimelineEvent(normalized);
    },

    adapter,

    note:
      "Bridge ready. Existing Event-Bar remains untouched until manual integration.",
  };
}
