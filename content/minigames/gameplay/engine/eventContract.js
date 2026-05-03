// /gameplay/engine/eventContract.js

/**
 * EventContract V1.3
 *
 * Zentrale Wahrheit für:
 * - Renderer
 * - Commentary
 * - Event-Bar
 * - Minigames
 * - Karriereintegration
 */

export const EVENT_TYPES = {
  BALL_WIN: "BALL_WIN",
  BALL_RECOVERY: "BALL_RECOVERY",
  BUILDUP_LEFT: "BUILDUP_LEFT",
  BUILDUP_RIGHT: "BUILDUP_RIGHT",
  PASS: "PASS",
  THROUGH_PASS: "THROUGH_PASS",
  DRIBBLE: "DRIBBLE",
  INTERCEPTION: "INTERCEPTION",
  BALL_LOSS: "BALL_LOSS",
  SHOT: "SHOT",
  SHOT_SAVED: "SHOT_SAVED",
  SAVE: "SAVE",
  BIG_CHANCE: "BIG_CHANCE",
  GOAL: "GOAL",
  FOUL: "FOUL",
  CORNER: "CORNER",
  YELLOW_CARD: "YELLOW_CARD",
  RED_CARD: "RED_CARD",
  INJURY: "INJURY",
  PENALTY: "PENALTY",
  FREEKICK: "FREEKICK",
};

export const EVENT_PRIORITY = {
  GOAL: 100,
  RED_CARD: 95,
  PENALTY: 92,
  BIG_CHANCE: 88,
  SHOT: 75,
  SAVE: 72,
  FOUL: 60,
  CORNER: 55,
  THROUGH_PASS: 52,
  BUILDUP_LEFT: 42,
  BUILDUP_RIGHT: 42,
  PASS: 35,
  DRIBBLE: 30,
  BALL_WIN: 25,
  BALL_RECOVERY: 25,
  INTERCEPTION: 22,
  BALL_LOSS: 20,
  DEFAULT: 10,
};

export function createMatchEvent({
  id,
  minute = 0,
  second = 0,
  type,
  team = "HOME",
  teamName = null,
  playerName = null,
  keeperName = null,
  ball = [0.5, 0.5],
  camera = null,
  timelineText = "",
  intensity = 1,
  momentum = 0,
  score = { home: 0, away: 0 },
  tacticalContext = null,
  metadata = {},
}) {
  if (!type) {
    throw new Error("MatchEvent requires a valid type.");
  }

  return {
    id:
      id ||
      `evt_${Date.now()}_${Math.floor(Math.random() * 99999)}`,

    minute,
    second,

    type,

    priority:
      EVENT_PRIORITY[type] ||
      EVENT_PRIORITY.DEFAULT,

    team,
    teamName,
    playerName,
    keeperName,

    ball,
    camera,

    timelineText:
      timelineText ||
      type,

    intensity,
    momentum,

    score,

    tacticalContext,

    metadata,

    createdAt: Date.now(),
  };
}

export function validateMatchEvent(event) {
  if (!event) return false;

  return (
    typeof event.id === "string" &&
    typeof event.minute === "number" &&
    typeof event.second === "number" &&
    typeof event.type === "string" &&
    Array.isArray(event.ball) &&
    event.ball.length === 2
  );
}

export function cloneMatchEvent(event) {
  return JSON.parse(JSON.stringify(event));
}

export function getEventHighlightLevel(type) {
  const priority =
    EVENT_PRIORITY[type] ||
    EVENT_PRIORITY.DEFAULT;

  if (priority >= 90) return "critical";
  if (priority >= 70) return "major";
  if (priority >= 50) return "medium";

  return "minor";
}
