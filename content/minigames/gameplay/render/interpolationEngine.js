// /gameplay/render/interpolationEngine.js
// Phase 1.5 Upgrade: echte Spielerbewegung + Formation Shift

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

  smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  interpolatePlayer(prev, curr) {
    const t = this.smoothStep(this.alpha);

    return {
      ...curr,
      x: this.lerp(prev.x, curr.x, t),
      y: this.lerp(prev.y, curr.y, t),
    };
  }

  interpolateBall(prev, curr) {
    const t = this.smoothStep(this.alpha);

    return {
      ...curr,
      x: this.lerp(prev.x, curr.x, t),
      y: this.lerp(prev.y, curr.y, t),
    };
  }

  applyDynamicShape(players, side, phase, possession) {
    return players.map((player) => {
      let targetX = player.x;
      let targetY = player.y;

      const attacking =
        (side === "home" && possession === "HOME") ||
        (side === "away" && possession === "AWAY");

      switch (phase) {
        case "BUILDUP_RIGHT":
          targetX += attacking
            ? side === "home"
              ? 0.025
              : -0.025
            : 0;

          targetY += player.role.includes("R")
            ? 0.035
            : player.role.includes("L")
            ? -0.01
            : 0;
          break;

        case "BUILDUP_LEFT":
          targetX += attacking
            ? side === "home"
              ? 0.025
              : -0.025
            : 0;

          targetY += player.role.includes("L")
            ? -0.035
            : player.role.includes("R")
            ? 0.01
            : 0;
          break;

        case "THROUGH_PASS":
          targetX += attacking
            ? side === "home"
              ? 0.045
              : -0.045
            : 0;
          break;

        case "SHOT":
        case "BIG_CHANCE":
          targetX += attacking
            ? side === "home"
              ? 0.06
              : -0.06
            : 0;
          break;

        case "BALL_LOSS":
        case "INTERCEPTION":
          targetX += attacking
            ? side === "home"
              ? -0.04
              : 0.04
            : 0;
          break;
      }

      return {
        ...player,
        x: Math.max(0.02, Math.min(0.98, targetX)),
        y: Math.max(0.05, Math.min(0.95, targetY)),
      };
    });
  }

  getInterpolatedState() {
    if (!this.previousState || !this.currentState) {
      return this.currentState;
    }

    const phase = this.currentState.phase;
    const possession =
      this.currentState.metadata?.possession || "HOME";

    const shapedHome = this.applyDynamicShape(
      this.currentState.home,
      "home",
      phase,
      possession
    );

    const shapedAway = this.applyDynamicShape(
      this.currentState.away,
      "away",
      phase,
      possession
    );

    return {
      ...this.currentState,

      home: shapedHome.map((player, i) =>
        this.interpolatePlayer(
          this.previousState.home[i],
          player
        )
      ),

      away: shapedAway.map((player, i) =>
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
