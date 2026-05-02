/* =========================================================
   penaltyPhysics.js – FULL DROP-IN REPLACEMENT
   KOMPLETT ERSETZEN
   ========================================================= */

import { PENALTY_ZONES } from './penaltyConfig.js';

/* =========================
   ADVANCED ARCADE PENALTY PHYSICS
   ========================= */

const TARGET_MAP = {
  [PENALTY_ZONES.TOP_LEFT]: {
    x: 0.18,
    y: 0.24
  },

  [PENALTY_ZONES.TOP_RIGHT]: {
    x: 0.82,
    y: 0.24
  },

  [PENALTY_ZONES.BOTTOM_LEFT]: {
    x: 0.22,
    y: 0.63
  },

  [PENALTY_ZONES.BOTTOM_RIGHT]: {
    x: 0.78,
    y: 0.63
  },

  [PENALTY_ZONES.CENTER]: {
    x: 0.5,
    y: 0.42
  }
};

/* =========================
   BALL START POSITION
   Höher setzen -> besser sichtbar
   ========================= */

const START_POINT = {
  x: 0.5,
  y: 0.86
};

/* =========================
   SHOT CREATION
   ========================= */

export function calculateShot(
  input,
  config
) {
  const physics =
    config.physics;

  const zone = input.zone;

  const targetBase =
    TARGET_MAP[zone] ||
    TARGET_MAP[
      PENALTY_ZONES.CENTER
    ];

  const precisionFactor =
    1 -
    Math.pow(
      input.power,
      1.35
    );

  const jitter =
    physics.errorJitter *
    (0.35 +
      precisionFactor);

  const target = {
    x: clamp01(
      targetBase.x +
        randomSpread(
          jitter * 1.15
        )
    ),

    y: clamp01(
      targetBase.y +
        randomSpread(
          jitter * 0.75
        )
    )
  };

  const durationMs = lerp(
    physics.shotDurationMaxMs,
    physics.shotDurationMinMs,
    easeOutQuad(
      input.power
    )
  );

  const curveHeight =
    zone ===
      PENALTY_ZONES.TOP_LEFT ||
    zone ===
      PENALTY_ZONES.TOP_RIGHT
      ? 0.34 +
        input.power * 0.18
      : 0.18 +
        input.power * 0.12;

  const lateralCurve =
    zone ===
      PENALTY_ZONES.TOP_LEFT ||
    zone ===
      PENALTY_ZONES.BOTTOM_LEFT
      ? -0.025 *
        input.power
      : zone ===
          PENALTY_ZONES.TOP_RIGHT ||
        zone ===
          PENALTY_ZONES.BOTTOM_RIGHT
      ? 0.025 *
        input.power
      : 0;

  return {
    zone,
    power: input.power,
    target,
    durationMs,
    curveHeight,
    lateralCurve
  };
}

/* =========================
   BALL FLIGHT
   ========================= */

export function getBallPosition(
  shot,
  progress
) {
  const t =
    clamp01(progress);

  const start =
    START_POINT;

  const end =
    shot.target;

  const peakY =
    Math.min(
      start.y,
      end.y
    ) -
    shot.curveHeight;

  let x = lerp(
    start.x,
    end.x,
    t
  );

  x +=
    Math.sin(
      t * Math.PI
    ) *
    shot.lateralCurve;

  const yLinear = lerp(
    start.y,
    end.y,
    t
  );

  const arc =
    4 *
    t *
    (1 - t);

  const y =
    yLinear -
    arc *
      (Math.min(
        start.y,
        end.y
      ) - peakY);

  return {
    x: clamp01(x),
    y: clamp01(y)
  };
}

/* =========================
   SAVE RESOLUTION
   FIX:
   Ball muss wirklich Torraum erreichen
   ========================= */

export function resolveShot(
  shot,
  keeperPose,
  keeperDecision
) {
  const dx =
    shot.target.x -
    keeperPose.x;

  const dy =
    shot.target.y -
    keeperPose.y;

  const distance =
    Math.hypot(
      dx,
      dy
    );

  const timingBonus =
    keeperPose.progress >=
    0.55
      ? 1
      : keeperPose.progress >=
        0.35
      ? 0.82
      : 0.58;

  const difficultyMultiplier =
    shot.zone ===
      PENALTY_ZONES.TOP_LEFT ||
    shot.zone ===
      PENALTY_ZONES.TOP_RIGHT
      ? 0.72
      : 1;

  const effectiveSaveRadius =
    keeperDecision.saveRadius *
    timingBonus *
    difficultyMultiplier;

  const rawSaved =
    distance <=
    effectiveSaveRadius;

  /* WICHTIG:
     Goal zählt nur,
     wenn Ball tatsächlich
     Torbereich erreicht
  */
  const crossedGoalLine =
    shot.target.y <=
    0.68;

  const saved =
    rawSaved &&
    crossedGoalLine;

  const goal =
    !rawSaved &&
    crossedGoalLine;

  let saveQuality =
    'miss';

  if (saved) {
    if (
      distance <
      effectiveSaveRadius *
        0.45
    ) {
      saveQuality =
        'perfect';
    } else if (
      distance <
      effectiveSaveRadius *
        0.8
    ) {
      saveQuality =
        'strong';
    } else {
      saveQuality =
        'weak';
    }
  }

  return {
    saved,
    goal,
    distance,
    saveQuality,
    effectiveSaveRadius,
    crossedGoalLine
  };
}

/* =========================
   HELPERS
   ========================= */

function lerp(a, b, t) {
  return (
    a +
    (b - a) * t
  );
}

function clamp01(
  value
) {
  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}

function randomSpread(
  amount
) {
  return (
    (Math.random() *
      2 -
      1) *
    amount
  );
}

function easeOutQuad(
  t
) {
  return (
    1 -
    (1 - t) *
      (1 - t)
  );
}
