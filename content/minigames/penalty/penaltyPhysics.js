/* =========================================================
   penaltyPhysics.js – FINAL PRODUCTION DROP-IN
   FULL FILE REPLACEMENT
   ========================================================= */

import { PENALTY_ZONES } from './penaltyConfig.js';

/* =========================
   TARGET MAP
   Recalibrated for real stadium.webp
   ========================= */

const TARGET_MAP = {
  [PENALTY_ZONES.TOP_LEFT]: {
    x: 0.29,
    y: 0.31
  },

  [PENALTY_ZONES.TOP_RIGHT]: {
    x: 0.71,
    y: 0.31
  },

  [PENALTY_ZONES.BOTTOM_LEFT]: {
    x: 0.31,
    y: 0.49
  },

  [PENALTY_ZONES.BOTTOM_RIGHT]: {
    x: 0.69,
    y: 0.49
  },

  [PENALTY_ZONES.CENTER]: {
    x: 0.5,
    y: 0.4
  }
};

/* =========================
   BALL START POSITION
   ========================= */

const START_POINT = {
  x: 0.5,
  y: 0.78
};

/* =========================
   REAL GOAL ZONE
   Based on current stadium
   ========================= */

const GOAL_ZONE = {
  left: 0.245,
  right: 0.755,
  top: 0.27,
  bottom: 0.555
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

  const zone =
    input.zone;

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

  const durationMs =
    lerp(
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
        input.power *
          0.18
      : 0.18 +
        input.power *
          0.12;

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
    power:
      input.power,
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

  const yLinear =
    lerp(
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
      ) -
        peakY);

  return {
    x: clamp01(x),
    y: clamp01(y)
  };
}

export function getBallFollowThrough(
  shot,
  result,
  extraProgress
) {
  const t =
    Math.max(
      0,
      Math.min(
        1,
        extraProgress
      )
    );

  const start =
    shot.target;

  /* =====================
     GOAL
     ===================== */
  if (result.goal) {
    return {
      x:
        shot.target.x +
        shot.lateralCurve *
          1.8 *
          t,

      y:
        shot.target.y +
        0.12 * t
    };
  }

  /* =====================
     MISS
     ===================== */
  if (result.missed) {
    return {
      x:
        shot.target.x +
        shot.lateralCurve *
          2.4 *
          t,

      y:
        shot.target.y +
        0.18 * t
    };
  }

  /* =====================
     SAVE REBOUND
     ===================== */
  return {
    x:
      shot.target.x +
      (shot.target.x - 0.5) *
        0.22 *
        t,

    y:
      shot.target.y +
      0.08 * t
  };
}




/* =========================================================
   penaltyPhysics.js
   NUR resolveShot() KOMPLETT ERSETZEN
   ========================================================= */

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
    Math.hypot(dx, dy);

  /* =========================
     KEEPER TIMING
     ========================= */

  const timingBonus =
    keeperPose.progress >= 0.7
      ? 1
      : keeperPose.progress >=
        0.5
      ? 0.76
      : 0.48;

  /* =========================
     TOP CORNERS HARDER
     ========================= */

  const difficultyMultiplier =
    shot.zone ===
      PENALTY_ZONES.TOP_LEFT ||
    shot.zone ===
      PENALTY_ZONES.TOP_RIGHT
      ? 0.62
      : 1;

  /* =========================
     FAIRER SAVE RADIUS
     ========================= */

  const effectiveSaveRadius =
    keeperDecision.saveRadius *
    timingBonus *
    difficultyMultiplier *
    0.58;

  /* =========================
     REALISTIC GOAL FRAME
     ========================= */

  const insideGoalWidth =
    shot.target.x >= 0.24 &&
    shot.target.x <= 0.76;

  const insideGoalHeight =
    shot.target.y >= 0.25 &&
    shot.target.y <= 0.56;

  const validGoalZone =
    insideGoalWidth &&
    insideGoalHeight;

  /* =========================
     BALL REACHES LINE
     ========================= */

  const crossedLine =
    shot.target.y <= 0.56;

  /* =========================
     POWER FLOOR
     ========================= */

  const sufficientPower =
    shot.power >= 0.16;

  const validGoal =
    validGoalZone &&
    crossedLine &&
    sufficientPower;

  /* =========================
     WRONG SIDE DIVES MISS
     ========================= */

  const keeperWrongSide =
    (
      keeperDecision.direction ===
        "left" &&
      shot.target.x > 0.57
    ) ||
    (
      keeperDecision.direction ===
        "right" &&
      shot.target.x < 0.43
    );

  /* =========================
     CENTER JUMPS MISS CORNERS
     ========================= */

  const keeperOutmatched =
    keeperDecision.direction ===
      "center" &&
    (
      shot.target.x < 0.4 ||
      shot.target.x > 0.6
    );

  /* =========================
     SAVE CHECK
     ========================= */

  const keeperCanAttempt =
    !keeperWrongSide &&
    !keeperOutmatched;

  const rawSaved =
    keeperCanAttempt &&
    distance <=
      effectiveSaveRadius;

  const saved =
    rawSaved &&
    validGoal;

  const goal =
    !saved &&
    validGoal;

  const missed =
    !validGoal;

  /* =========================
     SAVE QUALITY
     ========================= */

  let saveQuality =
    "miss";

  if (saved) {
    if (
      distance <
      effectiveSaveRadius *
        0.34
    ) {
      saveQuality =
        "perfect";
    } else if (
      distance <
      effectiveSaveRadius *
        0.66
    ) {
      saveQuality =
        "strong";
    } else {
      saveQuality =
        "weak";
    }
  }

  return {
    saved,
    goal,
    missed,
    distance,
    saveQuality,
    effectiveSaveRadius,
    validGoal,
    keeperCanAttempt,
    insideGoalWidth,
    insideGoalHeight,
    crossedLine,
    sufficientPower,
    keeperWrongSide,
    keeperOutmatched
  };
}

/* =========================
   HELPERS
   ========================= */

function lerp(
  a,
  b,
  t
) {
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
