// /gameplay/engine/matchState.js
// Phase 1.5 Upgrade: echte Zielpositionen + Bewegungsdynamik

export function createInitialMatchState(config) {
  const createPlayer = (
    id,
    role,
    x,
    y
  ) => ({
    id,
    role,

    // Current position
    x,
    y,

    // Movement target
    targetX: x,
    targetY: y,

    speed:
      role === "ST" || role.includes("W")
        ? 1.15
        : role.includes("CM")
        ? 1
        : 0.92,

    stamina: 1,
  });

  const createFormation = (side) => {
    if (side === "home") {
      return [
        createPlayer("H1", "LB", 0.12, 0.2),
        createPlayer("H2", "CB", 0.14, 0.4),
        createPlayer("H3", "CB", 0.14, 0.6),
        createPlayer("H4", "RB", 0.12, 0.8),

        createPlayer("H5", "LM", 0.32, 0.25),
        createPlayer("H6", "CM", 0.34, 0.5),
        createPlayer("H7", "RM", 0.32, 0.75),

        createPlayer("H8", "LW", 0.58, 0.28),
        createPlayer("H9", "ST", 0.64, 0.5),
        createPlayer("H10", "RW", 0.58, 0.72),
      ];
    }

    return [
      createPlayer("A1", "LB", 0.88, 0.2),
      createPlayer("A2", "CB", 0.86, 0.4),
      createPlayer("A3", "CB", 0.86, 0.6),
      createPlayer("A4", "RB", 0.88, 0.8),

      createPlayer("A5", "LM", 0.68, 0.25),
      createPlayer("A6", "CM", 0.66, 0.5),
      createPlayer("A7", "RM", 0.68, 0.75),

      createPlayer("A8", "LW", 0.42, 0.28),
      createPlayer("A9", "ST", 0.36, 0.5),
      createPlayer("A10", "RW", 0.42, 0.72),
    ];
  };

  return {
    phase: "IDLE",

    clock: {
      minute:
        config.matchStartMinute || 53,
      second: 0,
    },

    score: {
      home: 0,
      away: 0,
    },

    ball: {
      x: 0.22,
      y: 0.52,

      targetX: 0.22,
      targetY: 0.52,

      owner: "HOME",
      speed: 1,
    },

    home: createFormation("home"),
    away: createFormation("away"),

    tactical: {
      home:
        config.tacticalProfiles?.home ||
        null,

      away:
        config.tacticalProfiles?.away ||
        null,
    },

    momentum: {
      value: 0,
      dominantTeam: null,
    },

    zones: {
      defensiveThird: [0, 0.33],
      midfield: [0.33, 0.66],
      attackingThird: [0.66, 1],
    },

    animation: {
      activeTrails: [],
      activeHighlights: [],
    },

    metadata: {
      possession: "HOME",
      lastEvent: null,
      sequenceStep: 0,
    },

    colors: config.team,
  };
}
