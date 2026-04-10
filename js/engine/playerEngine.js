// =========================
// 🧠 PLAYER ENGINE (NEU)
// =========================

export function getPlayerRating(player){

  if(!player) return 50;

  const base =
    (player.shooting || 50) * 0.25 +
    (player.passing || 50) * 0.15 +
    (player.dribbling || 50) * 0.2 +
    (player.physical || 50) * 0.1 +
    (player.pace || 50) * 0.1 +
    (player.stamina || 50) * 0.1 +
    (player.form || 50) * 0.1;

  return base;
}

export function getAttackStrength(player){
  if(!player) return 50;

  return (
    (player.shooting || 50) * 0.5 +
    (player.dribbling || 50) * 0.2 +
    (player.pace || 50) * 0.2 +
    (player.form || 50) * 0.1
  );
}

export function getDefenseStrength(player){
  if(!player) return 50;

  return (
    (player.defending || 50) * 0.5 +
    (player.physical || 50) * 0.2 +
    (player.pace || 50) * 0.1 +
    (player.form || 50) * 0.2
  );
}

export function getGoalkeeperStrength(player){
  if(!player) return 50;

  return (
    (player.goalkeeping || 50) * 0.7 +
    (player.reaction || player.reflexes || 50) * 0.2 +
    (player.form || 50) * 0.1
  );
}
