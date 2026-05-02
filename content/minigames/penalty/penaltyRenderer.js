import { KeeperAnimator } from './keeperAnimator.js';
import { loadPenaltyAssets } from './assetLoader.js';

export class PenaltyRenderer {
  constructor(root) {
    this.root = root;

    this.pitch = root.querySelector('[data-penalty-pitch]');
    this.ball = root.querySelector('[data-penalty-ball]');
    this.keeper = root.querySelector('[data-penalty-keeper]');

    this.assets = null;
    this.keeperAnimator = null;

    // Sofort korrekte Startposition setzen
    this.applyImmediateBasePositions();

    this.initializeAssets();
  }

  applyImmediateBasePositions() {
    if (this.keeper) {
      this.keeper.style.left = '50%';
      this.keeper.style.top = '36%';
      this.keeper.style.transform =
        'translate(-50%, -50%)';
    }

    if (this.ball) {
      this.ball.style.left = '50%';
      this.ball.style.top = '78%';
      this.ball.style.transform =
        'translate(-50%, -50%) scale(1)';
    }
  }

  async initializeAssets() {
    this.assets = await loadPenaltyAssets();

    this.keeperAnimator = new KeeperAnimator(
      this.assets.keeper
    );

    this.applyStaticAssets();
    this.resetActors();
  }

  applyStaticAssets() {
  /* =========================
     STADIUM BACKGROUND
     15% Zoom-In
     ========================= */
  if (
    this.pitch &&
    this.assets?.stadium?.background
  ) {
    this.pitch.style.backgroundImage =
      `url('${this.assets.stadium.background.src}')`;

    this.pitch.style.backgroundSize =
      '115% auto';

    this.pitch.style.backgroundPosition =
      'center center';

    this.pitch.style.backgroundRepeat =
      'no-repeat';

    this.pitch.style.backgroundColor =
      '#111';
  }

  /* =========================
     KEEPER IDLE SPRITE
     ========================= */
  if (
    this.keeper &&
    this.assets?.keeper?.idle
  ) {
    this.keeper.style.backgroundImage =
      `url('${this.assets.keeper.idle.src}')`;

    this.keeper.style.backgroundSize =
      'contain';

    this.keeper.style.backgroundRepeat =
      'no-repeat';

    this.keeper.style.backgroundPosition =
      'center';

    this.keeper.style.backgroundColor =
      'transparent';

    this.keeper.style.border =
      'none';
  }

  /* =========================
     BALL SPRITE
     ========================= */
  if (
    this.ball &&
    this.assets?.ball?.default
  ) {
    this.ball.style.backgroundImage =
      `url('${this.assets.ball.default.src}')`;

    this.ball.style.backgroundSize =
      'contain';

    this.ball.style.backgroundRepeat =
      'no-repeat';

    this.ball.style.backgroundPosition =
      'center';

    this.ball.style.backgroundColor =
      'transparent';

    this.ball.style.border =
      'none';
  }
}

  renderBall(position) {
    if (!this.ball) return;

    this.ball.style.left =
      `${position.x * 100}%`;

    this.ball.style.top =
      `${position.y * 100}%`;

    // Perspektive:
    // Unten groß / oben klein
    const scale = Math.max(
      0.35,
      0.3 + position.y * 0.85
    );

    this.ball.style.transform = `
      translate(-50%, -50%)
      scale(${scale})
    `;
  }

  renderKeeper(
  pose,
  direction,
  saved = false,
  missed = false,
  saveQuality = 'normal'
) {
  if (
    !this.keeper ||
    !this.keeperAnimator
  ) {
    return;
  }

  /* =========================
     POSITION
     ========================= */

  this.keeper.style.left =
    `${pose.x * 100}%`;

  this.keeper.style.top =
    `${pose.y * 100}%`;

  /* =========================
     FRAME
     ========================= */

  const frame =
    this.keeperAnimator.getFrame(
      direction,
      pose.progress || 0,
      saved,
      missed,
      saveQuality
    );

  /* =========================
     SPRITE SHEET
     ========================= */

  this.keeper.style.backgroundImage =
    `url('${frame.src}')`;

  this.keeper.style.backgroundSize =
    `${frame.cols * 100}% ${frame.rows * 100}%`;

  this.keeper.style.backgroundPosition =
    `${(frame.x / (frame.cols - 1)) * 100}% ${(frame.y / (frame.rows - 1)) * 100}%`;

  this.keeper.style.backgroundRepeat =
    'no-repeat';

  /* =========================
     DIRECTION FLIP
     ========================= */

  const flipX =
    direction === 'right'
      ? -1
      : 1;

  /* =========================
     ROTATION
     ========================= */

  const rotation =
    pose.rotation || 0;

  /* =========================
     STRETCH
     ========================= */

  const stretch =
    pose.stretch || 1;

  this.keeper.style.transform = `
    translate(-50%, -50%)
    scaleX(${flipX})
    rotate(${rotation}deg)
    scale(${stretch})
  `;

  this.keeper.dataset.direction =
    direction;
}
