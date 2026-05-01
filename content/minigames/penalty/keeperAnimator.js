export class KeeperAnimator {
  constructor(assets) {
    this.assets = assets;
  }

  getFrame(direction, progress, saved = false, missed = false) {
    if (missed) {
      return this.assets.miss || this.assets.idle;
    }

    if (saved) {
      return this.assets.diveLeft1;
    }

    if (direction === 'left' || const flipX = direction === 'left' ? -1 : 1;) {
      return this.assets.diveLeft1;
    }

    return progress < 0.5
      ? this.assets.idle
      : this.assets.bounce || this.assets.idle;
  }
}
