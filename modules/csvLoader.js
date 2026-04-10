// =========================
// 🟡 CSV LOADER (FALLBACK)
// =========================

const CSV_PATH = "/data/ligen.csv";

function normalizeId(id){
  if(id === null || id === undefined) return null;
  return String(id);
}

function parseCSV(text){

  const lines = text.split("\n").filter(Boolean);
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {

    const values = line.split(",");
    const obj = {};

    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim();
    });

    return obj;
  });
}

export async function loadFromCSV(){

  const res = await fetch(CSV_PATH);
  const text = await res.text();

  const parsed = parseCSV(text);

  const leaguesMap = new Map();
  const teams = [];

  parsed.forEach(row => {

    const leagueName = row.Liga || row.league;

    if(leagueName && !leaguesMap.has(leagueName)){
      leaguesMap.set(leagueName, {
        id: normalizeId(leagueName),
        name: leagueName
      });
    }

    teams.push({
      ...row,
      id: normalizeId(row.id || row.ID),
      league: normalizeId(leagueName)
    });
  });

  return {
    teams,
    leagues: Array.from(leaguesMap.values())
  };
}
