// =========================
// 🎙 COMMENTARY ENGINE (FINAL STABLE)
// =========================

export function generateText(event) {
  console.log("🧠 generateText EVENT:", event);
  console.log("🟡 generateText CALLED");

  if (!event) {
    console.error("❌ generateText: event ist UNDEFINED");
    return null;
  }

  console.log("🟢 generateText EVENT:", event);

  const type = event.type;

  const data = event;

  const context = buildContext(event || {});

  switch (type) {
    case "GOAL":
      return select(context, GOAL_TEMPLATES, data);

    case "SHOT":
      return select(context, SHOT_TEMPLATES, data);

    case "SAVE":
    case "SHOT_SAVED":
      return select(context, SAVE_TEMPLATES, data);

    case "FOUL":
      return select(context, FOUL_TEMPLATES, data);

    case "RED_CARD":
      return select(context, RED_CARD_TEMPLATES, data);

    case "INJURY":
      return select(context, INJURY_TEMPLATES, data);

    case "CORNER":
      return select(context, CORNER_TEMPLATES, data);

    case "DUEL":
      return select(context, DUEL_TEMPLATES, data);

    case "LEGACY":
      return event.text || null;

    case "PASS":
      return select(context, PASS_TEMPLATES, data);

    case "DRIBBLE":
      return select(context, DRIBBLE_TEMPLATES, data);

    case "INTERCEPTION":
      return select(context, INTERCEPTION_TEMPLATES, data);

    case "BALL_LOSS":
      return select(context, BALL_LOSS_TEMPLATES, data);

    case "BALL_RECOVERY":
      return select(context, BALL_RECOVERY_TEMPLATES, data);

    case "CLEARANCE":
      return `${getPlayer(data)} klärt die Situation`;

    default:
      return null;
  }
}

// =========================
// 🆕 ALIAS
// =========================
export function buildCommentary(event) {
  return generateText(event);
}

// =========================
// 🧠 CONTEXT
// =========================
function buildContext(event) {
  const minute = event?.minute || 0;
  const score = event?.score || { home: 0, away: 0 };

  const diff = (score.home || 0) - (score.away || 0);

  return {
    minute,
    minutePhase: minute < 15 ? "early" : minute < 70 ? "mid" : "late",
    isDraw: diff === 0,
    isLeading: diff > 0,
    isTrailing: diff < 0,
    drama: minute > 80 ? "high" : minute > 60 ? "medium" : "low",
  };
}

// =========================
// 🎯 TEMPLATE SYSTEM
// =========================

// 🥅 GOAL
const GOAL_TEMPLATES = [
  {
    id: "goal_last_minute",
    weight: 12,
    when: (c) => c.minute > 85,
    text: (d) =>
      `⚽ UNGLAUBLICH! ${getPlayer(d)} trifft spät für ${getTeam(d)}!`,
  },
  {
    id: "goal_comeback",
    weight: 10,
    when: (c) => c.isTrailing,
    text: (d) => `${getTeam(d)} ist zurück im Spiel! ${getPlayer(d)} trifft!`,
  },
  {
    id: "goal_leading_extend",
    weight: 8,
    when: (c) => c.isLeading,
    text: (d) => `${getTeam(d)} baut die Führung aus – ${getPlayer(d)} trifft`,
  },
  {
    id: "goal_counter",
    weight: 7,
    when: () => true,
    text: (d) =>
      `⚡ Schneller Angriff! ${getPlayer(d)} vollendet für ${getTeam(d)}`,
  },
  {
    id: "goal_clean_finish",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} bleibt eiskalt vor dem Tor`,
  },
  {
    id: "goal_power",
    weight: 6,
    when: () => true,
    text: (d) => `💥 Wuchtiger Abschluss von ${getPlayer(d)} – drin!`,
  },
  {
    id: "goal_simple",
    weight: 4,
    when: () => true,
    text: (d) => `${getPlayer(d)} trifft für ${getTeam(d)}`,
  },
];

// 🎯 SHOT
const SHOT_TEMPLATES = [
  {
    id: "shot_pressure",
    weight: 7,
    when: (c) => c.drama !== "low",
    text: (d) => `${getTeam(d)} drückt – ${getPlayer(d)} zieht ab!`,
  },
  {
    id: "shot_distance",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} versucht es aus der Distanz`,
  },
  {
    id: "shot_quick",
    weight: 5,
    when: () => true,
    text: (d) => `${getPlayer(d)} kommt schnell zum Abschluss`,
  },
  {
    id: "shot_basic",
    weight: 4,
    when: () => true,
    text: (d) => `${getPlayer(d)} schießt`,
  },
];

