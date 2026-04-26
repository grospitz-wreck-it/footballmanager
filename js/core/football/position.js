// =========================
// 🧠 CORE POSITION MAPPING
// =========================
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
// 🎮 GAME / UI ROLE MAPPING
// =========================
export function mapPositionToRole(typeRaw){

  const core = mapPosition(typeRaw);

  // 👉 zentrale Regel: ATT wird zu ST
  if(core === "ATT") return "ST";

  return core;
}

export function applyFormation(players, formationKey) {

  const f = getFormationProfile(formationKey);
  if (!f) return players;

  const pools = {
    GK: players.filter(p => mapPosition(p.type) === "GK"),
    DEF: players.filter(p => mapPosition(p.type) === "DEF"),
    MID: players.filter(p => mapPosition(p.type) === "MID"),
    ATT: players.filter(p => mapPosition(p.type) === "ATT")
  };

  const result = [];

  // GK (nur GK oder DEF)
  if (pools.GK.length > 0) {
    result.push({ ...pools.GK.shift(), role: "GK" });
  } else if (pools.DEF.length > 0) {
    result.push({ ...pools.DEF.shift(), role: "GK" });
  }

  // DEF (DEF + MID + optional GK)
  for (let i = 0; i < f.DEF; i++) {
    if (pools.DEF.length > 0) {
      result.push({ ...pools.DEF.shift(), role: "DEF" });
    } else if (pools.MID.length > 0) {
      result.push({ ...pools.MID.shift(), role: "DEF" });
    } else if (pools.GK.length > 0) {
      result.push({ ...pools.GK.shift(), role: "DEF" });
    }
  }

  // MID (MID + DEF)
  for (let i = 0; i < f.MID; i++) {
    if (pools.MID.length > 0) {
      result.push({ ...pools.MID.shift(), role: "MID" });
    } else if (pools.DEF.length > 0) {
      result.push({ ...pools.DEF.shift(), role: "MID" });
    }
  }

  // ATT (ATT + MID)
  for (let i = 0; i < f.ATT; i++) {
    if (pools.ATT.length > 0) {
      result.push({ ...pools.ATT.shift(), role: "ATT" });
    } else if (pools.MID.length > 0) {
      result.push({ ...pools.MID.shift(), role: "ATT" });
    }
  }

  return result;
}
