import { PENALTY_ZONES } from './penaltyConfig.js';

const TARGET_MAP = {
  [PENALTY_ZONES.TOP_LEFT]: { x: 0.2, y: 0.28 },
  [PENALTY_ZONES.TOP_RIGHT]: { x: 0.8, y: 0.28 },
  [PENALTY_ZONES.BOTTOM_LEFT]: { x: 0.2, y: 0.76 },
  [PENALTY_ZONES.BOTTOM_RIGHT]: { x: 0.8, y: 0.76 },
  [PENALTY_ZONES.CENTER]: { x: 0.5, y: 0.5 }
};

export function calculateShot(input, config) {
  const physics = config.physics;
  const zone = input.zone;
  const targetBase = TARGET_MAP[zone] || TARGET_MAP[PENALTY_ZONES.CENTER];
  const jitter = physics.errorJitter * (1 - input.power);
  const target = {
    x: clamp01(targetBase.x + (Math.random() * 2 - 1) * jitter),
    y: clamp01(targetBase.y + (Math.random() * 2 - 1) * jitter)
  };
  const durationMs = lerp(physics.shotDurationMaxMs, physics.shotDurationMinMs, input.power);

  return {
    zone,
    power: input.power,
    target,
    durationMs,
    curveHeight: 0.18 + input.power * 0.25
  };
}

export function getBallPosition(shot, progress) {
  const t = clamp01(progress);
  const start = { x: 0.5, y: 0.96 };
  const end = shot.target;
  const peakY = Math.min(start.y, end.y) - shot.curveHeight;

  const x = lerp(start.x, end.x, t);
  const yLinear = lerp(start.y, end.y, t);
  const arc = 4 * t * (1 - t);
  const y = yLinear - arc * (Math.min(start.y, end.y) - peakY);

  return { x, y };
}

export function resolveShot(shot, keeperPose, keeperDecision) {
  const dx = shot.target.x - keeperPose.x;
  const dy = shot.target.y - keeperPose.y;
  const distance = Math.hypot(dx, dy);
  const saved = keeperPose.progress >= 0.2 && distance <= keeperDecision.saveRadius;
  return { saved, goal: !saved, distance };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
