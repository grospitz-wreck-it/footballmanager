export class KeeperAnimator {
  constructor(assets) {
    this.assets = assets;

    this.sheet =
      assets.spriteSheet;

    /* =========================
       SPRITE SHEET LAYOUT
       4 x 3
       ========================= */

    this.cols = 4;
    this.rows = 3;

    /* =========================
       FRAME MAP
       ========================= */

    this.frames = {
      /* Row 1 */
      idle: [0, 0],
      bounce: [1, 0],
      idleWide: [2, 0],
      diveEarly: [3, 0],

      /* Row 2 */
      diveMid: [0, 1],
      diveFull: [1, 1],
      saveStrong: [2, 1],
      savePerfect: [3, 1],

      /* Row 3 */
      jumpCenter: [0, 2],
      conceded: [1, 2],
      celebrate: [2, 2],

      /* Safety fallback */
      fallback: [0, 0]
    };
  }

  /* =========================
     MAIN FRAME SELECTOR
     ========================= */

  getFrame(
    direction,
    progress,
    saved = false,
    missed = false,
    saveQuality = "normal"
  ) {
    const t =
      clamp01(progress);

    /* =====================
       GOAL CONCEDED
       ===================== */
    if (missed) {
      return this.resolveFrame(
        "conceded"
      );
    }

    /* =====================
       SAVES
       ===================== */
    if (saved) {
      /* Perfect catch */
      if (
        saveQuality ===
        "perfect"
      ) {
        return this.resolveFrame(
          "savePerfect"
        );
      }

      /* Strong save */
      if (
        saveQuality ===
        "strong"
      ) {
        if (t < 0.35) {
          return this.resolveFrame(
            "diveMid"
          );
        }

        return this.resolveFrame(
          "saveStrong"
        );
      }

      /* Weak save */
      if (t < 0.25) {
        return this.resolveFrame(
          "diveEarly"
        );
      }

      if (t < 0.55) {
        return this.resolveFrame(
          "diveMid"
        );
      }

      return this.resolveFrame(
        "saveStrong"
      );
    }

    /* =====================
       LEFT / RIGHT DIVES
       ===================== */
    if (
      direction ===
        "left" ||
      direction ===
        "right"
    ) {
      if (t < 0.18) {
        return this.resolveFrame(
          "idleWide"
        );
      }

      if (t < 0.35) {
        return this.resolveFrame(
          "diveEarly"
        );
      }

      if (t < 0.62) {
        return this.resolveFrame(
          "diveMid"
        );
      }

      return this.resolveFrame(
        "diveFull"
      );
    }

    /* =====================
       CENTER SHOTS
       ===================== */
    if (
      direction ===
      "center"
    ) {
      if (t < 0.25) {
        return this.resolveFrame(
          "idle"
        );
      }

      if (t < 0.48) {
        return this.resolveFrame(
          "bounce"
        );
      }

      return this.resolveFrame(
        "jumpCenter"
      );
    }

    /* =====================
       IDLE LOOP
       ===================== */
    if (t < 0.25) {
      return this.resolveFrame(
        "idle"
      );
    }

    if (t < 0.55) {
      return this.resolveFrame(
        "bounce"
      );
    }

    return this.resolveFrame(
      "idleWide"
    );
  }

  /* =========================
     FRAME RESOLUTION
     ========================= */

  resolveFrame(name) {
    const frame =
      this.frames[
        name
      ] ||
      this.frames
        .fallback;

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

function clamp01(
  value
) {
  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}
