/* =========================================================
   KeeperAI.js – FULL DROP-IN UPGRADE
   Neue Splines + bessere Keeperlogik
   ========================================================= */

import {
  getKeeperCurve,
  sampleCurve
} from './keeperSpline.js';

/* =========================
   HELPERS
   ========================= */

function randomRange(min, max) {
  return (
    min +
    Math.random() * (max - min)
  );
}

function clamp01(value) {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

function zoneToDirection(zone) {
  if (!zone) return 'center';

  if (zone.includes('left'))
    return 'left';

  if (zone.includes('right'))
    return 'right';

  return 'center';
}

/* =========================
   MAIN AI
   ========================= */

export class KeeperAI {
  constructor(config) {
    this.config = config;
    this.difficulty =
      config.difficulty;
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  /* =========================
     SHOT DECISION
     ========================= */

  decide(shotIntent) {
    const keeperCfg =
      this.config.keeper;

    const diff =
      this.difficulty;

    const anticipation =
      keeperCfg.anticipationWeight[
        diff
      ];

    const mistakeChance =
      keeperCfg.mistakeChance?.[
        diff
      ] || 0;

    const commitBias =
      keeperCfg.commitBias?.[
        diff
      ] || 0.5;

    const shotDirection =
      zoneToDirection(
        shotIntent.zone
      );

    let shouldRead =
      Math.random() <
      anticipation;

    let direction;

    if (
      Math.random() <
      mistakeChance
    ) {
      direction =
        this.randomWrongDirection(
          shotDirection
        );
    } else if (
      shouldRead
    ) {
      direction =
        Math.random() <
        commitBias
          ? shotDirection
          : this.randomDirection();
    } else {
      direction =
        this.randomDirection();
    }

    const reactionMs =
      randomRange(
        ...keeperCfg.reactionMs[
          diff
        ]
      );

    const saveRadius =
      keeperCfg.saveRadius[
        diff
      ] *
      randomRange(
        0.92,
        1.08
      );

    const diveSpeed =
      keeperCfg.diveSpeed[
        diff
      ] *
      randomRange(
        0.95,
        1.06
      );

    return {
      direction,
      reactionMs,
      diveSpeed,
      saveRadius,

      anticipationUsed:
        shouldRead,

      committed:
        direction ===
        shotDirection
    };
  }

  /* =========================
     RANDOM DIRECTION
     ========================= */

  randomDirection() {
    const roll =
      Math.random();

    if (roll < 0.33)
      return 'left';

    if (roll < 0.66)
      return 'right';

    return 'center';
  }

  randomWrongDirection(
    correctDirection
  ) {
    const options = [
      'left',
      'right',
      'center'
    ].filter(
      (dir) =>
        dir !==
        correctDirection
    );

    return options[
      Math.floor(
        Math.random() *
          options.length
      )
    ];
  }

  /* =========================
     SHOT HEIGHT
     ========================= */

  determineShotHeight(
    shotTargetY
  ) {
    if (shotTargetY <= 0.36) {
      return 'high';
    }

    if (shotTargetY >= 0.47) {
      return 'low';
    }

    return 'mid';
  }

  /* =========================
     POSE COMPUTATION
     ========================= */

  computePose(
    decision,
    elapsedMs,
    shotDurationMs,
    shotIntent = null
  ) {
    /* =====================
       PRE-SHOT SHUFFLE
       ===================== */
    if (
      elapsedMs <
      decision.reactionMs
    ) {
      const preProgress =
        clamp01(
          elapsedMs /
            decision.reactionMs
        );

      const preCurve =
        getKeeperCurve(
          decision.direction,
          'mid',
          'pre'
        );

      return {
        ...sampleCurve(
          preCurve,
          preProgress
        ),
        progress: 0
      };
    }

    /* =====================
       SHOT HEIGHT
       ===================== */
    const shotHeight =
      shotIntent?.target?.y
        ? this.determineShotHeight(
            shotIntent.target.y
          )
        : 'mid';

    /* =====================
       DIVE PHASE
       ===================== */
    const rawProgress =
      (elapsedMs -
        decision.reactionMs) /
      (shotDurationMs /
        decision.diveSpeed);

    const progress =
      clamp01(rawProgress);

    const curve =
      getKeeperCurve(
        decision.direction,
        shotHeight,
        'dive'
      );

    const pose =
      sampleCurve(
        curve,
        progress
      );

    return {
      ...pose,
      progress
    };
  }
}
