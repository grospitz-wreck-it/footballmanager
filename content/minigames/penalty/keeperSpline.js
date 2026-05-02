/* =========================================================
   keeperSpline.js – PHASE 2 PRODUCTION UPGRADE
   Neue Splines:
   - preShot
   - lowDive
   - highDive
   - recovery
   ========================================================= */

/* =========================
   PRE-SHOT SHUFFLE
   ========================= */

const PRE_SHOT_CURVES = {
  left: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.495, y: 0.462, rotation: -1, stretch: 1.01 },
    { x: 0.49, y: 0.46, rotation: -2, stretch: 1.02 }
  ],

  right: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.505, y: 0.462, rotation: 1, stretch: 1.01 },
    { x: 0.51, y: 0.46, rotation: 2, stretch: 1.02 }
  ],

  center: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.50, y: 0.458, rotation: 0, stretch: 1.02 },
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 }
  ]
};

/* =========================
   LOW DIVES
   ========================= */

const LOW_DIVE_CURVES = {
  left: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.47, y: 0.462, rotation: -5, stretch: 1.04 },
    { x: 0.41, y: 0.468, rotation: -12, stretch: 1.12 },
    { x: 0.34, y: 0.475, rotation: -20, stretch: 1.18 }
  ],

  right: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.53, y: 0.462, rotation: 5, stretch: 1.04 },
    { x: 0.59, y: 0.468, rotation: 12, stretch: 1.12 },
    { x: 0.66, y: 0.475, rotation: 20, stretch: 1.18 }
  ]
};

/* =========================
   HIGH DIVES
   ========================= */

const HIGH_DIVE_CURVES = {
  left: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.48, y: 0.44, rotation: -4, stretch: 1.05 },
    { x: 0.42, y: 0.41, rotation: -10, stretch: 1.14 },
    { x: 0.34, y: 0.37, rotation: -18, stretch: 1.24 }
  ],

  right: [
    { x: 0.50, y: 0.46, rotation: 0, stretch: 1.00 },
    { x: 0.52, y: 0.44, rotation: 4, stretch: 1.05 },
    { x: 0.58, y: 0.41, rotation: 10, stretch: 1.14 },
    { x: 0.66, y: 0.37, rotation: 18, stretch: 1.24 }
  ]
};

/* =========================
   RECOVERY
   ========================= */

export function getRecoveryPose(
  pose,
  recoveryT
) {
  const t =
    easeOutQuad(
      clamp01(recoveryT)
    );

  return {
    x: lerp(
      pose.x,
      0.5,
      t
    ),

    y: lerp(
      pose.y,
      0.46,
      t
    ),

    rotation: lerp(
      pose.rotation || 0,
      0,
      t
    ),

    stretch: lerp(
      pose.stretch || 1,
      1,
      t
    ),

    progress: 1
  };
}

/* =========================
   CURVE PICKER
   ========================= */

export function getKeeperCurve(
  direction = 'center',
  shotHeight = 'mid',
  phase = 'dive'
) {
  if (phase === 'pre') {
    return PRE_SHOT_CURVES[
      direction
    ] ||
      PRE_SHOT_CURVES.center;
  }

  if (phase === 'dive') {
    if (shotHeight === 'low') {
      return LOW_DIVE_CURVES[
        direction
      ];
    }

    if (shotHeight === 'high') {
      return HIGH_DIVE_CURVES[
        direction
      ];
    }
  }

  return HIGH_DIVE_CURVES[
    direction
  ] ||
    PRE_SHOT_CURVES.center;
}

/* =========================
   SAMPLE CURVE
   ========================= */

export function sampleCurve(
  curve,
  t
) {
  const clamped =
    clamp01(t);

  const eased =
    easeOutCubic(
      clamped
    );

  const segCount =
    curve.length - 1;

  const scaledT =
    eased * segCount;

  const seg = Math.min(
    segCount - 1,
    Math.floor(
      scaledT
    )
  );

  const localT =
    scaledT - seg;

  const p0 =
    curve[seg];

  const p1 =
    curve[seg + 1];

  const smoothT =
    smoothStep(
      localT
    );

  return {
    x: lerp(
      p0.x,
      p1.x,
      smoothT
    ),

    y: lerp(
      p0.y,
      p1.y,
      smoothT
    ),

    rotation: lerp(
      p0.rotation || 0,
      p1.rotation || 0,
      smoothT
    ),

    stretch: lerp(
      p0.stretch || 1,
      p1.stretch || 1,
      smoothT
    ),

    progress: clamped
  };
}

/* =========================
   HELPERS
   ========================= */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}
