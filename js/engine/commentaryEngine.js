// =========================
// 🎙 COMMENTARY ENGINE (FINAL STABLE)
// =========================

export function generateText(event){
console.log("🧠 generateText EVENT:", event);
  console.log("🟡 generateText CALLED");

  if(!event){
    console.error("❌ generateText: event ist UNDEFINED");
    return null;
  }

  console.log("🟢 generateText EVENT:", event);

  const type = event.type;

const data = event;
  
  const context = buildContext(event || {});

  switch(type){

    case "GOAL":
      return select(context, GOAL_TEMPLATES, data);

    case "SHOT":
      return select(context, SHOT_TEMPLATES, data);

    case "SAVE":
    case "SHOT_SAVED":
      return select(context, SAVE_TEMPLATES, data);

    case "FOUL":
      return select(context, FOUL_TEMPLATES, data);

    case "CORNER":
      return select(context, CORNER_TEMPLATES, data);

    case "DUEL":
      return select(context, DUEL_TEMPLATES, data);

    case "LEGACY":
      return event.text || null;

    case "PASS":
  return `${getPlayer(data)} spielt einen Pass`;

case "DRIBBLE":
  return `${getPlayer(data)} geht ins Dribbling`;

case "INTERCEPTION":
  return `${getPlayer(data)} fängt den Ball ab`;

case "BALL_LOSS":
  return `${getPlayer(data)} verliert den Ball`;

case "BALL_RECOVERY":
  return `${getPlayer(data)} erobert den Ball`;

case "CLEARANCE":
  return `${getPlayer(data)} klärt die Situation`;
      

    default:
      return null;
  }
}

// =========================
// 🆕 ALIAS
// =========================
export function buildCommentary(event){
  return generateText(event);
}

// =========================
// 🧠 CONTEXT
// =========================
function buildContext(event){

  const minute = event?.minute || 0;
  const score = event?.score || { home: 0, away: 0 };

  const diff = (score.home || 0) - (score.away || 0);

  return {
    minute,
    minutePhase: minute < 15 ? "early" : minute < 70 ? "mid" : "late",
    isDraw: diff === 0,
    isLeading: diff > 0,
    isTrailing: diff < 0,
    drama: minute > 80 ? "high" : minute > 60 ? "medium" : "low"
  };
}

// =========================
// 🎯 TEMPLATE SYSTEM
// =========================

// 🥅 GOAL
const GOAL_TEMPLATES = [
  {
    id: "goal_hype_late",
    weight: 10,
    when: c => c.drama === "high",
    text: d => `⚽ TOOOOR!!! ${getTeam(d)} in der Schlussphase!`
  },
  {
    id: "goal_comeback",
    weight: 8,
    when: c => c.isTrailing,
    text: d => `${getTeam(d)} meldet sich zurück! ${getPlayer(d)} trifft!`
  },
  {
    id: "goal_normal",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} trifft für ${getTeam(d)}`
  },
  {
    id: "goal_clean",
    weight: 4,
    when: () => true,
    text: d => `💥 Abschluss von ${getPlayer(d)} – drin!`
  }
];

// 🎯 SHOT
const SHOT_TEMPLATES = [
  {
    id: "shot_basic",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} zieht ab…`
  },
  {
    id: "shot_pressure",
    weight: 6,
    when: c => c.drama !== "low",
    text: d => `${getTeam(d)} sucht jetzt den Abschluss…`
  }
];

// 🧤 SAVE
const SAVE_TEMPLATES = [
  {
    id: "save_strong",
    weight: 6,
    when: () => true,
    text: d => `🧤 Starke Parade von ${getKeeper(d)}!`
  },
  {
    id: "save_basic",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} schießt – gehalten!`
  }
];

// 🚫 FOUL
const FOUL_TEMPLATES = [
  {
    id: "foul_basic",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} foult im Mittelfeld`
  },
  {
    id: "foul_late",
    weight: 6,
    when: c => c.drama === "high",
    text: d => `Hartes Foul von ${getPlayer(d)} in dieser Phase!`
  }
];

// 🚩 CORNER
const CORNER_TEMPLATES = [
  {
    id: "corner_basic",
    weight: 5,
    when: () => true,
    text: d => `Ecke für ${getTeam(d)}`
  },
  {
    id: "corner_pressure",
    weight: 6,
    when: c => c.drama !== "low",
    text: d => `${getTeam(d)} bleibt dran – Ecke!`
  }
];

// ⚔️ DUEL
const DUEL_TEMPLATES = [
  {
    id: "duel_basic",
    weight: 5,
    when: () => true,
    text: d => `Zweikampf: ${getDuel(d)}`
  }
];

