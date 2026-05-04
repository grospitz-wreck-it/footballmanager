import { PENALTY_ZONES } from './penaltyConfig.js';

/* =========================
   ADVANCED PENALTY INPUT SYSTEM
   - präzisere Swipe-Erkennung
   - bessere Power-Kurve
   - Deadzone
   - realistischere Zielwahl
   - immersive Arcade-Control
   ========================= */

export class PenaltyInput {
  constructor(root, config) {
    this.root = root;
    this.config = config;

    this.activePointer = null;
    this.bindings = [];

    this.lastAimPreview = null;
  }

  /* =========================
     MOUNT
     ========================= */

  mount(onShot) {
    this.unmount();
   this.locked = false;
     
    const onPointerDown = (event) => {
      if (this.activePointer) return;

      this.root.setPointerCapture?.(
        event.pointerId
      );

      this.activePointer = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        startTime: performance.now()
      };
    };

    const onPointerMove = (event) => {
      if (
        !this.activePointer ||
        event.pointerId !==
          this.activePointer.id
      )
        return;

      this.activePointer.currentX =
        event.clientX;

      this.activePointer.currentY =
        event.clientY;
    };

   const commitShot = (event) => {
  /* =========================
     HARD LOCK
     verhindert Mehrfachschüsse
     ========================= */
  if (this.locked) return;

  /* =========================
     POINTER VALIDATION
     ========================= */
  if (
    !this.activePointer ||
    event.pointerId !== this.activePointer.id
  ) {
    return;
  }

  /* =========================
     LOCK INPUT SOFORT
     ========================= */
  this.locked = true;

  /* =========================
     INPUT DATA
     ========================= */
  const elapsed =
    performance.now() -
    this.activePointer.startTime;

  const dx =
    event.clientX -
    this.activePointer.startX;

  const dy =
    event.clientY -
    this.activePointer.startY;

  const swipeDistance =
    Math.hypot(dx, dy);

  const swipeAngle =
    Math.atan2(dy, dx);

  /* =========================
     POWER
     ========================= */
  const power = this.computePower(
    elapsed,
    swipeDistance,
    dy
  );

  /* =========================
     TARGET ZONE
     ========================= */
  const zone = this.detectZone(
    dx,
    dy,
    event.clientX,
    event.clientY
  );

  /* =========================
     FINAL SHOT OBJECT
     ========================= */
  const shotData = {
    power,
    zone,
    elapsed,
    swipeDistance,
    swipeAngle,
    dx,
    dy,
  };

  /* =========================
     CLEANUP
     ========================= */
  this.activePointer = null;

  this.unmount();

  /* =========================
     FIRE SHOT
     ========================= */
  onShot(shotData);
};

    const onPointerUp = (event) =>
      commitShot(event);

    const onPointerCancel = () => {
      this.activePointer = null;
    };

    this.addBinding(
      'pointerdown',
      onPointerDown
    );

    this.addBinding(
      'pointermove',
      onPointerMove
    );

    this.addBinding(
      'pointerup',
      onPointerUp
    );

    this.addBinding(
      'pointercancel',
      onPointerCancel
    );

    this.addBinding(
      'lostpointercapture',
      onPointerCancel
    );
  }

  /* =========================
     HELPERS
     ========================= */

  addBinding(type, handler) {
    this.root.addEventListener(
      type,
      handler
    );

    this.bindings.push([
      type,
      handler
    ]);
  }

  unmount() {
    this.bindings.forEach(
      ([type, handler]) => {
        this.root.removeEventListener(
          type,
          handler
        );
      }
    );

    this.bindings.length = 0;
    this.activePointer = null;
  }

  /* =========================
     POWER SYSTEM
     ========================= */

  computePower(
    holdMs,
    swipeDistance,
    verticalDelta
  ) {
    const physics =
      this.config.physics;

    /* Hold contributes charge */
    const holdPower =
      holdMs /
      physics.holdToPowerScale;

    /* Swipe distance */
    const swipePower =
      swipeDistance /
      physics.swipeToPowerScale;

    /* Upward swipe bonus */
    const liftBonus =
      Math.max(
        0,
        -verticalDelta
      ) / 400;

    /* Deadzone */
    const deadzonePenalty =
      swipeDistance < 18
        ? 0.55
        : 1;

    /* Weighted arcade blend */
    let blended =
      holdPower * 0.28 +
      swipePower * 0.52 +
      liftBonus * 0.20;

    blended *= deadzonePenalty;

    /* Slight skill curve */
    blended = easeOutQuad(blended);

    return clamp(
      blended,
      physics.minPower,
      physics.maxPower
    );
  }

  /* =========================
     TARGETING SYSTEM
     ========================= */

  detectZone(
    dx,
    dy,
    clientX,
    clientY
  ) {
    const rect =
      this.root.getBoundingClientRect();

    const normalizedX =
      (clientX - rect.left) /
      rect.width;

    const normalizedY =
      (clientY - rect.top) /
      rect.height;

    const horizontalBias = dx;
    const verticalBias = dy;

    /* Aggressive upward shots */
    const isTopShot =
      verticalBias < -25 ||
      normalizedY < 0.48;

    const isBottomShot =
      verticalBias >= -25 &&
      normalizedY >= 0.48;

    const isLeft =
      horizontalBias < -18 ||
      normalizedX < 0.38;

    const isRight =
      horizontalBias > 18 ||
      normalizedX > 0.62;

    /* Top corners */
    if (isTopShot && isLeft) {
      return PENALTY_ZONES.TOP_LEFT;
    }

    if (isTopShot && isRight) {
      return PENALTY_ZONES.TOP_RIGHT;
    }

    /* Bottom corners */
    if (isBottomShot && isLeft) {
      return PENALTY_ZONES.BOTTOM_LEFT;
    }

    if (isBottomShot && isRight) {
      return PENALTY_ZONES.BOTTOM_RIGHT;
    }

    return PENALTY_ZONES.CENTER;
  }
}

/* =========================
   UTILITIES
   ========================= */

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}
