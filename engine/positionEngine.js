// =========================
// 📍 POSITION ENGINE
// =========================

export function getPositionWeights(player){

  const pos = player?.position || "CM";

  switch(pos){

    case "ST":
      return {
        shot: 1.5,
        duel: 0.8,
        foul: 0.7
      };

    case "LW":
    case "RW":
      return {
        shot: 1.2,
        duel: 1.0,
        foul: 0.6
      };

    case "CM":
      return {
        shot: 0.8,
        duel: 1.2,
        foul: 1.0
      };

    case "CDM":
      return {
        shot: 0.5,
        duel: 1.5,
        foul: 1.3
      };

    case "CB":
      return {
        shot: 0.2,
        duel: 1.6,
        foul: 1.4
      };

    case "GK":
      return {
        shot: 0.0,
        duel: 0.5,
        foul: 0.2
      };

    default:
      return {
        shot: 1,
        duel: 1,
        foul: 1
      };
  }
}
