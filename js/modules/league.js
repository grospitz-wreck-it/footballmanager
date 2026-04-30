// =========================
// 📦 IMPORTS
// =========================
import { renderCurrentMatch, updateUI } from "../ui/ui.js";
import { game } from "../core/state.js";
import { generateTeam } from "./teamLoader.js";
import { initMatch } from "../matchEngine.js";
import { generateSchedule } from "./scheduler.js";
import { startGame } from "../ui/layout.js";
import { handleAppVisibility } from "../main.js";

import {
  ensureManagerState,
  recalculateSquadValue
} from "./managerSystem.js";
// =========================
// 🧠 HELPERS
// =========================
function normalizeId(id) {
  if (id === null || id === undefined) return null;
  return String(id);
}

// 🔥 Map für externes Setzen (PLZ)
let leagueIndexMap = [];
// 🔥 FIX: verhindert doppelte Initialisierung
let leagueSelectInitialized = false;

function ensureTeamPlayers(team) {
  if (team.players && team.players.length > 0) {
    return team.players;
  }

  console.log(`⚽ Baue Kader für ${team.name}`);

  const pool = window.playerPool || game.players || [];

  if (!pool.length) {
    console.warn("⏳ PlayerPool nicht bereit → skip team build");
    return [];
  }

  // 🔥 Zielverteilung
  const target = {
    GK: 2,
    DEF: 6,
    MID: 8,
    ST: 6,
  };

  // 🔥 Pool nach Position aufteilen
  const byPos = {
    GK: [],
    DEF: [],
    MID: [],
    ST: [],
  };

  pool.forEach((p) => {
    const pos = (p.position_type || "").toUpperCase();

    if (pos.includes("GK")) byPos.GK.push(p);
    else if (pos.includes("DEF")) byPos.DEF.push(p);
    else if (pos.includes("MID")) byPos.MID.push(p);
    else if (pos.includes("ST")) byPos.ST.push(p);
  });

  // 🔥 Shuffle helper
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  Object.keys(byPos).forEach((k) => shuffle(byPos[k]));

  const selected = [];

  // 🔥 gezielte Auswahl
  function take(posKey, amount) {
    for (let i = 0; i < amount; i++) {
      if (byPos[posKey].length) {
        selected.push(byPos[posKey].shift());
      }
    }
  }

  take("GK", target.GK);
  take("DEF", target.DEF);
  take("MID", target.MID);
  take("ST", target.ST);

  // 🔥 Fallback falls Position fehlt
  const needed = 22 - selected.length;

  if (needed > 0) {
    console.warn(`⚠️ Fallback für ${team.name}: ${needed} Spieler fehlen`);

    const rest = pool.filter((p) => !selected.includes(p));
    shuffle(rest);

    selected.push(...rest.slice(0, needed));
  }

  // 🔥 Team setzen
  team.players = selected.map((p) => {
    p.team_id = team.id;
    return p;
  });

  console.log(`✅ ${team.players.length} Spieler für ${team.name}`, {
    GK: target.GK,
    DEF: target.DEF,
    MID: target.MID,
    ST: target.ST,
  });

  return team.players;
}

// =========================
// 🧠 CURRENT ROUND
// =========================
function getCurrentRound() {
  const league = game.league?.current;

  if (!league || !league.schedule) return null;

  return league.schedule[league.currentRound] || null;
}

