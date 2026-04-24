// =========================
// ⚙️ TACTICS ENGINE
// =========================

import { game } from "../core/state.js";

// =========================
// 🎯 MAIN MODIFIER
// =========================
export function getTacticModifier(team = "home") {

  const t = game.tactics || {};

  let eventRate = 1;
  let attackBias = 0;
  let controlBonus = 0;

  // =========================
  // 🎯 PRESET
  // =========================
  if (t.preset === "offensive") {
    eventRate += 0.15;
    attackBias += 0.2;
  }

  if (t.preset === "defensive") {
    eventRate -= 0.1;
    attackBias -= 0.15;
  }

  if (t.preset === "balanced") {
    controlBonus += 0.1;
  }

  // =========================
  // 🔥 INTENSITY
  // =========================
  if (t.intensity === "high") {
    eventRate += 0.1;
    attackBias += 0.1;
  }

  if (t.intensity === "low") {
    eventRate -= 0.1;
    controlBonus += 0.1;
  }

  return {
    eventRate,
    attackBias,
    controlBonus
  };
}
