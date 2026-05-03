// /gameplay/render/gameplayCanvas.js
// Produktionsupgrade mit field.svg Background Support

export class GameplayCanvas {
  constructor(canvas, config, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.config = config;
    this.camera = camera;

    this.dpr = Math.min(2, window.devicePixelRatio || 1);

    this.trails = [];
    this.highlightPulse = null;

    // Existing SVG field asset
    this.fieldImage = new Image();
    this.fieldLoaded = false;

    this.fieldImage.onload = () => {
      this.fieldLoaded = true;
    };

    this.fieldImage.src = "/gfx/field.svg";

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const w = this.canvas.clientWidth || 360;
    const h = w / (this.config.canvasAspectRatio || (16 / 9));

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.width = w;
    this.height = h;

    this.pitch = {
      x: 0,
      y: 0,
      w: w,
      h: h,
    };
  }

  worldToScreen(x, y) {
    const { cx, cy, zoom } = this.camera;

    const viewW = 1 / zoom;
    const viewH = 1 / zoom;

    const left = cx - viewW / 2;
    const top = cy - viewH / 2;

    const nx = (x - left) / viewW;
    const ny = (y - top) / viewH;

    return {
      x: this.pitch.x + nx * this.pitch.w,
      y: this.pitch.y + ny * this.pitch.h,
    };
  }

  addTrail(from, to, type = "pass") {
    this.trails.push({
      from,
      to,
      type,
      life: 1,
    });
  }

  triggerHighlight(position) {
    this.highlightPulse = {
      x: position[0],
      y: position[1],
      life: 1,
    };
  }

  updateEffects() {
    this.trails.forEach((trail) => {
      trail.life -= 0.03;
    });

    this.trails = this.trails.filter((trail) => trail.life > 0);

    if (this.highlightPulse) {
      this.highlightPulse.life -= 0.04;

      if (this.highlightPulse.life <= 0) {
        this.highlightPulse = null;
      }
    }
  }

  renderPitch() {
    const ctx = this.ctx;

    // Background fallback
    ctx.fillStyle = this.config.theme.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Main field asset
    if (this.fieldLoaded) {
      ctx.drawImage(
        this.fieldImage,
        this.pitch.x,
        this.pitch.y,
        this.pitch.w,
        this.pitch.h
      );
    } else {
      // Fallback if SVG not loaded
      ctx.fillStyle = this.config.theme.pitch;
      ctx.fillRect(
        this.pitch.x,
        this.pitch.y,
        this.pitch.w,
        this.pitch.h
      );
    }

    // Zone overlays
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(
      this.pitch.w * 0.33,
      0,
      this.pitch.w * 0.34,
      this.pitch.h
    );

    // Pressure side overlays
    ctx.fillStyle = "rgba(255,80,80,0.015)";
    ctx.fillRect(this.pitch.w * 0.82, 0, this.pitch.w * 0.18, this.pitch.h);

    ctx.fillStyle = "rgba(80,80,255,0.015)";
    ctx.fillRect(0, 0, this.pitch.w * 0.18, this.pitch.h);
  }

  renderTrails() {
    const ctx = this.ctx;

    for (const trail of this.trails) {
      const from = this.worldToScreen(trail.from[0], trail.from[1]);
      const to = this.worldToScreen(trail.to[0], trail.to[1]);

      if (trail.type === "shot") {
        ctx.strokeStyle = `rgba(255,70,70,${trail.life})`;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = `rgba(255,255,255,${trail.life})`;
        ctx.lineWidth = 2;
      }

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  renderHighlight() {
    if (!this.highlightPulse) return;

    const ctx = this.ctx;
    const pulse = this.highlightPulse;
    const pos = this.worldToScreen(pulse.x, pulse.y);

    ctx.strokeStyle = `rgba(255,255,120,${pulse.life})`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
      pos.x,
      pos.y,
      12 + (1 - pulse.life) * 28,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  drawDot(x, y, color, radius = 6) {
    const ctx = this.ctx;
    const pos = this.worldToScreen(x, y);

    // Outer glow
    ctx.fillStyle = `${color}55`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Contrast outline
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  renderEntities(state) {
    const zoomScale = Math.max(0.8, Math.min(1.25, this.camera.zoom));

    state.home.forEach((p) =>
      this.drawDot(
        p.x,
        p.y,
        state.colors.home.color,
        5.5 * zoomScale
      )
    );

    state.away.forEach((p) =>
      this.drawDot(
        p.x,
        p.y,
        state.colors.away.color,
        5.5 * zoomScale
      )
    );

    this.drawDot(
      state.ball.x,
      state.ball.y,
      this.config.theme.ball,
      3.8 * zoomScale
    );
  }

  render(state) {
    this.updateEffects();

    this.renderPitch();
    this.renderTrails();
    this.renderEntities(state);
    this.renderHighlight();
  }
}
