import { game } from "../core/state.js";

export function simulateAllOtherLeagues() {

  const leagues =
    game.leagues ||
    game.league?.available ||
    [];

  if (!leagues.length) return;

  const currentLeagueId =
    game.league?.current?.id;

  leagues.forEach((league) => {

    if (!league) return;

    if (league.id === currentLeagueId) {
      return;
    }

    const roundIndex =
      Number(league.currentRound || 0);

    const round =
      league.schedule?.[roundIndex];

    if (!round?.length) {
      return;
    }

    if (round._simulated) {
      return;
    }

    round.forEach((match) => {

      if (!match) return;
      if (match._processed) return;

      const homeGoals =
        Math.floor(Math.random() * 5);

      const awayGoals =
        Math.floor(Math.random() * 5);

      match.result = {
        home: homeGoals,
        away: awayGoals,
      };

      match.homeGoals = homeGoals;
      match.awayGoals = awayGoals;

      match.finished = true;
      match.live = false;
      match.status = "FT";
      match._processed = true;
    });

    round._simulated = true;

    league.currentRound++;

    // 🔥 HIER REIN
    if (
      league.currentRound >=
      league.schedule.length
    ) {
      league.seasonFinished = true;

      console.log(
        "🏆 League finished:",
        league.name
      );
    }

    console.log(
      "⚽ League simulated:",
      league.name,
      "Round:",
      league.currentRound
    );
  });
}