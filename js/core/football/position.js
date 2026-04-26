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
    GK: players.filter(p => mapPosition(p.type) === "GK"),
    DEF: players.filter(p => mapPosition(p.type) === "DEF"),
    MID: players.filter(p => mapPosition(p.type) === "MID"),
    ATT: players.filter(p => mapPosition(p.type) === "ATT")
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
