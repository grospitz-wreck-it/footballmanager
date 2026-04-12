
import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";
export async function loadPlayers(){

  const { data, error } = await supabase
    .from("players")
    .select("*");

  if(error){
    console.error("❌ Player Load Error:", error);
    return [];
  }

  return (data || []).map(p => {

    // 🔥 STABILE ID (EXTREM WICHTIG)
    const id = String(
      p.id ||
      (p.name + "_" + (p.team_id || ""))
    );

    return {
      id,

      name: p.name,
      team_id: String(p.team_id),

      country: p.country || "DE",
      position: p.position || "CM",

      overall: Number(p.overall) || 50,
      shooting: Number(p.shooting) || 50,
      passing: Number(p.passing) || 50,
      defending: Number(p.defending) || 50,
      goalkeeping: Number(p.goalkeeping) || 50
    };
  });
}

