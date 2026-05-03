// /gameplay/dev/debugOverlay.js

/**
 * DebugOverlay V1.2
 *
 * Ziel:
 * Produktionsnahes Entwickler-Debugging
 * ohne Einfluss auf Live-Systeme.
 */

export class DebugOverlay {
  constructor(container) {
    this.container = container;
    this.enabled = true;

    this.metrics = {
      fps: 0,
      tickRate: 0,
      phase: "INIT",
      possession: "HOME",
      sequence: 0,
      momentum: 0,
      score: "0:0",
    };

    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = 0;
  }

  setEnabled(value) {
    this.enabled = value;

    if (!value && this.container) {
      this.container.style.display = "none";
    }

    if (value && this.container) {
      this.container.style.display = "block";
    }
  }

  trackFrame() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;

    this.lastFrameTime = now;

    this.frameCount++;
    this.fpsTimer += delta;

    if (this.fpsTimer >= 500) {
      this.metrics.fps = Math.round(
        (this.frameCount / this.fpsTimer) * 1000
      );

      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  updateMatchState(state, tickRate = 0) {
    if (!state) return;

    this.metrics.tickRate = tickRate;
    this.metrics.phase = state.phase;
    this.metrics.possession =
      state.metadata?.possession || "N/A";

    this.metrics.sequence =
      state.metadata?.sequenceStep || 0;

    this.metrics.momentum =
      state.momentum?.value?.toFixed(2) || 0;

    this.metrics.score = `${state.score.home}:${state.score.away}`;
  }

  render() {
    if (!this.enabled || !this.container) return;

    this.container.innerHTML = `
      FPS: ${this.metrics.fps}<br/>
      TickRate: ${this.metrics.tickRate}<br/>
      Phase: ${this.metrics.phase}<br/>
      Possession: ${this.metrics.possession}<br/>
      Sequence: ${this.metrics.sequence}<br/>
      Momentum: ${this.metrics.momentum}<br/>
      Score: ${this.metrics.score}
    `;
  }

  tick(state, tickRate) {
    this.trackFrame();
    this.updateMatchState(state, tickRate);
    this.render();
  }
}