// =========================
// 🏗️ INIT LEAGUE
// =========================
function initLeague(league) {
  if (!league) {
    console.error("❌ Keine Liga übergeben");
    return;
  }

  if (!Array.isArray(league.teams) || league.teams.length === 0) {
    console.error("❌ Liga hat keine Teams", league);
    return;
  }

  // =========================
  // 🆔 NORMALIZE IDS
  // =========================
  league.teams = league.teams.map((t) => ({
    ...t,
    id: normalizeId(t.id),
  }));

  // =========================
  // 📊 TABLE INIT
  // =========================
  league.table = league.teams.map((team) => ({
    id: normalizeId(team.id),
    name: team.name,
    played: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    strength: team.strength || 50,
  }));

  console.log("📊 Tabelle erstellt");

  // =========================
  // 📅 SCHEDULE FIX (CRITICAL)
  // =========================

  // 🔥 Schedule kommt jetzt von außen (setLeagueById)
  if (!league.schedule || !league.schedule.length) {
    console.warn("⚠️ Kein Schedule vorhanden (sollte nicht passieren)");
  }

  // =========================
  // 🔄 ROUND INIT
  // =========================
  if (typeof league.currentRound !== "number") {
    league.currentRound = 0;
  }

  league.playerRound = 0;

  // =========================
  // 🧠 ENSURE PLAYER POOL SIZE
  // =========================

  const pool = window.playerPool || game.players || [];

  const neededPlayers = league.teams.length * 22;

  console.log("🧪 POOL CHECK:", {
    current: pool.length,
    needed: neededPlayers,
  });

  // =========================
  // 👥 TEAM PLAYERS INIT (FINAL FIX)
  // =========================

  if (!pool.length) {
    console.warn("⏳ PlayerPool leer → abbrechen");
    return;
  }

  {
    for (const team of league.teams) {
      if (!Array.isArray(team.players) || team.players.length < 11) {
        console.log("⚽ Generiere Spieler für:", team.name);

        const players = ensureTeamPlayers(team);

        team.players = players || [];

        // 🔥 Binding fix
        team.players.forEach((p) => {
          p.team_id = team.id;

          if (!p.id) {
            p.id = crypto.randomUUID();
          }
        });
        // 🔥 FALLBACK BINDING (KRITISCH)
        if (Array.isArray(team.players) && team.players.length) {
          team.players.forEach((p) => {
            if (!p.team_id) {
              p.team_id = team.id;
            }
          });
        }
        if (team.players.length < 11) {
          console.error("❌ TEAM HAT ZU WENIG SPIELER:", team.name);
        }
      }
    }

    console.log("👥 Spieler korrekt verteilt");
  }
}

// =========================
// ⏭ NÄCHSTES SPIEL
// =========================
function nextMatch() {
  const league = game.league?.current;

  if (!league) {
    console.error("❌ Keine Liga aktiv");
    return;
  }

  if (!league.schedule || league.schedule.length === 0) {
    console.error("❌ Kein Spielplan vorhanden");
    return;
  }

  league.currentRound++;

  if (league.currentRound >= league.schedule.length) {
    console.log("🏆 Saison beendet");

    // 🔥 SEASON FRAMEWORK
    import("../modules/seasonManager.js")
      .then(({ processSeasonTransition }) => {
        processSeasonTransition();

        // 🔥 Neuer Spielplan
        league.schedule = generateSchedule(game.league.current);

        console.log("📅 Neue Saison gestartet:", {
          year: game.season.year,
          league: game.league.current?.name,
        });
      })
      .catch((err) => {
        console.error("❌ Season transition failed:", err);
      });

    league.currentRound = 0;
  }

  game.match.current = null;

  game.match.live = {
    minute: 0,
    running: false,
    score: { home: 0, away: 0 },
    events: [],
  };

  game.phase = "idle";

  console.log("➡️ Nächstes Spiel:", league.currentRound);

  renderCurrentMatch();
}

// =========================
// 🏆 INIT LEAGUE SELECT
// =========================
function initLeagueSelect(leaguesInput) {
  leagueSelectInitialized = true;

  function resetSelect(id) {
    const el = document.getElementById(id);
    if (!el) return null;

    const clone = el.cloneNode(false);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  const splashSelect = resetSelect("leagueSelect");
  const menuSelect = resetSelect("leagueSelectMenu");

  const selects = [splashSelect, menuSelect].filter(Boolean);

  // 🔥 Datenquelle
  const source = leaguesInput || game.league?.available || [];

  if (!source.length) {
    console.log("ℹ️ LeagueSelect wartet auf Daten...");

    selects.forEach((select) => {
      select.innerHTML = "";
    });

    return;
  }

  console.log("🏆 LeagueSelect FINAL:", source.length);

  const seen = new Set();
  const leagues = [];

  source.forEach((l) => {
    const key = `${normalizeId(l.id)}-${l.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    leagues.push(l);
  });

  leagueIndexMap = leagues;

  // =========================
  // 🔽 DROPDOWNS FÜLLEN
  // =========================
  selects.forEach((select) => {
    select.innerHTML = "";

    leagues.forEach((league, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${league.name} (${league.teams?.length || 0})`;
      select.appendChild(option);
    });

    select.addEventListener("change", (e) => {
      const index = Number(e.target.value);
      const league = leagues[index];

      if (!league) return;

      // =========================
      // 🧠 LEAGUE SETZEN
      // =========================
      game.league.current = league;

      // 🔥 Reset + Neuaufbau
      league.schedule = generateSchedule(league);
      league.currentRound = 0;
      league.table = null;

      initLeague(league);

      // =========================
      // ⚽ MATCH INIT
      // =========================
      const round = league.schedule?.[0];

      if (!round) {
        console.error("❌ Kein Round nach Teamwahl");
        return;
      }

      const ok = initMatch(round);

      if (!ok) {
        console.error("❌ initMatch fehlgeschlagen nach Teamwahl");
        return;
      }

      if (!game.match?.live) {
        console.error("❌ live fehlt nach initMatch");
        return;
      }

      game.match.live.running = false;
      game.match.live.phase = game.match.live.phase || "first_half";

      console.log("✅ Match ready nach Teamwahl:", game.match);

      // 🔄 Sync beide Selects
      selects.forEach((s) => {
        if (s !== select) s.value = index;
      });

      populateTeamSelect();
    });
  });

  // =========================
  // 🔥 DEFAULT INIT
  // =========================
  game.league = game.league || {};
  game.league.current = leagues[0];

  if (!game.league.current) {
    console.warn("❌ Keine Default Liga");
    return;
  }

  // Schedule zuerst
  if (!game.league.current.schedule || !game.league.current.schedule.length) {
    game.league.current.schedule = generateSchedule(game.league.current);
  }

  // Dann init
  initLeague(game.league.current);

  populateTeamSelect();

  // =========================
  // ⚽ ERSTES MATCH
  // =========================
  const round = game.league.current.schedule?.[0];

  if (round && round.length > 0) {
    const ok = initMatch(round);

    if (ok && game.match?.live) {
      game.match.live.running = false;
    }
  }

  console.log("✅ LeagueSelect vollständig initialisiert");
}

