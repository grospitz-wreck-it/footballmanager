// =========================
// 📦 EVENT REGISTRY
// =========================

export const EVENT_REGISTRY = {

  goal: {
    id: "goal",
    label: "Tor",
    duration: 0,
    effect: "goal" // 🔥 FIX: keine function mehr
  },

  foul: {
    id: "foul",
    label: "Foul",
    duration: 0,
    chanceNext: [
      { event: "penalty", chance: 0.2 }
    ]
  },

  penalty: {
  id: "penalty",
  label: "Elfmeter",
  duration: 1,

  effect(context) {
    window.startPenaltySequence?.(context);
  }
},

  offside: {
    id: "offside",
    label: "Abseits",
    duration: 0
  },

  // =========================
  // 💰 SPONSORED EVENTS
  // =========================
  sponsor_boost: {
    id: "sponsor_boost",
    label: "Sponsor Boost",
    duration: 10,
    modifier: {
      attack: 0.1
    }
  }

};
