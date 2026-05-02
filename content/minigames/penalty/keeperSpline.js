/* =========================
   ADVANCED KEEPER SPLINE SYSTEM
   - cineastischere Dives
   - explosiver Launch
   - realistischere Torwartbewegung
   - Overshoot
   - bessere Save-Dynamik
   - Sprite-ready Pose Data
   ========================= */

const BASE_CURVES = {
  left: [
    { x: 0.50, y: 0.355, rotation: 0, stretch: 1.00 },

    { x: 0.48, y: 0.348, rotation: -4, stretch: 1.02 },

    { x: 0.42, y: 0.338, rotation: -9, stretch: 1.08 },

    { x: 0.31, y: 0.320, rotation: -18, stretch: 1.18 },

    { x: 0.20, y: 0.302, rotation: -28, stretch: 1.26 },

    { x: 0.14, y: 0.292, rotation: -36, stretch: 1.32 }
  ],

  right: [
    { x: 0.50, y: 0.355, rotation: 0, stretch: 1.00 },

    { x: 0.52, y: 0.348, rotation: 4, stretch: 1.02 },

    { x: 0.58, y: 0.338, rotation: 9, stretch: 1.08 },

    { x: 0.69, y: 0.320, rotation: 18, stretch: 1.18 },

    { x: 0.80, y: 0.302, rotation: 28, stretch: 1.26 },

    { x: 0.86, y: 0.292, rotation: 36, stretch: 1.32 }
  ],

  center: [
    { x: 0.50, y: 0.355, rotation: 0, stretch: 1.00 },

    { x: 0.50, y: 0.348, rotation: 0, stretch: 1.03 },

    { x: 0.50, y: 0.338, rotation: 0, stretch: 1.08 },

    { x: 0.50, y: 0.324, rotation: 0, stretch: 1.14 },

    { x: 0.50, y: 0.308, rotation: 0, stretch: 1.20 }
  ]
};

/* =========================
   CURVE ACCESS
   ========================= */

export function getKeeperCurve(
  direction = 'center'
) {
  return BASE_CURVES[direction]
    ? [...BASE_CURVES[direction]]
    : [...BASE_CURVES.center];
}

/* =========================
   CURVE SAMPLING
   ========================= */

export function sampleCurve(
  curve,
  t
) {
  const clamped = clamp01(t);

  /* Explosive launch feel */
  const eased =
    easeOutCubic(clamped);

  const segCount =
    curve.length - 1;

  const scaledT =
    eased * segCount;

  const seg = Math.min(
    segCount - 1,
    Math.floor(scaledT)
  );

  const localT =
    scaledT - seg;

  const p0 = curve[seg];
  const p1 = curve[seg + 1];

  /* Smooth interpolation */
  const x = lerp(
    p0.x,
    p1.x,
    smoothStep(localT)
  );

  const y = lerp(
    p0.y,
    p1.y,
    smoothStep(localT)
  );

  const rotation = lerp(
    p0.rotation || 0,
    p1.rotation || 0,
    smoothStep(localT)
  );

  const stretch = lerp(
    p0.stretch || 1,
    p1.stretch || 1,
    smoothStep(localT)
  );

  return {
    x,
    y,
    rotation,
    stretch,
    progress: clamped
  };
}

/* =========================
   OPTIONAL RECOVERY CURVE
   ========================= */

export function getRecoveryPose(
  pose,
  recoveryT
) {
  const t =
    easeOutQuad(clamp01(recoveryT));

  return {
    x: lerp(pose.x, 0.5, t),
    y: lerp(pose.y, 0.355, t),
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
