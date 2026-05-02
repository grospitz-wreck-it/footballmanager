/* =========================================================
   penaltyPhysics.js – FULL DROP-IN REPLACEMENT
   KOMPLETT ERSETZEN
   ========================================================= */

import { PENALTY_ZONES } from "./penaltyConfig.js";

/* =========================
   ADVANCED ARCADE PENALTY PHYSICS
   ========================= */

const TARGET_MAP = {
  [PENALTY_ZONES.TOP_LEFT]: {
    x: 0.29,
    y: 0.31,
  },

  [PENALTY_ZONES.TOP_RIGHT]: {
    x: 0.71,
    y: 0.31,
  },

  [PENALTY_ZONES.BOTTOM_LEFT]: {
    x: 0.31,
    y: 0.49,
  },

  [PENALTY_ZONES.BOTTOM_RIGHT]: {
    x: 0.69,
    y: 0.49,
  },

  [PENALTY_ZONES.CENTER]: {
    x: 0.5,
    y: 0.4,
  },
};

/* =========================
   BALL START POSITION
   Höher setzen -> besser sichtbar
   ========================= */

const START_POINT = {
  x: 0.5,
  y: 0.78,
};

/* =========================
   SHOT CREATION
   ========================= */

export function calculateShot(input, config) {
  const physics = config.physics;

  const zone = input.zone;

  const targetBase = TARGET_MAP[zone] || TARGET_MAP[PENALTY_ZONES.CENTER];

  const precisionFactor = 1 - Math.pow(input.power, 1.35);

  const jitter = physics.errorJitter * (0.35 + precisionFactor);

  const target = {
    x: clamp01(targetBase.x + randomSpread(jitter * 1.15)),

    y: clamp01(targetBase.y + randomSpread(jitter * 0.75)),
  };

  const durationMs = lerp(
    physics.shotDurationMaxMs,
    physics.shotDurationMinMs,
    easeOutQuad(input.power),
  );

  const curveHeight =
    zone === PENALTY_ZONES.TOP_LEFT || zone === PENALTY_ZONES.TOP_RIGHT
      ? 0.34 + input.power * 0.18
      : 0.18 + input.power * 0.12;

  const lateralCurve =
    zone === PENALTY_ZONES.TOP_LEFT || zone === PENALTY_ZONES.BOTTOM_LEFT
      ? -0.025 * input.power
      : zone === PENALTY_ZONES.TOP_RIGHT || zone === PENALTY_ZONES.BOTTOM_RIGHT
        ? 0.025 * input.power
        : 0;

  return {
    zone,
    power: input.power,
    target,
    durationMs,
    curveHeight,
    lateralCurve,
  };
}

/* =========================
   BALL FLIGHT
   ========================= */

export function getBallPosition(shot, progress) {
  const t = clamp01(progress);

  const start = START_POINT;

  const end = shot.target;

  const peakY = Math.min(start.y, end.y) - shot.curveHeight;

  let x = lerp(start.x, end.x, t);

  x += Math.sin(t * Math.PI) * shot.lateralCurve;

  const yLinear = lerp(start.y, end.y, t);

  const arc = 4 * t * (1 - t);

  const y = yLinear - arc * (Math.min(start.y, end.y) - peakY);

  return {
    x: clamp01(x),
    y: clamp01(y),
  };
}

/* =========================
   SAVE RESOLUTION
   FIX:
   Ball muss wirklich Torraum erreichen
   ========================= */

/* =========================================================
   penaltyPhysics.js
   NUR resolveShot() ERSETZEN
   ========================================================= */

export function resolveShot(shot, keeperPose, keeperDecision) {
  const dx = shot.target.x - keeperPose.x;

  const dy = shot.target.y - keeperPose.y;

  const distance = Math.hypot(dx, dy);

  /* Keeper reaction timing */
  const timingBonus =
    keeperPose.progress >= 0.7 ? 1 : keeperPose.progress >= 0.5 ? 0.78 : 0.52;

  /* Top corners harder */
  const difficultyMultiplier =
    shot.zone === PENALTY_ZONES.TOP_LEFT ||
    shot.zone === PENALTY_ZONES.TOP_RIGHT
      ? 0.68
      : 1;

  const effectiveSaveRadius =
    keeperDecision.saveRadius * timingBonus * difficultyMultiplier;

  /* =====================================================
     EXAKTE TORRAUM-DEFINITION
     ===================================================== */

  const insideGoalWidth = shot.target.x >= 0.245 && shot.target.x <= 0.755;

  const insideGoalHeight = shot.target.y >= 0.27 && shot.target.y <= 0.555;

  const validGoal = insideGoalWidth && insideGoalHeight;

  /* =====================================================
     WICHTIG:
     Keeper hält NUR,
     wenn Ball VOR Netzbereich erreicht wird
     ===================================================== */

  const keeperCanReach = shot.target.y <= 0.5;

  const rawSaved = distance <= effectiveSaveRadius && keeperCanReach;

  const saved = rawSaved && validGoal;

  const goal = !rawSaved && validGoal;

  let saveQuality = "miss";

  if (saved) {
    if (distance < effectiveSaveRadius * 0.38) {
      saveQuality = "perfect";
    } else if (distance < effectiveSaveRadius * 0.72) {
      saveQuality = "strong";
    } else {
      saveQuality = "weak";
    }
  }

  return {
    saved,
    goal,
    distance,
    saveQuality,
    effectiveSaveRadius,
    validGoal,
    keeperCanReach,
    insideGoalWidth,
    insideGoalHeight,
  };
}

/* =========================
   HELPERS
   ========================= */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function randomSpread(amount) {
  return (Math.random() * 2 - 1) * amount;
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}
