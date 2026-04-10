async function loadLeaderboard(){

  var box = document.getElementById("leaderboard");

  if(!box){
    console.error("leaderboard nicht gefunden");
    return;
  }

  box.innerHTML = "Lade Daten...";

  var res = await supabaseClient
    .from("leaderboard")
    .select("*");

  var data = res.data;
  var error = res.error;

  if(error){
    console.error("Leaderboard Fehler:", error);
    box.innerHTML = "Fehler: " + error.message;
    return;
  }

  if(!data || data.length === 0){
    box.innerHTML = "Noch keine Einträge";
    return;
  }

  // =========================
  // BESTEN SCORE PRO SPIELER (OHNE REDUCE)
  // =========================

  var bestPerPlayer = [];

  data.forEach(function(entry){

    var existing = bestPerPlayer.find(function(e){
      return e.player_id === entry.player_id;
    });

    if(!existing){
      bestPerPlayer.push(entry);
    } else {
      if(entry.score > existing.score){
        existing.score = entry.score;
        existing.name = entry.name;
        existing.team = entry.team;
        existing.color = entry.color;
      }
    }

  });

  // =========================
  // SORTIEREN
  // =========================

  bestPerPlayer.sort(function(a, b){
    return b.score - a.score;
  });

  var top10 = bestPerPlayer.slice(0, 10);

  box.innerHTML = "";

  top10.forEach(function(entry, i){

    var div = document.createElement("div");

    if(entry.player_id === game.player.id){
      div.style.background = "gold";
      div.style.color = "black";
      div.style.fontWeight = "bold";
      div.style.padding = "4px";
    }

    div.style.marginBottom = "6px";

    var html = "";
    html += "<strong>#" + (i+1) + "</strong> ";
    html += entry.name ? entry.name : "Unbekannt";
    html += "<br>(" + entry.team + ")";
    html += " - <strong>" + entry.score + "</strong> Punkte";

    div.innerHTML = html;

    box.appendChild(div);
  });

  // =========================
  // EIGENER RANG
  // =========================

  var myRank = -1;

  for(var i = 0; i < bestPerPlayer.length; i++){
    if(bestPerPlayer[i].player_id === game.player.id){
      myRank = i;
      break;
    }
  }

  if(myRank !== -1){
    var rankDiv = document.createElement("div");
    rankDiv.innerHTML = "Dein Rang: #" + (myRank + 1);
    rankDiv.style.marginTop = "10px";
    rankDiv.style.fontWeight = "bold";
    box.appendChild(rankDiv);
  }
}
