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
