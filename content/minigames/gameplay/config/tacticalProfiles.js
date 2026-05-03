// /gameplay/config/tacticalProfiles.js

export const tacticalProfiles = {
  home: {
    name: "Dynamic Home Attack",

    shape: "4-3-3",

    width: "balanced",          // compact | balanced | wide
    tempo: "high",              // low | medium | high
    pressing: "aggressive",     // passive | balanced | aggressive
    risk: "progressive",        // safe | progressive | direct
    flankBias: "right",         // left | right | center
    counterBias: "medium",      // low | medium | high

    modifiers: {
      buildupSpeed: 1.18,
      linePush: 1.12,
      passRisk: 1.15,
      shotFrequency: 1.08,
      defensiveLine: 0.58,
    },
  },

  away: {
    name: "Compact Reactive Block",

    shape: "4-4-2",

    width: "compact",
    tempo: "medium",
    pressing: "balanced",
    risk: "safe",
    flankBias: "center",
    counterBias: "high",

    modifiers: {
      buildupSpeed: 0.94,
      linePush: 0.92,
      passRisk: 0.9,
      shotFrequency: 0.96,
      defensiveLine: 0.42,
    },
  },
};

// ------------------------------------
// Helper Utilities
// ------------------------------------

export function getTacticalProfile(team = "home") {
  return tacticalProfiles[team] || tacticalProfiles.home;
}

export function getFlankModifier(profile) {
  switch (profile.flankBias) {
    case "left":
      return { left: 1.2, center: 1, right: 0.85 };

    case "right":
      return { left: 0.85, center: 1, right: 1.2 };

    case "center":
    default:
      return { left: 0.95, center: 1.2, right: 0.95 };
  }
}

export function getTempoMultiplier(profile) {
  switch (profile.tempo) {
    case "high":
      return 1.2;

    case "medium":
      return 1;

    case "low":
    default:
      return 0.82;
  }
}

export function getPressingIntensity(profile) {
  switch (profile.pressing) {
    case "aggressive":
      return 1.25;

    case "balanced":
      return 1;

    case "passive":
    default:
      return 0.8;
  }
}

export function getRiskFactor(profile) {
  switch (profile.risk) {
    case "direct":
      return 1.3;

    case "progressive":
      return 1.1;

    case "safe":
    default:
      return 0.85;
  }
}
