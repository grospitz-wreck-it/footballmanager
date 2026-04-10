// =========================
// 🧠 EVENT RESOLVER (CORE)
// =========================

import { RULES } from "../core/rules.js";
import { EVENT_TYPES, EVENT_OUTCOMES } from "../core/events.constants.js";

// =========================
// 🎯 SHOT RESOLUTION
// =========================
import { getAttackStrength, getGoalkeeperStrength } from "./playerEngine.js";

export function resolveShot({ shooter, keeper }) {

  if(!shooter || !keeper){
    return EVENT_TYPES.SHOT_MISS;
  }

  const attack = getAttackStrength(shooter);
  const gk = getGoalkeeperStrength(keeper);

  const baseGoal = RULES.shot.baseGoalChance;
  const saveChance = RULES.shot.saveChance;

  // 🔥 Skill Differenz realistischer
  const diff = (attack - gk) / 100;

  let goalChance = baseGoal + diff * 0.15;

  // 🔥 FORM Einfluss
  goalChance += ((shooter.form || 50) - 50) * 0.002;

  // 🔒 Clamp
  goalChance = Math.max(0.02, Math.min(0.6, goalChance));

  const r = Math.random();

  if(r < goalChance){
    return EVENT_TYPES.GOAL;
  }

  if(r < goalChance + saveChance){
    return EVENT_TYPES.SHOT_SAVED;
  }

  return EVENT_TYPES.SHOT_MISS;
}

// =========================
// 🚫 FOUL RESOLUTION
// =========================
export function resolveFoul() {

  const r = Math.random();

  if(r < RULES.foul.red){
    return EVENT_TYPES.RED_CARD;
  }

  if(r < RULES.foul.red + RULES.foul.yellow){
    return EVENT_TYPES.YELLOW_CARD;
  }

  return EVENT_TYPES.FOUL;
}

// =========================
// ⚔️ DUEL RESOLUTION
// =========================
export function resolveDuel(p1, p2){

  const a = p1?.attributes?.defense || 50;
  const b = p2?.attributes?.defense || 50;

  return Math.random() < (a / (a + b)) ? p1 : p2;
}
