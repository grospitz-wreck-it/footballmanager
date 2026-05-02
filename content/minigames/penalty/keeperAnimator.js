export class KeeperAnimator {
  constructor(assets) {
    this.assets = assets;

    this.sheet =
      assets.spriteSheet;

    this.cols = 4;
    this.rows = 3;

    this.frames = {
      idle: [0, 0],
      bounce: [1, 0],
      idleWide: [2, 0],
      diveEarly: [3, 0],

      diveMid: [0, 1],
      diveFull: [1, 1],
      saveStrong: [2, 1],
      savePerfect: [3, 1],

      jumpCenter: [0, 2],
      conceded: [1, 2],
      celebrate: [2, 2]
    };
  }

  /* =========================
     FRAME SELECTOR
     ========================= */

  getFrame(
    direction,
    progress,
    saved = false,
    missed = false,
    saveQuality = 'normal'
  ) {
    const t =
      clamp01(progress);

    /* Missed goal */
    if (missed) {
      return this.resolveFrame(
        'conceded'
      );
    }

    /* Successful save */
    if (saved) {
      if (
        saveQuality ===
        'perfect'
      ) {
        return this.resolveFrame(
          'savePerfect'
        );
      }

      if (
        saveQuality ===
        'strong'
      ) {
        return this.resolveFrame(
          'saveStrong'
        );
      }

      if (t < 0.35) {
        return this.resolveFrame(
          'diveEarly'
        );
      }

      if (t < 0.65) {
        return this.resolveFrame(
          'diveMid'
        );
      }

      return this.resolveFrame(
        'saveStrong'
      );
    }

    /* Left / Right dive */
    if (
      direction === 'left' ||
      direction === 'right'
    ) {
      if (t < 0.25) {
        return this.resolveFrame(
          'diveEarly'
        );
      }

      if (t < 0.55) {
        return this.resolveFrame(
          'diveMid'
        );
      }

      return this.resolveFrame(
        'diveFull'
      );
    }

    /* Center jump */
    if (
      direction ===
        'center' &&
      t > 0.42
    ) {
      return this.resolveFrame(
        'jumpCenter'
      );
    }

    /* Idle loop */
    if (t < 0.25) {
      return this.resolveFrame(
        'idle'
      );
    }

    if (t < 0.55) {
      return this.resolveFrame(
        'bounce'
      );
    }

    return this.resolveFrame(
      'idleWide'
    );
  }

  /* =========================
     FRAME MAPPING
     ========================= */

  resolveFrame(name) {
    const frame =
      this.frames[name] ||
      this.frames.idle;

    return {
      src:
        this.sheet.src,

      x: frame[0],
      y: frame[1],

      cols: this.cols,
      rows: this.rows
    };
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
