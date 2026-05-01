const BASE_CURVES = {
  left: [
    { x: 0.5, y: 0.34 },
    { x: 0.44, y: 0.33 },
    { x: 0.3, y: 0.31 },
    { x: 0.16, y: 0.29 }
  ],

  right: [
    { x: 0.5, y: 0.34 },
    { x: 0.56, y: 0.33 },
    { x: 0.7, y: 0.31 },
    { x: 0.84, y: 0.29 }
  ],

  center: [
    { x: 0.5, y: 0.34 },
    { x: 0.5, y: 0.335 },
    { x: 0.5, y: 0.325 },
    { x: 0.5, y: 0.315 }
  ]
};

export function getKeeperCurve(direction = 'center') {
  return BASE_CURVES[direction] ? [...BASE_CURVES[direction]] : [...BASE_CURVES.center];
}

export function sampleCurve(curve, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const segCount = curve.length - 1;
  const seg = Math.min(segCount - 1, Math.floor(clamped * segCount));
  const localT = clamped * segCount - seg;
  const p0 = curve[seg];
  const p1 = curve[seg + 1];
  return {
    x: p0.x + (p1.x - p0.x) * localT,
    y: p0.y + (p1.y - p0.y) * localT
  };
}
