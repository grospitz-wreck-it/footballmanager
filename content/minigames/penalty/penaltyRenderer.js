import { KeeperAnimator } from "./keeperAnimator.js";
import { loadPenaltyAssets } from "./assetLoader.js";

export class PenaltyRenderer {
  constructor(root) {
    this.root = root;

    this.pitch = root.querySelector("[data-penalty-pitch]");

    this.ball = root.querySelector("[data-penalty-ball]");

    this.keeper = root.querySelector("[data-penalty-keeper]");

    this.assets = null;
    this.keeperAnimator = null;

    this.applyImmediateBasePositions();

    this.initializeAssets();
  }

  /* =========================
     BASE POSITIONS
     ========================= */

  applyImmediateBasePositions() {
    if (this.keeper) {
      this.keeper.style.left = "50%";

      this.keeper.style.top = "46%";

      this.keeper.style.transform = "translate(-50%, -50%)";
    }

    if (this.ball) {
      this.ball.style.left = "50%";

      this.ball.style.top = "78%";

      this.ball.style.transform = "translate(-50%, -50%) scale(1)";
    }
  }

  /* =========================
     ASSET INIT
     ========================= */

  async initializeAssets() {
    this.assets = await loadPenaltyAssets();

    this.keeperAnimator = new KeeperAnimator(this.assets.keeper);

    this.applyStaticAssets();
    this.resetActors();
  }

  /* =========================
     STATIC VISUALS
     ========================= */

  applyStaticAssets() {
    /* Stadium */
    if (this.pitch && this.assets?.stadium?.background) {
      this.pitch.style.backgroundImage = `url('${this.assets.stadium.background.src}')`;

      this.pitch.style.backgroundSize = "115% auto";

      this.pitch.style.backgroundPosition = "center center";

      this.pitch.style.backgroundRepeat = "no-repeat";

      this.pitch.style.backgroundColor = "#111";
    }

    /* Keeper sprite sheet */
    if (this.keeper && this.assets?.keeper?.spriteSheet) {
      this.keeper.style.backgroundImage = `url('${this.assets.keeper.spriteSheet.src}')`;

      this.keeper.style.backgroundSize = "400% 300%";

      this.keeper.style.backgroundPosition = "0% 0%";

      this.keeper.style.backgroundRepeat = "no-repeat";

      this.keeper.style.backgroundColor = "transparent";

      this.keeper.style.border = "none";

      this.keeper.style.top = "46%";
    }

    /* Ball */
    if (this.ball && this.assets?.ball?.default) {
      this.ball.style.backgroundImage = `url('${this.assets.ball.default.src}')`;

      this.ball.style.backgroundSize = "contain";

      this.ball.style.backgroundRepeat = "no-repeat";

      this.ball.style.backgroundPosition = "center";

      this.ball.style.backgroundColor = "transparent";

      this.ball.style.border = "none";
    }
  }

  /* =========================
     BALL RENDER
     ========================= */

  renderBall(position) {
    if (!this.ball) {
      return;
    }

    this.ball.style.left = `${position.x * 100}%`;

    this.ball.style.top = `${position.y * 100}%`;

    const scale = Math.max(0.35, 0.3 + position.y * 0.85);

    this.ball.style.transform = `
      translate(-50%, -50%)
      scale(${scale})
    `;
  }

  /* =========================
     KEEPER RENDER
     ========================= */

  renderKeeper(
    pose,
    direction,
    saved = false,
    missed = false,
    saveQuality = "normal",
  ) {
    if (!this.keeper || !this.keeperAnimator) {
      return;
    }

    /* =========================
     POSITION
     ========================= */

    this.keeper.style.left = `${pose.x * 100}%`;

    this.keeper.style.top = `${pose.y * 100}%`;

    /* =========================
     FRAME
     ========================= */

    const frame = this.keeperAnimator.getFrame(
      direction,
      pose.progress || 0,
      saved,
      missed,
      saveQuality,
    );

    /* =========================
     SPRITE SHEET
     ========================= */

    this.keeper.style.backgroundImage = `url('${frame.src}')`;

    this.keeper.style.backgroundSize = `${frame.cols * 100}% ${frame.rows * 100}%`;

    this.keeper.style.backgroundPosition = `${(frame.x / (frame.cols - 1)) * 100}% ${(frame.y / (frame.rows - 1)) * 100}%`;

    this.keeper.style.backgroundRepeat = "no-repeat";

    this.keeper.style.imageRendering = "pixelated";

    this.keeper.style.willChange = "transform, background-position";

    this.keeper.style.filter = "drop-shadow(0 6px 5px rgba(0,0,0,0.45))";

    /* =========================
     DIRECTION FLIP
     ========================= */

    const flipX = direction === "right" ? -1 : 1;

    /* =========================
     ROTATION
     ========================= */

    const rotation = pose.rotation || 0;

    /* =========================
     STRETCH
     ========================= */

    const stretch = pose.stretch || 1;

    /* =========================
     FIXED TRANSFORM ORDER
     ========================= */

    this.keeper.style.transform = `
    translate(-50%, -50%)
    rotate(${rotation}deg)
    scaleX(${flipX})
    scale(${stretch})
  `;

    this.keeper.dataset.direction = direction;
  }
  resetActors() {
    this.renderBall({
      x: 0.5,
      y: 0.78,
    });

    this.renderKeeper(
      {
        x: 0.5,
        y: 0.46,
        progress: 0,
        rotation: 0,
        stretch: 1,
      },
      "center",
    );
  }
}
