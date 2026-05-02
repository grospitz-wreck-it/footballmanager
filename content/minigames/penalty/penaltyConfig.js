/* =========================
   PENALTY CONFIG – PRODUCTION GRADE
   - bessere Balance
   - feinere Difficulty
   - arcade + realism hybrid
   - future-proof
   - modular event scaling
   ========================= */

export const PENALTY_ZONES = Object.freeze({
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER: 'center'
});

/* =========================
   MAIN CONFIG
   ========================= */

export const DEFAULT_PENALTY_CONFIG = Object.freeze({
  rounds: 1,

  difficulty: 'normal',

  dimensions: {
    width: 1280,
    height: 720
  },

  /* =========================
     PHYSICS
     ========================= */

  physics: {
    baseBallSpeed: 1,

    /* Shot variance */
    errorJitter: 0.065,

    /* Power */
    minPower: 0.12,
    maxPower: 1,

    /* Input scaling */
    holdToPowerScale: 850,
    swipeToPowerScale: 430,

    /* Animation speeds */
    shotDurationMinMs: 300,
    shotDurationMaxMs: 880,

    /* Curve system */
    topShotCurveBonus: 0.12,
    cornerCurveStrength: 0.025,

    /* Perfect shot thresholds */
    perfectShotWindow: 0.92,
    weakShotThreshold: 0.28
  },

  /* =========================
     KEEPER AI
     ========================= */

  keeper: {
    /* Humanized reactions */
    reactionMs: {
      easy: [360, 560],
      normal: [240, 400],
      hard: [150, 290],
      elite: [90, 210]
    },

    /* Predictive intelligence */
    anticipationWeight: {
      easy: 0.22,
      normal: 0.48,
      hard: 0.72,
      elite: 0.9
    },

    /* Catch radius */
    saveRadius: {
      easy: 0.11,
      normal: 0.155,
      hard: 0.195,
      elite: 0.235
    },

    /* Movement speed */
    diveSpeed: {
      easy: 0.82,
      normal: 1,
      hard: 1.18,
      elite: 1.34
    },

    /* Mistake chance */
    mistakeChance: {
      easy: 0.24,
      normal: 0.12,
      hard: 0.06,
      elite: 0.02
    },

    /* Aggression */
    commitBias: {
      easy: 0.3,
      normal: 0.5,
      hard: 0.72,
      elite: 0.88
    }
  },

  /* =========================
     VISUALS
     ========================= */

  visuals: {
    crtOverlay: true,
    screenShake: true,
    crowdPulse: true,
    dynamicGoalFlash: true,
    keeperShadow: true,
    replayCam: false
  },

  /* =========================
     AUDIO
     ========================= */

  audio: {
    masterVolume: 1,
    crowdVolume: 0.85,
    sfxVolume: 1,
    musicVolume: 0.72
  },

  /* =========================
     GAMEPLAY
     ========================= */

  gameplay: {
    suddenDeath: false,
    comboScoring: false,
    perfectShotBonus: true,
    saveStreakBonus: false
  },

  /* =========================
     HOOKS
     ========================= */

  hooks: {
    onRoundStart: null,
    onShotTaken: null,
    onRoundResolved: null,
    onGameEnd: null,
    onPerfectShot: null,
    onPerfectSave: null
  }
});

/* =========================
   CONFIG MERGER
   ========================= */

export function mergePenaltyConfig(
  baseConfig = DEFAULT_PENALTY_CONFIG,
  override = {}
) {
  return {
    ...baseConfig,
    ...override,

    dimensions: {
      ...baseConfig.dimensions,
      ...(override.dimensions || {})
    },

    physics: {
      ...baseConfig.physics,
      ...(override.physics || {})
    },

    keeper: {
      ...baseConfig.keeper,
      ...(override.keeper || {}),

      reactionMs: {
        ...baseConfig.keeper.reactionMs,
        ...(override.keeper?.reactionMs || {})
      },

      anticipationWeight: {
        ...baseConfig.keeper
          .anticipationWeight,
        ...(override.keeper
          ?.anticipationWeight || {})
      },

      saveRadius: {
        ...baseConfig.keeper.saveRadius,
        ...(override.keeper
          ?.saveRadius || {})
      },

      diveSpeed: {
        ...baseConfig.keeper.diveSpeed,
        ...(override.keeper
          ?.diveSpeed || {})
      },

      mistakeChance: {
        ...baseConfig.keeper
          .mistakeChance,
        ...(override.keeper
          ?.mistakeChance || {})
      },

      commitBias: {
        ...baseConfig.keeper.commitBias,
        ...(override.keeper
          ?.commitBias || {})
      }
    },

    visuals: {
      ...baseConfig.visuals,
      ...(override.visuals || {})
    },

    audio: {
      ...baseConfig.audio,
      ...(override.audio || {})
    },

    gameplay: {
      ...baseConfig.gameplay,
      ...(override.gameplay || {})
    },

    hooks: {
      ...baseConfig.hooks,
      ...(override.hooks || {})
    }
  };
}
