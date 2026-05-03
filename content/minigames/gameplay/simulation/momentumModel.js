export class MomentumModel {
  constructor() { this.value = 0; }
  applyEvent(type) {
    if (type === 'BALL_WIN') this.value += 0.15;
    if (type === 'BUILDUP_RIGHT') this.value += 0.1;
    if (type === 'THROUGH_PASS') this.value += 0.2;
    if (type === 'SHOT') this.value += 0.1;
    if (type === 'GOAL') this.value += 0.35;
    this.value = Math.max(-1, Math.min(1, this.value));
    return this.value;
  }
}