// =========================
// 🆕 PASS
// =========================
const PASS_TEMPLATES = [
  {
    id: "pass_simple",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} spielt einen sauberen Pass`
  },
  {
    id: "pass_forward",
    weight: 6,
    when: () => true,
    text: d => `${getPlayer(d)} mit dem Ball nach vorne`
  },
  {
    id: "pass_safe",
    weight: 4,
    when: () => true,
    text: d => `${getPlayer(d)} hält den Ball in den eigenen Reihen`
  }
];

// =========================
// 🆕 DRIBBLE
// =========================
const DRIBBLE_TEMPLATES = [
  {
    id: "dribble_attack",
    weight: 6,
    when: () => true,
    text: d => `${getPlayer(d)} geht ins Dribbling`
  },
  {
    id: "dribble_push",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} versucht sich durchzusetzen`
  },
  {
    id: "dribble_pressure",
    weight: 4,
    when: c => c.drama !== "low",
    text: d => `${getPlayer(d)} unter Druck am Ball`
  }
];

// =========================
// 🆕 INTERCEPTION
// =========================
const INTERCEPTION_TEMPLATES = [
  {
    id: "intercept_basic",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} fängt den Ball ab`
  },
  {
    id: "intercept_strong",
    weight: 6,
    when: () => true,
    text: d => `${getPlayer(d)} liest das Spiel stark`
  }
];

// =========================
// 🆕 BALL LOSS
// =========================
const BALL_LOSS_TEMPLATES = [
  {
    id: "loss_basic",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} verliert den Ball`
  },
  {
    id: "loss_pressure",
    weight: 6,
    when: c => c.drama !== "low",
    text: d => `${getPlayer(d)} unter Druck – Ball weg`
  }
];

// =========================
// 🆕 RECOVERY
// =========================
const BALL_RECOVERY_TEMPLATES = [
  {
    id: "recovery_basic",
    weight: 5,
    when: () => true,
    text: d => `${getPlayer(d)} erobert den Ball`
  },
  {
    id: "recovery_fast",
    weight: 6,
    when: () => true,
    text: d => `${getPlayer(d)} schaltet schnell um und gewinnt den Ball`
  }
];


// =========================
// ⚖️ SELECTOR
// =========================

const memory = [];
const MEMORY_LIMIT = 6;

function select(context, templates, data){

  let pool = templates.filter(t => {
    try { return t.when(context); }
    catch { return true; }
  });

  pool = pool.filter(t => !memory.includes(t.id));

  if(pool.length === 0) pool = templates;

  const chosen = weightedRandom(pool);

  memory.push(chosen.id);
  if(memory.length > MEMORY_LIMIT){
    memory.shift();
  }

  try {
    return chosen.text(data);
  } catch(e){
    console.error("❌ Template Error:", e);
    return null;
  }
}

// =========================
// 🎲 RANDOM
// =========================

function weightedRandom(arr){

  const total = arr.reduce((sum, item) => sum + (item.weight || 1), 0);
  let r = Math.random() * total;

  for(const item of arr){
    r -= item.weight || 1;
    if(r <= 0) return item;
  }

  return arr[0];
}

// =========================
// 🧠 GETTER (FINAL FIXED)
// =========================

function getPlayer(data){

  if(!data) return "ein Spieler";

  if(data.playerName) return data.playerName;

  if(typeof data.player === "string") return data.player;
  if(typeof data.shooter === "string") return data.shooter;
  if(typeof data.scorer === "string") return data.scorer;

  if(data.player?.name) return data.player.name;
  if(data.player?.Name) return data.player.Name;

  return "ein Spieler";
}

function getKeeper(data){

  if(!data) return "der Torwart";

  return (
    data.keeperName ||
    data.keeper?.Name ||
    data.keeper?.name ||
    "der Torwart"
  );
}

function getTeam(data){

  if(!data) return "ein Team";

  // 🔥 wichtig: dein alter funktionierender fallback bleibt!
  if(data.teamName) return data.teamName;

  if(data.team?.name) return data.team.name;
  if(data.team?.Name) return data.team.Name;

  // 🔥 DAS WAR DER WICHTIGE TEIL
  if(data.team) return data.team;

  return "ein Team";
}

function getDuel(data){

  if(!data) return "zwei Spieler";

  if(data.p1 || data.p2){
    const p1 = data.p1 || "Spieler A";
    const p2 = data.p2 || "Spieler B";
    return `${p1} gegen ${p2}`;
  }

  if(data.playerName){
    return `${data.playerName}`;
  }

  return "zwei Spieler";
}
