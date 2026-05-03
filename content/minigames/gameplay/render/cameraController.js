// /gameplay/render/cameraController.js

export class CameraController {
  constructor() {
    this.cx = 0.5;
    this.cy = 0.5;
    this.zoom = 1;

    this.targetCx = 0.5;
    this.targetCy = 0.5;
    this.targetZoom = 1;

    this.lerpSpeed = 0.08;

    this.presets = {
      OVERVIEW: [0.5, 0.5, 1],
      BUILDUP: [0.42, 0.5, 1.08],
      FINAL_THIRD: [0.72, 0.5, 1.22],
      BOX_ZOOM: [0.88, 0.5, 1.42],
      COUNTER_LEFT: [0.3, 0.5, 1.12],
      COUNTER_RIGHT: [0.7, 0.5, 1.12],
    };

    this.recoveryTimer = 0;
    this.defaultRecoveryTime = 2.2;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  setFocus([cx, cy, zoom], recoveryTime = this.defaultRecoveryTime) {
    this.targetCx = this.clamp(cx, 0.05, 0.95);
    this.targetCy = this.clamp(cy, 0.15, 0.85);
    this.targetZoom = this.clamp(zoom, 1, 1.6);

    this.recoveryTimer = recoveryTime;
  }

  usePreset(name, recoveryTime) {
    const preset = this.presets[name];
    if (!preset) return;

    this.setFocus(preset, recoveryTime);
  }

  triggerEventFocus(eventType) {
    switch (eventType) {
      case "BALL_WIN":
        this.usePreset("BUILDUP");
        break;

      case "BUILDUP_RIGHT":
      case "THROUGH_PASS":
        this.usePreset("FINAL_THIRD");
        break;

      case "SHOT":
        this.usePreset("BOX_ZOOM", 2.8);
        break;

      case "GOAL":
        this.usePreset("BOX_ZOOM", 3.5);
        break;

      default:
        this.usePreset("OVERVIEW");
        break;
    }
  }

  update(dt) {
    this.cx = this.lerp(this.cx, this.targetCx, this.lerpSpeed);
    this.cy = this.lerp(this.cy, this.targetCy, this.lerpSpeed);
    this.zoom = this.lerp(this.zoom, this.targetZoom, this.lerpSpeed);

    if (this.recoveryTimer > 0) {
      this.recoveryTimer -= dt;

      if (this.recoveryTimer <= 0) {
        this.targetCx = this.presets.OVERVIEW[0];
        this.targetCy = this.presets.OVERVIEW[1];
        this.targetZoom = this.presets.OVERVIEW[2];
      }
    }
  }

  getState() {
    return {
      cx: this.cx,
      cy: this.cy,
      zoom: this.zoom,
    };
  }

  reset() {
    this.cx = 0.5;
    this.cy = 0.5;
    this.zoom = 1;

    this.targetCx = 0.5;
    this.targetCy = 0.5;
    this.targetZoom = 1;

    this.recoveryTimer = 0;
  }
}
