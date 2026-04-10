// =========================
// 📦 LIGEN LISTE (für UI)
// =========================
var leagues = {
  herford: "Kreisliga Herford",
  luebbecke: "Kreisliga Lübbecke",
  bielefeld: "Kreisliga Bielefeld"
};

// =========================
// 👤 TEAM AUSWÄHLEN
// =========================
function selectTeam(name){
  game.team.selected = name;
}

window.selectTeam = selectTeam;

// =========================
// 🏗️ TEAM ERSTELLEN
// =========================
function createTeam(name, id){
  return {
    id: id,
    name: name,
    strength: Math.floor(Math.random() * 30) + 60
  };
}

// =========================
// 🏟️ LIGA LADEN
// =========================
function loadLeague(name){

  game.league.key = name;
  game.league.teams = [];
  game.league.schedule = [];
  game.league.currentRound = 0;

  let t = [];

  // =========================
  // 🏟️ HERFORD
  // =========================
  if (name === "herford") {
    t = [
      "Bünder SV","SC Herford","TuS Bruchmühlen","SV Rödinghausen II",
      "FC Exter","SV Enger-Westerenger","TuRa Löhne","FC Herford",
      "TSV Löhne","SV Oetinghausen","SC Vlotho","SV Bischofshagen",
      "TuS Hunnebrock","SV Hiddenhausen","FC Schweicheln","RW Kirchlengern II"
    ];
  }

  // =========================
  // 🏟️ LÜBBECKE
  // =========================
  else if (name === "luebbecke") {
    t = [
      "Gehlenbeck","TuSpo Rahden","TG Espelkamp","SuS Holzhausen",
      "FC Lübbecke II","FC Oppenwehe","TuS Stemwede","Union Varl",
      "SSV Ströhen","Fabbenstedt","TuS Tengern II","Tonnenheide",
      "Pr Espelkamp II","TuS Levern","Isenstedt","TuRa Espelk."
    ];
  }

  // =========================
  // 🏟️ BIELEFELD
  // =========================
  else if (name === "bielefeld") {
    t = [
      "TuS Jöllenbeck","SC Bielefeld","BV Werther","SG Oesterweg",
      "TuS 08 Senne I","Schildesche","SV Häger","Oldentrup",
      "TuS Jöllen. II","SC Peckeloh II","Kosova Bi","Ubbedissen",
      "TuS Ost Bie.","Amshausen","TuS Quelle","Gadderbaum"
    ];
  }

  // =========================
  // ❌ FALLBACK
  // =========================
  if(t.length === 0){
    console.error("❌ Unbekannte Liga:", name);
    alert("Liga nicht gefunden!");
    return;
  }

  // =========================
  // 🧱 TEAMS ERSTELLEN
  // =========================
  game.league.teams = t.map((name, i) => createTeam(name, i));

  console.log("TEAMS:", game.league.teams);

  // =========================
  // 📊 TABELLE
  // =========================
  createTable();

  // =========================
  // ⚽ SPIELPLAN
  // =========================
  generateSchedule();

  // =========================
  // 💾 SAVE
  // =========================
  saveGame?.();

  console.log("✅ Liga geladen:", name);
}

// =========================
// ⚽ SPIELPLAN
// =========================
function generateSchedule(){

  let teams = [...game.league.teams];

  if(teams.length % 2 !== 0){
    teams.push({ name: "SPIELFREI" });
  }

  const rounds = teams.length - 1;
  const half = teams.length / 2;

  let schedule = [];

  // =========================
  // 🔁 HINRUNDE
  // =========================
  for(let i = 0; i < rounds; i++){

    let matchday = [];

    for(let j = 0; j < half; j++){

      const home = teams[j];
      const away = teams[teams.length - 1 - j];

      if(home.name !== "SPIELFREI" && away.name !== "SPIELFREI"){
        matchday.push({
          home: home,
          away: away,
          result: null
        });
      }
    }

    teams.splice(1, 0, teams.pop());
    schedule.push(matchday);
  }

  // =========================
  // 🔁 RÜCKRUNDE
  // =========================
  const returnRounds = schedule.map(round =>
    round.map(match => ({
      home: match.away,
      away: match.home,
      result: null
    }))
  );

  game.league.schedule = [...schedule, ...returnRounds];
  game.league.currentRound = 0;

  console.log("📅 Spielplan erstellt:", game.league.schedule.length);
}

// =========================
// 🌍 EXPORT
// =========================
window.loadLeague = loadLeague;
window.generateSchedule = generateSchedule;
