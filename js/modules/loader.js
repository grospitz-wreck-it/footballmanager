import { supabase } from "../client.js"; // 🔥 du brauchst das!

export async function loadPlayers(){

  const { data, error } = await supabase
    .from("players")
    .select("*");

  if(error){
    console.error("❌ Player Load Error:", error);
    return [];
  }

  const cleaned = (data || []).map(p => {

    // 🔥 TEAM FIX (KRITISCH)
    const teamId =
      (p.team_id === "null" || p.team_id === undefined)
        ? null
        : p.team_id;

    // 🔥 STABILE ID
    const id = String(
      p.id ||
      (p.name + "_" + (teamId || "no_team"))
    );

    return {
      id,

      name: p.name,

      // 🔥 WICHTIG: NICHT String()!
      team_id: teamId,

      country: p.country || "DE",
      position: p.position || "CM",

      overall: Number(p.overall) || 50,
      shooting: Number(p.shooting) || 50,
      passing: Number(p.passing) || 50,
      defending: Number(p.defending) || 50,
      goalkeeping: Number(p.goalkeeping) || 50
    };
  });

  console.log("🧼 CLEAN PLAYERS SAMPLE:", cleaned.slice(0,5));

  return cleaned;
}