// =========================
// 🔥 SET LEAGUE (PLZ)
// =========================
function setLeagueById(leagueId) {
  const league = leagueIndexMap.find(
    (l) => normalizeId(l.id) === normalizeId(leagueId),
  );

  if (!league) {
    console.warn("❌ Liga nicht gefunden:", leagueId);
    return;
  }

  const index = leagueIndexMap.indexOf(league);

  const selects = [
    document.getElementById("leagueSelect"),
    document.getElementById("leagueSelectMenu"),
  ].filter(Boolean);

  // =========================
  // 🧠 SET CURRENT LEAGUE
  // =========================
  game.league.current = league;

  // =========================
  // 🏗 INIT LEAGUE FIRST (🔥 KRITISCH)
  // =========================
  initLeague(league);

  // 🔥 HARD PLAYER SAFETY (NEU)
  for (const team of league.teams) {
    if (!Array.isArray(team.players) || team.players.length < 11) {
      const players = ensureTeamPlayers(team);
      team.players = players || [];
    }

    team.players.forEach((p) => {
      if (!p.id) {
        p.id = crypto.randomUUID();
      }
    });
  }

  // 🧪 DEBUG (optional aber extrem hilfreich)
  console.log(
    "🧪 TEAM CHECK:",
    league.teams.map((t) => ({
      name: t.name,
      players: t.players?.length,
    })),
  );

  // =========================
  // 📅 SCHEDULE (JETZT ERST!)
  // =========================
  if (!league.schedule || !league.schedule.length) {
    console.warn("📅 Generiere neuen Spielplan:", league.name);

    const schedule = generateSchedule(league);

    if (schedule && schedule.length) {
      league.schedule = schedule;
    } else {
      console.error("❌ Schedule konnte nicht erstellt werden");
      return;
    }
  }

  // =========================
  // 🔄 SELECT SYNC
  // =========================
  selects.forEach((select) => {
    select.value = index;
  });

  populateTeamSelect();

  // =========================
  // ⚽ INIT MATCH (JETZT SAFE)
  // =========================
  const round = league.schedule?.[0];

  if (round && round.length > 0) {
    const ok = initMatch(round);

    if (ok && game.match?.live) {
      game.match.live.running = false;
    }
  }

  console.log("✅ Liga extern gesetzt:", league.name);
}

