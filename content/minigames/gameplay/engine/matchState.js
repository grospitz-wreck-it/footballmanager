// /gameplay/engine/matchState.js

export function createInitialMatchState(config) {
  const createFormation = (side) => {
    if (side === "home") {
      return [
        // Defensive line
        { id: "H1", role: "LB", x: 0.12, y: 0.2 },
        { id: "H2", role: "CB", x: 0.14, y: 0.4 },
        { id: "H3", role: "CB", x: 0.14, y: 0.6 },
        { id: "H4", role: "RB", x: 0.12, y: 0.8 },

        // Midfield
        { id: "H5", role: "LM", x: 0.32, y: 0.25 },
        { id: "H6", role: "CM", x: 0.34, y: 0.5 },
        { id: "H7", role: "RM", x: 0.32, y: 0.75 },

        // Attack
        { id: "H8", role: "LW", x: 0.58, y: 0.28 },
        { id: "H9", role: "ST", x: 0.64, y: 0.5 },
        { id: "H10", role: "RW", x: 0.58, y: 0.72 },
      ];
    }

    return [
      // Defensive line
      { id: "A1", role: "LB", x: 0.88, y: 0.2 },
      { id: "A2", role: "CB", x: 0.86, y: 0.4 },
      { id: "A3", role: "CB", x: 0.86, y: 0.6 },
      { id: "A4", role: "RB", x: 0.88, y: 0.8 },

      // Midfield
      { id: "A5", role: "LM", x: 0.68, y: 0.25 },
      { id: "A6", role: "CM", x: 0.66, y: 0.5 },
      { id: "A7", role: "RM", x: 0.68, y: 0.75 },

      // Attack
      { id: "A8", role: "LW", x: 0.42, y: 0.28 },
      { id: "A9", role: "ST", x: 0.36, y: 0.5 },
      { id: "A10", role: "RW", x: 0.42, y: 0.72 },
    ];
  };

  return {
    phase: "IDLE",

    clock: {
      minute: config.matchStartMinute || 53,
      second: 0,
    },

    score: {
      home: 0,
      away: 0,
    },

    ball: {
      x: 0.22,
      y: 0.52,
      owner: "HOME",
      speed: 0,
      target: null,
    },

    home: createFormation("home"),
    away: createFormation("away"),

    tactical: {
      home: config.tacticalProfiles?.home || null,
      away: config.tacticalProfiles?.away || null,
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
