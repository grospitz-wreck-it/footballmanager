import { PENALTY_ZONES } from './penaltyConfig.js';

export class PenaltyInput {
  constructor(root, config) {
    this.root = root;
    this.config = config;
    this.activePointer = null;
    this.bindings = [];
  }

  mount(onShot) {
    const onPointerDown = (event) => {
      if (this.activePointer) return;
      this.root.setPointerCapture?.(event.pointerId);
      this.activePointer = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: performance.now()
      };
    };

    const commitShot = (event) => {
      if (!this.activePointer || event.pointerId !== this.activePointer.id) return;
      const elapsed = performance.now() - this.activePointer.startTime;
      const dx = event.clientX - this.activePointer.startX;
      const dy = event.clientY - this.activePointer.startY;
      const swipeDistance = Math.hypot(dx, dy);
      const power = this.computePower(elapsed, swipeDistance);
      const zone = this.detectZone(event.clientX, event.clientY);
      this.activePointer = null;
      onShot({ power, zone, elapsed, swipeDistance });
    };

    const onPointerUp = (event) => commitShot(event);
    const onPointerCancel = () => {
      this.activePointer = null;
    };

    this.root.addEventListener('pointerdown', onPointerDown);
    this.root.addEventListener('pointerup', onPointerUp);
    this.root.addEventListener('pointercancel', onPointerCancel);
    this.root.addEventListener('lostpointercapture', onPointerCancel);
    this.bindings.push(
      ['pointerdown', onPointerDown],
      ['pointerup', onPointerUp],
      ['pointercancel', onPointerCancel],
      ['lostpointercapture', onPointerCancel]
    );
  }

  unmount() {
    this.bindings.forEach(([type, handler]) => this.root.removeEventListener(type, handler));
    this.bindings.length = 0;
    this.activePointer = null;
  }

  computePower(holdMs, swipeDistance) {
    const physics = this.config.physics;
    const holdPower = holdMs / physics.holdToPowerScale;
    const swipePower = swipeDistance / physics.swipeToPowerScale;
    const blended = holdPower * 0.4 + swipePower * 0.6;
    return Math.max(physics.minPower, Math.min(physics.maxPower, blended));
  }

  detectZone(clientX, clientY) {
    const rect = this.root.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (x < 0.35 && y < 0.5) return PENALTY_ZONES.TOP_LEFT;
    if (x > 0.65 && y < 0.5) return PENALTY_ZONES.TOP_RIGHT;
    if (x < 0.35 && y >= 0.5) return PENALTY_ZONES.BOTTOM_LEFT;
    if (x > 0.65 && y >= 0.5) return PENALTY_ZONES.BOTTOM_RIGHT;
    return PENALTY_ZONES.CENTER;
  }
}
