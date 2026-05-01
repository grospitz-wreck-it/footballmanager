export const PENALTY_ZONES = Object.freeze({
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER: 'center'
});

export const DEFAULT_PENALTY_CONFIG = Object.freeze({
  rounds: 5,
  difficulty: 'normal',
  dimensions: {
    width: 1280,
    height: 720
  },
  physics: {
    baseBallSpeed: 1,
    errorJitter: 0.08,
    minPower: 0.1,
    maxPower: 1,
    holdToPowerScale: 900,
    swipeToPowerScale: 480,
    shotDurationMinMs: 320,
    shotDurationMaxMs: 860
  },
  keeper: {
    reactionMs: {
      easy: [340, 520],
      normal: [250, 420],
      hard: [180, 330]
    },
    anticipationWeight: {
      easy: 0.25,
      normal: 0.45,
      hard: 0.65
    },
    saveRadius: {
      easy: 0.12,
      normal: 0.16,
      hard: 0.2
    },
    diveSpeed: {
      easy: 0.85,
      normal: 1,
      hard: 1.15
    }
  },
  hooks: {
    onRoundStart: null,
    onShotTaken: null,
    onRoundResolved: null,
    onGameEnd: null
  }
});

export function mergePenaltyConfig(baseConfig = DEFAULT_PENALTY_CONFIG, override = {}) {
  return {
    ...baseConfig,
    ...override,
    dimensions: { ...baseConfig.dimensions, ...override.dimensions },
    physics: { ...baseConfig.physics, ...override.physics },
    keeper: {
      ...baseConfig.keeper,
      ...override.keeper,
      reactionMs: { ...baseConfig.keeper.reactionMs, ...override.keeper?.reactionMs },
      anticipationWeight: {
        ...baseConfig.keeper.anticipationWeight,
        ...override.keeper?.anticipationWeight
      },
      saveRadius: { ...baseConfig.keeper.saveRadius, ...override.keeper?.saveRadius },
      diveSpeed: { ...baseConfig.keeper.diveSpeed, ...override.keeper?.diveSpeed }
    },
    hooks: { ...baseConfig.hooks, ...override.hooks }
  };
}
