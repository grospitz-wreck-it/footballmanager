import { supabase } from "../client.js"; // 🔥 du brauchst das!

export async function loadPlayersForTeams(teamIds){

  if(!teamIds || !teamIds.length){
    console.warn("⚠️ keine teamIds übergeben");
    return [];
  }

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .in("team_id", teamIds); // 🔥 DAS IST DER KEY

  if(error){
    console.error("❌ Player Load Error:", error);
    return [];
  }

  console.log("📦 PLAYERS FOR TEAMS:", data?.length);

  const cleaned = (data || []).map(p => {

    const teamId =
      (p.team_id === "null" || p.team_id === undefined || p.team_id === "")
        ? null
        : p.team_id;

    const id = String(
      p.id ||
      (p.name + "_" + (teamId || "no_team"))
    );

    return {
      id,
      name: p.name,
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

  return cleaned;
}
function getCountryForPlayer(player, team, league){

  const level = league?.level || 99;

  // 🔥 Wahrscheinlichkeiten je Liga
  let foreignChance = 0;

  if(level >= 7) foreignChance = 0.05;      // Kreisliga
  else if(level >= 6) foreignChance = 0.15; // Bezirksliga
  else if(level >= 5) foreignChance = 0.3;
  else if(level >= 4) foreignChance = 0.5;
  else foreignChance = 0.7;

  // 🔥 deterministischer seed
  const seed = (player.id || "") + (team?.id || "");
  let hash = 0;

  for(let i=0;i<seed.length;i++){
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const rand = Math.abs(hash % 100) / 100;

  if(rand > foreignChance){
    return "DE";
  }

  // 🌍 Foreign Pool
  const countries = ["PL","TR","NL","FR","ES","IT","BR","AR","NG","GH"];

  const index = Math.abs(hash) % countries.length;

  return countries[index];
}