// =========================
// 👕 TEAM SELECT (ID BASED)
// =========================
function populateTeamSelect() {
  const splashSelect = document.getElementById("teamSelect");
  const menuSelect = document.getElementById("teamSelectMenu");

  const selects = [splashSelect, menuSelect].filter(Boolean);

  const league = game.league?.current;

  if (!league || !Array.isArray(league.teams)) {
    console.warn("❌ Keine Teams vorhanden:", league);
    return;
  }

  selects.forEach((select) => {
    select.innerHTML = "";

    league.teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = normalizeId(team.id);
      option.textContent = team.name;
      select.appendChild(option);
    });

    select.onchange = (e) => {
      if (!game.league?.current) {
        console.warn("⏳ Liga noch nicht ready → retry TeamSelect");

        setTimeout(() => {
          setLeagueById(id);
        }, 100);

        return;
      }

      const teamId = normalizeId(e.target.value);

      // 🔥 zusätzlicher Guard (optional aber gut)
      if (!teamId) {
        console.warn("⚠️ Ungültige Team-ID");
        return;
      }

      const success = selectTeamById(teamId);

      // 🔥 nur syncen wenn wirklich erfolgreich
      if (success) {
        selects.forEach((s) => {
          if (s !== select) s.value = teamId;
        });
      }
    };
  });

  // 🔥 KEIN AUTO-SELECT MEHR
  game.team = game.team || {};
  game.team.selected = null;
  game.team.selectedId = null;

  console.log("✅ Teams geladen:", league.teams.length);
}

// =========================
// 👤 TEAM WÄHLEN (ID)
// =========================
function selectTeamById(teamId) {
  const league = game.league?.current;

  if (!league || !Array.isArray(league.teams)) {
    console.warn("⛔ selectTeamById: Liga noch nicht ready");
    return false;
  }

  const team = league.teams.find(
    (t) => normalizeId(t.id) === normalizeId(teamId),
  );

  if (!team) {
    console.warn("⚠️ Team nicht gefunden:", teamId);
    return false;
  }

  // =========================
  // 👤 TEAM SETZEN
  // =========================
  game.team.selected = team.name;
  game.team.selectedId = normalizeId(team.id);

  // =========================
  // 💼 MANAGER SYSTEM INIT
  // =========================
  if (typeof ensureManagerState === "function") {
    ensureManagerState();
  }

  // =========================
  // 👥 SPIELER AUFBAU
  // =========================
  let players = ensureTeamPlayers(team);

  // 🔥 FALLBACK
  if (!players || players.length === 0) {
    console.warn("⚠️ Team hatte keine Spieler → retry build");
    players = ensureTeamPlayers(team);
  }

  // =========================
  // 🧠 TEAM BINDING
  // =========================
  if (players && players.length) {
    game.team.players = players;
  }

  // =========================
  // 💰 KADERWERT NACH SPIELERN
  // =========================
  if (typeof recalculateSquadValue === "function") {
    recalculateSquadValue();
  }

  // =========================
  // 📊 DEBUG
  // =========================
  console.log("📊 MANAGER:", game.manager);

  // =========================
  // ⚽ MATCH INIT
  // =========================
  console.log("✅ Team gewählt (ID):", team.id);

  const round = league.schedule?.[0];

  if (round && round.length > 0) {
    const ok = initMatch(round);

    if (ok && game.match?.live) {
      game.match.live.running = false;
    }
  }

  // =========================
  // 🖥 UI REFRESH
  // =========================
  renderCurrentMatch();

  if (typeof updateUI === "function") {
    updateUI();
  }

  handleAppVisibility();

  console.log("TEAM ID NACH SET:", game.team?.selectedId);

  return true;
}
// =========================
// 🧠 GET TEAM
// =========================
function getSelectedTeam() {
  const league = game.league?.current;
  if (!league) return null;

  return league.teams.find(
    (t) => normalizeId(t.id) === normalizeId(game.team?.selectedId),
  );
}

export function getPlayersOfTeam(teamId) {
  if (!teamId) return [];

  const pool =
    window.playerPool && window.playerPool.length
      ? window.playerPool
      : game.players || [];

  // 🔥 1. DIREKT AUS TEAM (PRIMARY SOURCE)
  const league = game.league?.current;

  if (league?.teams?.length) {
    const team = league.teams.find((t) => String(t.id) === String(teamId));

    if (team?.players?.length) {
      return team.players;
    }
  }

  // 🔥 2. FALLBACK (alte Logik bleibt)
  const fallbackPool =
    window.playerPool && window.playerPool.length
      ? window.playerPool
      : game.players || [];

  const players = fallbackPool.filter((p) => {
    const pid = p.team_id ?? p.Team ?? p.teamId ?? null;

    return String(pid) === String(teamId);
  });

  if (!players.length) {
    console.warn("⚠️ Fallback greift – keine team_id gesetzt");
  }

  if (!players.length) {
    console.warn("⚠️ Fallback greift – keine team_id gesetzt");
    return pool.slice(0, 18);
  }

  return players;
}

// =========================
// 📦 EXPORTS
// =========================
export {
  initLeagueSelect,
  populateTeamSelect,
  getSelectedTeam,
  initLeague,
  nextMatch,
  getCurrentRound,
  setLeagueById,
  selectTeamById,
};
