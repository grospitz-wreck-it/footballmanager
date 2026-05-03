// /gameplay/render/interpolationEngine.js

/**
 * Interpolation Engine V1.2
 *
 * Ziel:
 * Flüssigere Spieler- und Ballbewegungen
 * zwischen MatchState-Updates.
 *
 * Noch isoliert:
 * Keine Main-App Integration.
 */

export class InterpolationEngine {
  constructor() {
    this.previousState = null;
    this.currentState = null;
    this.alpha = 0;
  }

  cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  capture(state) {
    if (!this.currentState) {
      this.currentState = this.cloneState(state);
      this.previousState = this.cloneState(state);
      return;
    }

    this.previousState = this.cloneState(this.currentState);
    this.currentState = this.cloneState(state);
  }

  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  interpolatePlayer(prev, curr) {
    return {
      ...curr,
      x: this.lerp(prev.x, curr.x, this.alpha),
      y: this.lerp(prev.y, curr.y, this.alpha),
    };
  }

  interpolateBall(prev, curr) {
    return {
      ...curr,
      x: this.lerp(prev.x, curr.x, this.alpha),
      y: this.lerp(prev.y, curr.y, this.alpha),
    };
  }

  getInterpolatedState() {
    if (!this.previousState || !this.currentState) {
      return this.currentState;
    }

    return {
      ...this.currentState,

      home: this.currentState.home.map((player, i) =>
        this.interpolatePlayer(
          this.previousState.home[i],
          player
        )
      ),

      away: this.currentState.away.map((player, i) =>
        this.interpolatePlayer(
          this.previousState.away[i],
          player
        )
      ),

      ball: this.interpolateBall(
        this.previousState.ball,
        this.currentState.ball
      ),
    };
  }

  reset() {
    this.previousState = null;
    this.currentState = null;
    this.alpha = 0;
  }
}
