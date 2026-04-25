export const FORMATIONS = {

  // =========================
  // 🧱 4-4-2 (BALANCED CLEAN)
  // =========================
  "4-4-2": [
    { role: "GK", top: "50%", left: "8%" },

    { role: "DEF", top: "20%", left: "25%" },
    { role: "DEF", top: "40%", left: "25%" },
    { role: "DEF", top: "60%", left: "25%" },
    { role: "DEF", top: "80%", left: "25%" },

    { role: "MID", top: "20%", left: "50%" },
    { role: "MID", top: "40%", left: "50%" },
    { role: "MID", top: "60%", left: "50%" },
    { role: "MID", top: "80%", left: "50%" },

    { role: "ATT", top: "42%", left: "78%" },
    { role: "ATT", top: "58%", left: "78%" }
  ],

  // =========================
  // 🔥 4-3-3 (REALISTIC WIDE)
  // =========================
  "4-3-3": [
    { role: "GK", top: "50%", left: "8%" },

    { role: "DEF", top: "18%", left: "25%" },
    { role: "DEF", top: "38%", left: "25%" },
    { role: "DEF", top: "62%", left: "25%" },
    { role: "DEF", top: "82%", left: "25%" },

    { role: "MID", top: "30%", left: "50%" },
    { role: "MID", top: "50%", left: "50%" },
    { role: "MID", top: "70%", left: "50%" },

    { role: "ATT", top: "15%", left: "80%" },
    { role: "ATT", top: "50%", left: "82%" },
    { role: "ATT", top: "85%", left: "80%" }
  ],

  // =========================
  // 🧠 4-2-3-1 (PRO STYLE)
  // =========================
  "4-2-3-1": [
    { role: "GK", top: "50%", left: "8%" },

    { role: "DEF", top: "18%", left: "25%" },
    { role: "DEF", top: "38%", left: "25%" },
    { role: "DEF", top: "62%", left: "25%" },
    { role: "DEF", top: "82%", left: "25%" },

    { role: "MID", top: "40%", left: "45%" },
    { role: "MID", top: "60%", left: "45%" },

    { role: "MID", top: "20%", left: "65%" },
    { role: "MID", top: "50%", left: "68%" },
    { role: "MID", top: "80%", left: "65%" },

    { role: "ATT", top: "50%", left: "82%" }
  ],

  // =========================
  // 🛡 5-3-2 (DEFENSIVE SHAPE)
  // =========================
  "5-3-2": [
    { role: "GK", top: "50%", left: "8%" },

    { role: "DEF", top: "10%", left: "22%" },
    { role: "DEF", top: "30%", left: "22%" },
    { role: "DEF", top: "50%", left: "22%" },
    { role: "DEF", top: "70%", left: "22%" },
    { role: "DEF", top: "90%", left: "22%" },

    { role: "MID", top: "30%", left: "50%" },
    { role: "MID", top: "50%", left: "50%" },
    { role: "MID", top: "70%", left: "50%" },

    { role: "ATT", top: "42%", left: "78%" },
    { role: "ATT", top: "58%", left: "78%" }
  ],

  // =========================
  // ⚡ 3-5-2 (WIDE MIDFIELD)
  // =========================
  "3-5-2": [
    { role: "GK", top: "50%", left: "8%" },

    { role: "DEF", top: "30%", left: "25%" },
    { role: "DEF", top: "50%", left: "25%" },
    { role: "DEF", top: "70%", left: "25%" },

    { role: "MID", top: "10%", left: "50%" },
    { role: "MID", top: "30%", left: "50%" },
    { role: "MID", top: "50%", left: "50%" },
    { role: "MID", top: "70%", left: "50%" },
    { role: "MID", top: "90%", left: "50%" },

    { role: "ATT", top: "42%", left: "78%" },
    { role: "ATT", top: "58%", left: "78%" }
  ],

  // =========================
  // 🧨 4-1-2-1-2 (NARROW DIAMOND)
  // =========================
  "4-1-2-1-2": [
    { role: "GK", top: "50%", left: "8%" },

    { role: "DEF", top: "20%", left: "25%" },
    { role: "DEF", top: "40%", left: "25%" },
    { role: "DEF", top: "60%", left: "25%" },
    { role: "DEF", top: "80%", left: "25%" },

    { role: "MID", top: "50%", left: "40%" },

    { role: "MID", top: "30%", left: "55%" },
    { role: "MID", top: "70%", left: "55%" },

    { role: "MID", top: "50%", left: "70%" },

    { role: "ATT", top: "42%", left: "82%" },
    { role: "ATT", top: "58%", left: "82%" }
  ]
};
// =========================
// 🧠 FORMATION HELPERS (NEW)
// =========================

// 👉 zählt Rollen (für Stats, Engine etc.)
export function getFormationProfile(formationName) {
  const layout = FORMATIONS[formationName];
  if (!layout) return null;

  const profile = {
    GK: 0,
    DEF: 0,
    MID: 0,
    ATT: 0,
  };

  layout.forEach((p) => {
    if (profile[p.role] !== undefined) {
      profile[p.role]++;
    }
  });

  return profile;
}

// 👉 liefert einfache Gewichte (optional nutzbar)
export function getFormationWeights(formationName) {
  const profile = getFormationProfile(formationName);
  if (!profile) return null;

  const total =
    profile.DEF +
    profile.MID +
    profile.ATT;

  if (!total) return null;

  return {
    attack: profile.ATT / total,
    defense: profile.DEF / total,
    control: profile.MID / total,
  };
}
