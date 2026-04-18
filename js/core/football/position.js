// =========================
// 🧠 POSITION MAPPING
// =========================
export function mapPosition(typeRaw){

  const type = (typeRaw || "").toUpperCase();

  if(["CB","LB","RB","WB","RWB","LWB","DEF"].some(p => type.includes(p))){
    return "DEF";
  }

  if(["CM","CDM","CAM","MID"].some(p => type.includes(p))){
    return "MID";
  }

  if(["ST","FW","CF"].some(p => type.includes(p))){
    return "ATT";
  }

  if(type.includes("GK")){
    return "GK";
  }

  return "MID";
}
