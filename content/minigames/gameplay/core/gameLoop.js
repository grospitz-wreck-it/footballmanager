// /gameplay/core/gameLoop.js

/**
 * GameLoop V1.3
 *
 * Hybrid:
 * - Fixed simulation tick
 * - Smooth render
 * - Interpolation support
 * - Performance safe
 */

export class GameLoop {
  constructor({
    tickRate = 12,
    onTick,
    onRender,
    interpolationEngine = null,
    debugOverlay = null,
  }) {
    this.tickRate = tickRate;
    this.tickMs = 1000 / tickRate;

    this.onTick = onTick;
    this.onRender = onRender;

    this.interpolationEngine = interpolationEngine;
    this.debugOverlay = debugOverlay;

    this.last = 0;
    this.acc = 0;

    this.running = false;
    this.rafId = null;
  }

  start() {
    if (this.running) return;

    this.running = true;

    const frame = (ts) => {
      if (!this.running) return;

      if (!this.last) {
        this.last = ts;
      }

      let delta = ts - this.last;

      // Safety clamp against tab freeze spikes
      delta = Math.min(delta, 100);

      this.last = ts;
      this.acc += delta;

      while (this.acc >= this.tickMs) {
        if (this.onTick) {
          this.onTick(this.tickMs / 1000);
        }

        this.acc -= this.tickMs;
      }

      // Interpolation alpha
      if (this.interpolationEngine) {
        this.interpolationEngine.setAlpha(
          this.acc / this.tickMs
        );
      }

      if (this.onRender) {
        this.onRender();
      }

      if (this.debugOverlay) {
        this.debugOverlay.tick(
          null,
          this.tickRate
        );
      }

      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  reset() {
    this.last = 0;
    this.acc = 0;
  }

  setTickRate(rate) {
    this.tickRate = rate;
    this.tickMs = 1000 / rate;
  }

  isRunning() {
    return this.running;
  }
}