// 🧤 SAVE
const SAVE_TEMPLATES = [
  {
    id: "save_big",
    weight: 8,
    when: (c) => c.drama === "high",
    text: (d) => `🧤 WAS FÜR EINE PARADE von ${getKeeper(d)}!`,
  },
  {
    id: "save_reaction",
    weight: 6,
    when: () => true,
    text: (d) => `${getKeeper(d)} reagiert blitzschnell`,
  },
  {
    id: "save_safe",
    weight: 5,
    when: () => true,
    text: (d) => `${getKeeper(d)} hält sicher`,
  },
  {
    id: "save_basic",
    weight: 4,
    when: () => true,
    text: (d) => `Schuss gehalten`,
  },
];

// 🚫 FOUL
const FOUL_TEMPLATES = [
  {
    id: "foul_hard",
    weight: 7,
    when: (c) => c.drama === "high",
    text: (d) => `💢 Hartes Einsteigen von ${getPlayer(d)}!`,
  },
  {
    id: "foul_stop_attack",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} stoppt den Angriff mit einem Foul`,
  },
  {
    id: "foul_mid",
    weight: 5,
    when: () => true,
    text: (d) => `Foul im Mittelfeld von ${getPlayer(d)}`,
  },
  {
    id: "foul_light",
    weight: 4,
    when: () => true,
    text: (d) => `Leichtes Foulspiel`,
  },
];

// 🟥 RED CARD
const RED_CARD_TEMPLATES = [
  {
    id: "red_card_standard",
    weight: 10,
    when: () => true,
    text: (d) =>
      `🟥 ${getPlayer(d)} sieht Rot und wird für ${d.matchesOut || 2} Spiele gesperrt!`,
  },
  {
    id: "red_card_hard",
    weight: 7,
    when: () => true,
    text: (d) => `💥 Platzverweis! ${getPlayer(d)} fliegt vom Platz`,
  },
  {
    id: "red_card_drama",
    weight: 5,
    when: (c) => c.drama === "high",
    text: (d) => `🟥 Drama pur! ${getPlayer(d)} muss sofort runter`,
  },
];

// 🤕 INJURY
const INJURY_TEMPLATES = [
  {
    id: "injury_minor",
    weight: 10,
    when: (d) => (d.matchesOut || 1) <= 1,
    text: (d) => `🤕 ${getPlayer(d)} muss verletzt runter`,
  },
  {
    id: "injury_medium",
    weight: 8,
    when: (d) => (d.matchesOut || 1) <= 4,
    text: (d) =>
      `🚑 ${getPlayer(d)} fällt voraussichtlich ${d.matchesOut} Spiele aus`,
  },
  {
    id: "injury_severe",
    weight: 5,
    when: (d) => (d.matchesOut || 1) > 4,
    text: (d) => `😱 Bitter! ${getPlayer(d)} verletzt sich schwer`,
  },
];

// 🚩 CORNER
const CORNER_TEMPLATES = [
  {
    id: "corner_pressure",
    weight: 7,
    when: (c) => c.drama !== "low",
    text: (d) => `${getTeam(d)} erhöht den Druck – Ecke!`,
  },
  {
    id: "corner_danger",
    weight: 6,
    when: () => true,
    text: (d) => `Gefährliche Ecke für ${getTeam(d)}`,
  },
  {
    id: "corner_standard",
    weight: 5,
    when: () => true,
    text: (d) => `Eckball für ${getTeam(d)}`,
  },
];

// ⚔️ DUEL
const DUEL_TEMPLATES = [
  {
    id: "duel_intense",
    weight: 7,
    when: (c) => c.drama !== "low",
    text: (d) => `⚔️ Intensiver Zweikampf: ${getDuel(d)}`,
  },
  {
    id: "duel_midfield",
    weight: 6,
    when: () => true,
    text: (d) => `Zweikampf im Mittelfeld`,
  },
  {
    id: "duel_simple",
    weight: 5,
    when: () => true,
    text: (d) => `${getDuel(d)} im Duell`,
  },
];

// =========================
// 🆕 PASS
// =========================
const PASS_TEMPLATES = [
  {
    id: "pass_simple",
    weight: 5,
    when: () => true,
    text: (d) => `${getPlayer(d)} spielt einen sauberen Pass`,
  },
  {
    id: "pass_forward",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} mit dem Ball nach vorne`,
  },
  {
    id: "pass_safe",
    weight: 4,
    when: () => true,
    text: (d) => `${getPlayer(d)} hält den Ball in den eigenen Reihen`,
  },
];

