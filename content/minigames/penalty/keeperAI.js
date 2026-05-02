/* =========================
   ADVANCED KEEPER AI SYSTEM
   - smarter anticipation
   - bluff mistakes
   - humanized errors
   - difficulty scaling
   - perfect saves
   - fake commits
   - immersive arcade intelligence
   ========================= */

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
     SHOT READING
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

    /* =========================
       HUMAN ERROR
       ========================= */

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
      /* Sometimes commit aggressively */
      direction =
        Math.random() <
        commitBias
          ? shotDirection
          : this.randomDirection();
    } else {
      direction =
        this.randomDirection();
    }

    /* Reaction */
    const reactionMs =
      randomRange(
        ...keeperCfg.reactionMs[
          diff
        ]
      );

    /* Save radius slight randomness */
    const saveRadius =
      keeperCfg.saveRadius[
        diff
      ] *
      randomRange(
        0.92,
        1.08
      );

    /* Dive speed variation */
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
     DIRECTION LOGIC
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
     POSE COMPUTATION
     ========================= */

  computePose(
    decision,
    elapsedMs,
    shotDurationMs
  ) {
    /* Before reaction = idle */
    if (
      elapsedMs <
      decision.reactionMs
    ) {
      return {
        x: 0.5,
        y: 0.355,
        rotation: 0,
        stretch: 1,
        progress: 0
      };
    }

    /* Dive progression */
    const rawProgress =
      (elapsedMs -
        decision.reactionMs) /
      (shotDurationMs /
        decision.diveSpeed);

    const progress =
      clamp01(rawProgress);

    const curve =
      getKeeperCurve(
        decision.direction
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
