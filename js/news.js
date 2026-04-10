// =========================
// 📰 NEWS SYSTEM (FIXED)
// =========================

// Zufall
function r(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

// Adjektiv-Beugung
function adj(word, type="es"){
  const endings = { e:"e", es:"es", en:"en", er:"er" };
  return word + (endings[type] || "");
}

// =========================
// 🧠 ANALYSE
// =========================
function analyzeMatch(m){

  const s1 = m.score.home;
  const s2 = m.score.away;

  const diff = Math.abs(s1 - s2);
  const total = s1 + s2;

  return {
    dominant: diff >= 3,
    close: diff <= 1,
    crazy: total >= 5
  };
}

// =========================
// 🧠 MATCH TEXT
// =========================
function buildMatchText(match){

  const t1 = match.home;
  const t2 = match.away;
  const s1 = match.score.home;
  const s2 = match.score.away;

  const analysis = analyzeMatch(match);

  let text = `${t1} ${s1}:${s2} ${t2} - `;
  if(s1 > s2){

    if(analysis.dominant){
      text += `${t1} ${r(words.actions)} und zeigt sich dabei ${r(words.adjPositive)}.`;
    }
    else if(analysis.close){
      text += `${t1} ${r(words.phrases.win)}, ${t2} wirkt jedoch ${r(words.adjNegative)}.`;
    }
    else{
      text += `${t1} ${r(words.phrases.win)}.`;
    }

  }
  else if(s2 > s1){

    if(analysis.dominant){
      text += `${t2} ${r(words.actions)} und tritt insgesamt ${r(words.adjPositive)} auf.`;
    }
    else if(analysis.close){
      text += `${t2} ${r(words.phrases.win)}, während ${t1} ${r(words.negActions)}.`;
    }
    else{
      text += `${t2} ${r(words.phrases.win)}.`;
    }

  }
  else{
    text += `Beide Teams ${r(words.phrases.draw)} und liefern sich ein ${adj(r(words.adjPositive),"es")} Duell.`;
  }

  if(analysis.crazy){
    text += ` Die Partie entwickelte sich zu einem echten ${r(words.crazy)}.`;
  }

  return text;
}

// =========================
// 🧠 TABELLEN STORY
// =========================
function buildTableStory(){

  const teams = [...game.league.teams].sort((a,b)=>
    b.points - a.points ||
    (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
  );

  if(teams.length < 2) return "";

  const leader = teams[0];
  const second = teams[1];
  const bottom = teams.slice(-2);

  let text = "";

  text += `${leader.name} präsentiert sich weiterhin ${r(words.adjPositive)} und behauptet die Tabellenführung. `;
  text += `${second.name} bleibt in Lauerstellung und zeigt ${adj(r(words.adjPositive),"e")} Leistungen. `;

  if(bottom.length >= 2){
    text += `Am Tabellenende haben ${bottom[0].name} und ${bottom[1].name} zu kämpfen und wirken zuletzt ${r(words.adjNegative)}.`;
  }

  return text;
}

// =========================
// 📰 HAUPTBERICHT
// =========================
function generateMatchdayReport(results){

  if(!results || results.length === 0){
    return "Noch keine Spiele gespielt.";
  }

  let text = "";

  text += `📰 SPIELTAG-REPORT\n\n`;

  text += `${r(words.phrases.intro)} `;
  text += `Vor allem im Bereich ${r(words.nouns)} zeigte sich die Liga von ihrer ${adj(r(words.adjPositive),"en")} Seite.\n\n`;

  const sample = results.slice(0, 4);
  sample.forEach(m => {
    text += buildMatchText(m) + " ";
  });

  text += "\n\n";
  text += buildTableStory() + "\n\n";

  text += `${r(words.phrases.outro)} `;
  text += `Besonders im Bereich ${r(words.nouns)} bleibt die Entwicklung spannend.`;

  return text;
}

// =========================
// 📢 MATCH REPORT (ENGINE FIX)
// =========================
function addMatchReport(match){

  if(!match) return;

  const box = document.getElementById("newsBox");
  if(!box) return;

  const p = document.createElement("p");

  p.innerText =
    "📰 " +
    match.home + " " +
    match.score.home + " - " +
    match.score.away + " " +
    match.away;

  box.prepend(p);
}

// =========================
// 🌍 GLOBAL EXPORTS
// =========================
window.generateMatchdayReport = generateMatchdayReport;
window.addMatchReport = addMatchReport;