// =========================
// 🆕 DRIBBLE
// =========================
const DRIBBLE_TEMPLATES = [
  {
    id: "dribble_attack",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} geht ins Dribbling`,
  },
  {
    id: "dribble_push",
    weight: 5,
    when: () => true,
    text: (d) => `${getPlayer(d)} versucht sich durchzusetzen`,
  },
  {
    id: "dribble_pressure",
    weight: 4,
    when: (c) => c.drama !== "low",
    text: (d) => `${getPlayer(d)} unter Druck am Ball`,
  },
];

// =========================
// 🆕 INTERCEPTION
// =========================
const INTERCEPTION_TEMPLATES = [
  {
    id: "intercept_basic",
    weight: 5,
    when: () => true,
    text: (d) => `${getPlayer(d)} fängt den Ball ab`,
  },
  {
    id: "intercept_strong",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} liest das Spiel stark`,
  },
];

// =========================
// 🆕 BALL LOSS
// =========================
const BALL_LOSS_TEMPLATES = [
  {
    id: "loss_basic",
    weight: 5,
    when: () => true,
    text: (d) => `${getPlayer(d)} verliert den Ball`,
  },
  {
    id: "loss_pressure",
    weight: 6,
    when: (c) => c.drama !== "low",
    text: (d) => `${getPlayer(d)} unter Druck – Ball weg`,
  },
];

// =========================
// 🆕 RECOVERY
// =========================
const BALL_RECOVERY_TEMPLATES = [
  {
    id: "recovery_basic",
    weight: 5,
    when: () => true,
    text: (d) => `${getPlayer(d)} erobert den Ball`,
  },
  {
    id: "recovery_fast",
    weight: 6,
    when: () => true,
    text: (d) => `${getPlayer(d)} schaltet schnell um und gewinnt den Ball`,
  },
];

// =========================
// ⚖️ SELECTOR
// =========================

const memory = [];
let lastLine = null;
const MEMORY_LIMIT = 6;

function select(context, templates, data) {
  let pool = templates.filter((t) => {
    try {
      return t.when(context);
    } catch {
      return true;
    }
  });

  pool = pool.filter((t) => !memory.includes(t.id));

  if (pool.length === 0) pool = templates;

  const chosen = weightedRandom(pool);

  memory.push(chosen.id);
  if (memory.length > MEMORY_LIMIT) {
    memory.shift();
  }
  const prefixPool = ["", "🔥 ", "👉 ", "⚡ ", "💬 "];

  const prefix = prefixPool[Math.floor(Math.random() * prefixPool.length)];

  try {
    let line = chosen.text(data);

    // =========================
    // 🔗 CONTINUATION LOGIC
    // =========================
    if (lastLine && Math.random() < 0.35) {
      const connectors = ["… ", "— ", "… und ", "… jetzt "];

      const joiner = connectors[Math.floor(Math.random() * connectors.length)];

      line = joiner + line;
    }

    // speichern für nächsten Tick
    lastLine = line;

    // =========================
    // 🎯 RETURN
    // =========================
    return prefix + line;
  } catch (e) {
    console.error("❌ Template Error:", e);
    return null;
  }
}
// =========================
// 🎲 RANDOM
// =========================

function weightedRandom(arr) {
  const total = arr.reduce((sum, item) => sum + (item.weight || 1), 0);
  let r = Math.random() * total;

  for (const item of arr) {
    r -= item.weight || 1;
    if (r <= 0) return item;
  }

  return arr[0];
}

// =========================
// 🧠 GETTER (FINAL FIXED)
// =========================

// =========================
// 🧠 SAFE PLAYER RESOLVERS
// CLEAN / BROADCAST VERSION
// =========================

