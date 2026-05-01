import { getKeeperCurve, sampleCurve } from './keeperSpline.js';

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function zoneToDirection(zone) {
  if (!zone) return 'center';
  if (zone.includes('left')) return 'left';
  if (zone.includes('right')) return 'right';
  return 'center';
}

export class KeeperAI {
  constructor(config) {
    this.config = config;
    this.difficulty = config.difficulty;
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  decide(shotIntent) {
    const keeperCfg = this.config.keeper;
    const diff = this.difficulty;
    const anticipation = keeperCfg.anticipationWeight[diff];
    const shouldRead = Math.random() < anticipation;
    const direction = shouldRead ? zoneToDirection(shotIntent.zone) : this.randomDirection();
    const reactionMs = randomRange(...keeperCfg.reactionMs[diff]);

    return {
      direction,
      reactionMs,
      diveSpeed: keeperCfg.diveSpeed[diff],
      saveRadius: keeperCfg.saveRadius[diff]
    };
  }

  randomDirection() {
    const roll = Math.random();
    if (roll < 0.33) return 'left';
    if (roll < 0.66) return 'right';
    return 'center';
  }

  computePose(decision, elapsedMs, shotDurationMs) {
    const progress = Math.max(0, Math.min(1, (elapsedMs - decision.reactionMs) / (shotDurationMs / decision.diveSpeed)));
    const curve = getKeeperCurve(decision.direction);
    return {
      progress,
      ...sampleCurve(curve, progress)
    };
  }
}
