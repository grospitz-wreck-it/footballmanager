export class GameLoop {
  constructor({ tickRate, onTick, onRender }) {
    this.tickMs = 1000 / tickRate;
    this.onTick = onTick;
    this.onRender = onRender;
    this.last = 0;
    this.acc = 0;
  }
  start() {
    const frame = (ts) => {
      if (!this.last) this.last = ts;
      const delta = ts - this.last;
      this.last = ts;
      this.acc += delta;
      while (this.acc >= this.tickMs) {
        this.onTick(this.tickMs / 1000);
        this.acc -= this.tickMs;
      }
      this.onRender();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