function getPlayer(data) {

  if (!data) {
    return "ein Spieler";
  }

  // =========================
  // 🔥 DIRECT STRINGS
  // =========================
  if (
    typeof data.playerName ===
    "string"
  ) {
    return data.playerName;
  }

  if (
    typeof data.player ===
    "string"
  ) {
    return data.player;
  }

  if (
    typeof data.shooter ===
    "string"
  ) {
    return data.shooter;
  }

  if (
    typeof data.scorer ===
    "string"
  ) {
    return data.scorer;
  }

  // =========================
  // 👤 OBJECTS
  // =========================
  if (
    data.player?.name
  ) {
    return data.player.name;
  }

  if (
    data.player?.Name
  ) {
    return data.player.Name;
  }

  if (
    data.shooter?.name
  ) {
    return data.shooter.name;
  }

  if (
    data.shooter?.Name
  ) {
    return data.shooter.Name;
  }

  if (
    data.scorer?.name
  ) {
    return data.scorer.name;
  }

  if (
    data.scorer?.Name
  ) {
    return data.scorer.Name;
  }

  // =========================
  // 🔥 PLAYER ID FALLBACK
  // =========================
  const playerId =

    data.playerId ||
    data.scorerId ||
    data.shooterId;

  if (
    playerId &&
    Array.isArray(
      game.players,
    )
  ) {

    const found =
      game.players.find(
        (p) =>

          String(p.id) ===
          String(playerId),
      );

    if (
      found?.name
    ) {
      return found.name;
    }

    if (
      found?.Name
    ) {
      return found.Name;
    }
  }

  return "ein Spieler";
}

// =========================
// 🧤 KEEPER
// =========================
function getKeeper(data) {

  if (!data) {
    return "der Keeper";
  }

  if (
    typeof data.keeperName ===
    "string"
  ) {
    return data.keeperName;
  }

  if (
    data.keeper?.name
  ) {
    return data.keeper.name;
  }

  if (
    data.keeper?.Name
  ) {
    return data.keeper.Name;
  }

  // 🔥 ID FALLBACK
  if (
    data.keeperId &&
    Array.isArray(
      game.players,
    )
  ) {

    const found =
      game.players.find(
        (p) =>

          String(p.id) ===
          String(
            data.keeperId,
          ),
      );

    if (
      found?.name
    ) {
      return found.name;
    }

    if (
      found?.Name
    ) {
      return found.Name;
    }
  }

  return "der Keeper";
}

// =========================
// 🏟 TEAM
// =========================
function getTeam(data) {

  if (!data) {
    return "ein Team";
  }

  // =========================
  // 🔥 DIRECT TEAM NAME
  // =========================
  if (
    typeof data.teamName ===
    "string"
  ) {
    return data.teamName;
  }

  // =========================
  // 🧠 OBJECT TEAM
  // =========================
  if (
    data.team?.name
  ) {
    return data.team.name;
  }

  if (
    data.team?.Name
  ) {
    return data.team.Name;
  }

  // =========================
  // 🔥 STRING TEAM
  // =========================
  if (
    typeof data.team ===
    "string"
  ) {
    return data.team;
  }

  // =========================
  // 🔥 TEAM ID FALLBACK
  // =========================
  const teamId =
    data.teamId;

  if (
    teamId &&
    typeof getTeamNameById ===
      "function"
  ) {

    const name =
      getTeamNameById(
        teamId,
      );

    if (name) {
      return name;
    }
  }

  // =========================
  // 🔥 MATCH CONTEXT
  // =========================
  const home =
    game.match?.home
      ?.name;

  const away =
    game.match?.away
      ?.name;

  if (
    home &&
    away
  ) {

    return (
      Math.random() < 0.5
        ? home
        : away
    );
  }

  return "das Team";
}

// =========================
// ⚔️ DUEL
// =========================
function getDuel(data) {

  if (!data) {
    return "zwei Spieler";
  }

  // =========================
  // 👥 DIRECT PLAYERS
  // =========================
  if (
    data.p1 ||
    data.p2
  ) {

    const p1 =
      data.p1 ||
      "Spieler A";

    const p2 =
      data.p2 ||
      "Spieler B";

    return `${p1} gegen ${p2}`;
  }

  // =========================
  // 🧠 PLAYER NAME
  // =========================
  if (
    data.playerName
  ) {
    return data.playerName;
  }

  // =========================
  // 🔥 RELATED PLAYER
  // =========================
  if (
    data.playerId &&
    data.relatedPlayerId &&
    Array.isArray(
      game.players,
    )
  ) {

    const p1 =
      game.players.find(
        (p) =>

          String(p.id) ===
          String(
            data.playerId,
          ),
      );

    const p2 =
      game.players.find(
        (p) =>

          String(p.id) ===
          String(
            data.relatedPlayerId,
          ),
      );

    if (
      p1 &&
      p2
    ) {

      return `${
        p1.name ||
        p1.Name ||
        "Spieler A"
      } gegen ${
        p2.name ||
        p2.Name ||
        "Spieler B"
      }`;
    }
  }

  return "zwei Spieler";
}
