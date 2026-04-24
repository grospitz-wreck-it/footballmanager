// =========================
// ⚙️ TACTICS ENGINE (FINAL)
// =========================

import { game } from "../core/state.js";

// =========================
// 🧠 HELPERS
// =========================
function clamp(v, min = -1, max = 2) {
  return Math.max(min, Math.min(max, v));
}

// =========================
// 🎯 MAIN MODIFIER
// =========================
export function getTacticModifier(team = "home") {

  let t;

  // =========================
  // 🔥 TEAM-SPEZIFISCH (FUTURE READY)
  // =========================
  if (team === "away" && game.match?.away?.tactics) {
    t = game.match.away.tactics;
  } else if (team === "home" && game.match?.home?.tactics) {
    t = game.match.home.tactics;
  } else {
    // 👉 fallback (aktuelles System)
    t = game.tactics;
  }

  if (!t) t = {};

  let eventRate = 1;      // wie oft passiert was
  let attackBias = 0;     // Richtung Angriff
  let controlBonus = 0;   // Ballbesitz

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

  // =========================
  // 📐 FORMATION BONUS (leicht!)
  // =========================
  if (t.formation === "4-3-3") {
    attackBias += 0.05;
  }

  if (t.formation === "4-4-2") {
    controlBonus += 0.05;
  }

  // =========================
  // 🔒 SAFETY CLAMP
  // =========================
  eventRate = clamp(eventRate, 0.6, 1.6);
  attackBias = clamp(attackBias, -0.4, 0.4);
  controlBonus = clamp(controlBonus, 0, 0.4);

  return {
    eventRate,
    attackBias,
    controlBonus
  };
}

// =========================
// ⚔️ TEAM VS TEAM ADVANTAGE
// =========================
export function getTacticDuel() {

  const home = getTacticModifier("home");
  const away = getTacticModifier("away");

  return {
    eventRate: (home.eventRate + away.eventRate) / 2,

    attackAdvantage:
      clamp(home.attackBias - away.attackBias, -0.4, 0.4),

    controlAdvantage:
      clamp(home.controlBonus - away.controlBonus, -0.4, 0.4)
  };
}

// =========================
// 🎲 EVENT TRIGGER HELPER
// =========================
export function shouldTriggerEvent(baseChance = 0.2) {

  const { eventRate } = getTacticDuel();

  return Math.random() < baseChance * eventRate;
}

// =========================
// ⚽ TEAM PICK (WHO ATTACKS)
// =========================
export function pickAttackingTeam() {

  const { attackAdvantage } = getTacticDuel();

  const base = 0.5 + attackAdvantage;

  return Math.random() < base ? "home" : "away";
}

// =========================
// 🧠 CONTROL HELPER
// =========================
export function applyControl(baseControl = 0.5) {

  const { controlAdvantage } = getTacticDuel();

  return clamp(baseControl + controlAdvantage, 0.1, 0.9);
}
