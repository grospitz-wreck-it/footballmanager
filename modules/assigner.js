function sample(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export function assignPlayers(players, teams) {
  const squadSize = 16;

  players.forEach(p => p.Team = null);

  teams.forEach(team => {
    let squad = [];

    function pick(position, count) {
      const pool = players.filter(p => 
        p.Position === position && !p.Team
      );
      return sample(pool, count);
    }

    squad.push(...pick("Torwart", 2));
    squad.push(...pick("Verteidiger", 5));
    squad.push(...pick("Mittelfeld", 6));
    squad.push(...pick("Stürmer", 3));

    // fallback
    if (squad.length < squadSize) {
      const rest = players.filter(p => !p.Team);
      squad.push(...sample(rest, squadSize - squad.length));
    }

    squad.forEach(p => p.Team = team.name);
  });

  return players;
}
