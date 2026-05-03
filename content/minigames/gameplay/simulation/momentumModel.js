// /gameplay/simulation/momentumModel.js

export class MomentumModel {
  constructor() {
    this.value = 0;

    this.eventWeights = {
      BALL_WIN: 0.12,
      BUILDUP_RIGHT: 0.08,
      BUILDUP_LEFT: 0.08,
      THROUGH_PASS: 0.18,
      SHOT: 0.12,
      SAVE: -0.08,
      BALL_LOSS: -0.14,
      INTERCEPTION: -0.12,
      FOUL: -0.06,
      YELLOW_CARD: -0.1,
      RED_CARD: -0.35,
      GOAL: 0.38,
      CONCEDED_GOAL: -0.38,
    };

    this.decayRate = 0.015;
    this.maxMomentum = 1;
    this.minMomentum = -1;
  }

  clamp(value) {
    return Math.max(
      this.minMomentum,
      Math.min(this.maxMomentum, value)
    );
  }

  getScorePressure(score = { home: 0, away: 0 }) {
    const diff = score.home - score.away;

    if (diff >= 2) return -0.03;
    if (diff === 1) return -0.015;

    if (diff <= -2) return 0.03;
    if (diff === -1) return 0.015;

    return 0;
  }

  getLateGameDrama(minute = 0) {
    if (minute >= 85) return 1.35;
    if (minute >= 70) return 1.2;
    if (minute >= 55) return 1.1;

    return 1;
  }

  applyDecay() {
    if (this.value > 0) {
      this.value = Math.max(0, this.value - this.decayRate);
    } else if (this.value < 0) {
      this.value = Math.min(0, this.value + this.decayRate);
    }
  }

  applyEvent(type, score = { home: 0, away: 0 }, minute = 0) {
    this.applyDecay();

    const baseWeight = this.eventWeights[type] || 0;

    const scorePressure = this.getScorePressure(score);

    const dramaMultiplier = this.getLateGameDrama(minute);

    const weightedImpact =
      (baseWeight + scorePressure) * dramaMultiplier;

    this.value += weightedImpact;

    this.value = this.clamp(this.value);

    return Number(this.value.toFixed(3));
  }

  getDominantSide() {
    if (this.value > 0.15) return "HOME";
    if (this.value < -0.15) return "AWAY";

    return null;
  }

  reset() {
    this.value = 0;
  }
}
