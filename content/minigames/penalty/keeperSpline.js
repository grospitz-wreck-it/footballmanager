const BASE_CURVES = {
  left: [
    { x: 0.5, y: 0.9 },
    { x: 0.46, y: 0.8 },
    { x: 0.3, y: 0.56 },
    { x: 0.16, y: 0.46 }
  ],
  right: [
    { x: 0.5, y: 0.9 },
    { x: 0.54, y: 0.8 },
    { x: 0.7, y: 0.56 },
    { x: 0.84, y: 0.46 }
  ],
  center: [
    { x: 0.5, y: 0.9 },
    { x: 0.5, y: 0.78 },
    { x: 0.5, y: 0.62 },
    { x: 0.5, y: 0.5 }
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
