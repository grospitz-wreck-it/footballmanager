import { FORMATIONS } from "./formation.js";
export function mapPosition(typeRaw){

  const type = (typeRaw || "").toUpperCase();

  if(type.includes("GK")){
    return "GK";
  }

  if(["CB","LB","RB","WB","RWB","LWB","DEF"].some(p => type.includes(p))){
    return "DEF";
  }

  if(["CM","CDM","CAM","MID"].some(p => type.includes(p))){
    return "MID";
  }

  if(["ST","FW","CF","ATT"].some(p => type.includes(p))){
    return "ATT";
  }

  return "MID";
}

// =========================
// 🧠 FORMATION PROFILE (FIXED)
// =========================
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


// =========================
// 🎮 GAME / UI ROLE MAPPING
// =========================
export function mapPositionToRole(typeRaw){
  const core = mapPosition(typeRaw);

  // 👉 zentrale Regel: ATT wird zu ST (nur UI!)
  if(core === "ATT") return "ST";

  return core;
}


// =========================
// ⚙️ APPLY FORMATION (FINAL FIX)
// =========================
export function applyFormation(players, formationKey) {

  const f = getFormationProfile(formationKey);
  if (!f) return players;

  // =========================
  // 📦 POOLS
  // =========================
  const pools = {
  GK: players.filter(p => mapPosition(p.position_type) === "GK"),
  DEF: players.filter(p => mapPosition(p.position_type) === "DEF"),
  MID: players.filter(p => mapPosition(p.position_type) === "MID"),
  ATT: players.filter(p => mapPosition(p.position_type) === "ATT")
};

  const result = [];

  // =========================
  // 🧤 GK
  // =========================
  if (pools.GK.length > 0) {
    result.push({ ...pools.GK.shift(), role: "GK" });
  } 
  else if (pools.DEF.length > 0) {
    result.push({ ...pools.DEF.shift(), role: "GK" });
  }
  else {
    result.push({ role: "GK", dummy: true });
  }

  // =========================
  // 🛡 DEF (DEF → MID → GK)
  // =========================
  for (let i = 0; i < f.DEF; i++) {
    if (pools.DEF.length > 0) {
      result.push({ ...pools.DEF.shift(), role: "DEF" });
    } 
    else if (pools.MID.length > 0) {
      result.push({ ...pools.MID.shift(), role: "DEF" });
    } 
    else if (pools.GK.length > 0) {
      result.push({ ...pools.GK.shift(), role: "DEF" });
    } 
    else {
      result.push({ role: "DEF", dummy: true });
    }
  }

  // =========================
  // 🎯 MID (MID ↔ DEF)
  // =========================
  for (let i = 0; i < f.MID; i++) {
    if (pools.MID.length > 0) {
      result.push({ ...pools.MID.shift(), role: "MID" });
    } 
    else if (pools.DEF.length > 0) {
      result.push({ ...pools.DEF.shift(), role: "MID" });
    } 
    else {
      result.push({ role: "MID", dummy: true });
    }
  }

  // =========================
  // ⚡ ATT (ATT → MID)
  // =========================
  for (let i = 0; i < f.ATT; i++) {
    if (pools.ATT.length > 0) {
      result.push({ ...pools.ATT.shift(), role: "ATT" });
    } 
    else if (pools.MID.length > 0) {
      result.push({ ...pools.MID.shift(), role: "ATT" });
    } 
    else {
      result.push({ role: "ATT", dummy: true });
    }
  }

  return result;
}

function getRoleScore(player, role) {
  const o = player.overall ?? 50;

  const atk = player.attack ?? o;
  const def = player.defense ?? o;
  const ctrl = player.control ?? o;
  const gk = player.goalkeeping ?? o;

  switch (role) {
    case "ATT":
      return atk * 1.2 + ctrl * 0.3;

    case "MID":
      return ctrl * 1.0 + atk * 0.4 + def * 0.3;

    case "DEF":
      return def * 1.2 + ctrl * 0.3;

    case "GK":
      return gk * 1.4 + def * 0.4;

    default:
      return o;
  }
}

export function getBestXI(players, formationKey) {
  const f = getFormationProfile(formationKey);
  if (!f) return players.slice(0, 11);

  const used = new Set();
  const result = [];

  // 👉 helper: best player für rolle holen
  const pickBest = (candidates, role) => {
    let best = null;
    let bestScore = -1;

    candidates.forEach(p => {
      if (used.has(p.id)) return;

      const score = getRoleScore(p, role);

      if (score > bestScore) {
        best = p;
        bestScore = score;
      }
    });

    if (best) {
      used.add(best.id);
      result.push({ ...best, role });
      return true;
    }

    return false;
  };

  // =========================
  // 🧤 GK
  // =========================
  pickBest(players, "GK");

  // =========================
  // 🛡 DEF
  // =========================
  for (let i = 0; i < f.DEF; i++) {
    if (!pickBest(players, "DEF")) break;
  }

  // =========================
  // 🎯 MID
  // =========================
  for (let i = 0; i < f.MID; i++) {
    if (!pickBest(players, "MID")) break;
  }

  // =========================
  // ⚡ ATT
  // =========================
  for (let i = 0; i < f.ATT; i++) {
    if (!pickBest(players, "ATT")) break;
  }

  return result;
}
