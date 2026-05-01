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

    this.initializeAssets();
  }

  async initializeAssets() {
    this.assets = await loadPenaltyAssets();
    this.keeperAnimator = new KeeperAnimator(this.assets.keeper);
    this.applyStaticAssets();
  }

  applyStaticAssets() {
    if (this.keeper && this.assets?.keeper?.idle) {
      this.keeper.style.backgroundImage = `url('${this.assets.keeper.idle.src}')`;
      this.keeper.style.backgroundSize = 'contain';
      this.keeper.style.backgroundRepeat = 'no-repeat';
      this.keeper.style.backgroundPosition = 'center';
      this.keeper.style.backgroundColor = 'transparent';
      this.keeper.style.border = 'none';
    }

    if (this.ball && this.assets?.ball?.default) {
      this.ball.style.backgroundImage = `url('${this.assets.ball.default.src}')`;
      this.ball.style.backgroundSize = 'contain';
      this.ball.style.backgroundRepeat = 'no-repeat';
      this.ball.style.backgroundPosition = 'center';
      this.ball.style.backgroundColor = 'transparent';
      this.ball.style.border = 'none';
    }
  }

  renderBall(position) {
    if (!this.ball) return;

    this.ball.style.left = `${position.x * 100}%`;
    this.ball.style.top = `${position.y * 100}%`;

    const scale = Math.max(0.35, 1 - position.y * 0.55);

    this.ball.style.transform = `
      translate(-50%, -50%)
      scale(${scale})
    `;
  }

  renderKeeper(pose, direction, saved = false, missed = false) {
  if (!this.keeper || !this.keeperAnimator) return;

  // Position
  this.keeper.style.left = `${pose.x * 100}%`;
  this.keeper.style.top = `${pose.y * 100}%`;

  // Nur Left-Sprites vorhanden → Right wird gespiegelt
  const spriteDirection =
    direction === 'right' ? 'left' : direction;

  // Frame bestimmen
  const frame = this.keeperAnimator.getFrame(
    spriteDirection,
    pose.progress || 0,
    saved,
    missed
  );

  // Sprite anwenden
  if (frame?.src) {
    this.keeper.style.backgroundImage = `url('${frame.src}')`;
  }

  // Spiegelung rechts
  const flipX = direction === 'right' ? -1 : 1;

  // Zusätzliche Dive-Rotation
  let rotation = 0;

  if (direction === 'left') rotation = -12;
  if (direction === 'right') rotation = 12;

  // Finale Transformation
  this.keeper.style.transform = `
    translate(-50%, -50%)
    scaleX(${flipX})
    rotate(${rotation}deg)
  `;

  // Optional Shadow FX / Depth
  this.keeper.style.filter = `
    drop-shadow(0 4px 3px rgba(0,0,0,0.35))
  `;

  this.keeper.dataset.direction = direction;
}

  resetActors() {
    this.renderBall({
      x: 0.5,
      y: 0.96
    });

    this.renderKeeper(
  { x: 0.5, y: 0.34, progress: 0 },
  'center'
);
  }
}
