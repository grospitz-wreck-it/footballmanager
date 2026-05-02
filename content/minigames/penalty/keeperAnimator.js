/* =========================
   ADVANCED KEEPER ANIMATOR
   - Multi-frame support
   - Better immersion
   - Save quality states
   - Miss states
   - Recovery states
   - Sprite sheet scalable
   ========================= */

export class KeeperAnimator {
  constructor(assets) {
    this.assets = assets;
  }

  /* =========================
     FRAME RESOLUTION
     ========================= */

  getFrame(
    direction,
    progress,
    saved = false,
    missed = false,
    saveQuality = 'normal'
  ) {
    const t = clamp01(progress);

    /* =========================
       MISSED SHOT
       ========================= */

    if (missed) {
      if (
        t > 0.72 &&
        this.assets.miss
      ) {
        return this.assets.miss;
      }

      if (
        t > 0.4 &&
        this.assets.diveLeft2
      ) {
        return this.assets.diveLeft2;
      }

      return (
        this.assets.diveLeft1 ||
        this.assets.idle
      );
    }

    /* =========================
       SUCCESSFUL SAVE
       ========================= */

    if (saved) {
      if (
        saveQuality === 'perfect' &&
        this.assets.savePerfect
      ) {
        return this.assets.savePerfect;
      }

      if (
        saveQuality === 'strong' &&
        this.assets.saveStrong
      ) {
        return this.assets.saveStrong;
      }

      if (
        t > 0.65 &&
        this.assets.saveLeft
      ) {
        return this.assets.saveLeft;
      }

      if (
        t > 0.38 &&
        this.assets.diveLeft2
      ) {
        return this.assets.diveLeft2;
      }

      return (
        this.assets.diveLeft1 ||
        this.assets.idle
      );
    }

    /* =========================
       ACTIVE DIVE
       ========================= */

    if (
      direction === 'left' ||
      direction === 'right'
    ) {
      if (
        t > 0.62 &&
        this.assets.diveLeft2
      ) {
        return this.assets.diveLeft2;
      }

      if (
        t > 0.25 &&
        this.assets.diveLeft1
      ) {
        return this.assets.diveLeft1;
      }

      return (
        this.assets.idle ||
        this.assets.bounce
      );
    }

    /* =========================
       CENTER JUMP
       ========================= */

    if (
      direction === 'center' &&
      t > 0.45 &&
      this.assets.jumpCenter
    ) {
      return this.assets.jumpCenter;
    }

    /* =========================
       IDLE LOOP
       ========================= */

    if (t < 0.28) {
      return (
        this.assets.idle ||
        this.assets.bounce
      );
    }

    if (t < 0.58) {
      return (
        this.assets.bounce ||
        this.assets.idle
      );
    }

    if (
      t < 0.82 &&
      this.assets.idleBlink
    ) {
      return this.assets.idleBlink;
    }

    return (
      this.assets.idle ||
      this.assets.bounce
    );
  }
}

/* =========================
   HELPERS
   ========================= */

function clamp01(value) {
  return Math.max(
    0,
    Math.min(1, value)
  );
}
