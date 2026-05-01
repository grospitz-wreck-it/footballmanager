export class KeeperAnimator {
  constructor(assets) {
    this.assets = assets;
  }

  getFrame(direction, progress, saved = false, missed = false) {
    if (missed) {
      return this.assets.miss || this.assets.idle;
    }

    if (saved) {
      return this.assets.saveLeft || this.assets.diveLeft2;
    }

    if (direction === 'left' || direction === 'right') {
      if (progress < 0.35) return this.assets.diveLeft1;
      if (progress < 0.7) return this.assets.diveLeft2;
      return this.assets.diveLeft2;
    }

    return progress < 0.5
      ? this.assets.idle
      : this.assets.bounce;
  }
}
