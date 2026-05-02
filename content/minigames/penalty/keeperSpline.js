/* =========================================================
   keeperSpline.js – FULL DROP-IN REPLACEMENT
   Keeper bleibt IM Torbereich
   keine unrealistischen Flüge aus dem Tor
   ========================================================= */

const BASE_CURVES = {
  left: [
    { x: 0.50, y: 0.355, rotation: 0, stretch: 1.00 },

    { x: 0.48, y: 0.352, rotation: -3, stretch: 1.02 },

    { x: 0.44, y: 0.348, rotation: -7, stretch: 1.06 },

    { x: 0.38, y: 0.344, rotation: -12, stretch: 1.12 },

    { x: 0.31, y: 0.340, rotation: -18, stretch: 1.18 },

    { x: 0.24, y: 0.336, rotation: -22, stretch: 1.22 }
  ],

  right: [
    { x: 0.50, y: 0.355, rotation: 0, stretch: 1.00 },

    { x: 0.52, y: 0.352, rotation: 3, stretch: 1.02 },

    { x: 0.56, y: 0.348, rotation: 7, stretch: 1.06 },

    { x: 0.62, y: 0.344, rotation: 12, stretch: 1.12 },

    { x: 0.69, y: 0.340, rotation: 18, stretch: 1.18 },

    { x: 0.76, y: 0.336, rotation: 22, stretch: 1.22 }
  ],

  center: [
    { x: 0.50, y: 0.355, rotation: 0, stretch: 1.00 },

    { x: 0.50, y: 0.350, rotation: 0, stretch: 1.03 },

    { x: 0.50, y: 0.345, rotation: 0, stretch: 1.08 },

    { x: 0.50, y: 0.338, rotation: 0, stretch: 1.14 }
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

function smoothStep(
  t
) {
  return (
    t *
    t *
    (3 - 2 * t)
  );
}

function easeOutCubic(
  t
) {
  return (
    1 -
    Math.pow(
      1 - t,
      3
    )
  );
}
