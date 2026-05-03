// /gameplay/render/trailRenderer.js

/**
 * TrailRenderer V1.2
 *
 * Ziel:
 * Modularisierte Pass-, Schuss- und Highlight-Linien
 * für produktionsnähere Visualisierung.
 */

export class TrailRenderer {
  constructor() {
    this.trails = [];
  }

  addTrail({
    from,
    to,
    type = "pass",
    color = null,
    life = 1,
    width = null,
  }) {
    this.trails.push({
      from,
      to,
      type,
      color,
      width,
      life,
    });
  }

  update() {
    this.trails.forEach((trail) => {
      trail.life -= this.getDecayRate(trail.type);
    });

    this.trails = this.trails.filter(
      (trail) => trail.life > 0
    );
  }

  getDecayRate(type) {
    switch (type) {
      case "shot":
        return 0.045;

      case "highlight":
        return 0.035;

      case "pass":
      default:
        return 0.03;
    }
  }

  getTrailStyle(trail) {
    if (trail.color) {
      return {
        color: trail.color,
        width: trail.width || 2,
      };
    }

    switch (trail.type) {
      case "shot":
        return {
          color: `rgba(255,70,70,${trail.life})`,
          width: trail.width || 3,
        };

      case "highlight":
        return {
          color: `rgba(255,230,120,${trail.life})`,
          width: trail.width || 4,
        };

      case "pass":
      default:
        return {
          color: `rgba(255,255,255,${trail.life})`,
          width: trail.width || 2,
        };
    }
  }

  render(ctx, worldToScreen) {
    for (const trail of this.trails) {
      const from = worldToScreen(
        trail.from[0],
        trail.from[1]
      );

      const to = worldToScreen(
        trail.to[0],
        trail.to[1]
      );

      const style = this.getTrailStyle(trail);

      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  clear() {
    this.trails = [];
  }
}
