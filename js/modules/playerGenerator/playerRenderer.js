
// ======================================
// ⚽ HIGH QUALITY PIXEL MANAGER (PRO)
// ======================================

export function drawPlayer(ctx, rand, country, mood="neutral"){

  const size = 64;
  ctx.clearRect(0,0,size,size);
  ctx.imageSmoothingEnabled = false;

  const cx = 32;

  // =========================
  // 🧬 DNA SYSTEM
  // =========================
  const dna = createDNA(rand);

  // =========================
  // 👤 HEAD
  // =========================
  drawHead(ctx, cx, dna);

  // =========================
  // 💇 HAIR
  // =========================
  drawHair(ctx, cx, dna);

  // =========================
  // 👁 EYES
  // =========================
  drawEyes(ctx, cx, dna);

  // =========================
  // 👄 MOUTH
  // =========================
  drawMouth(ctx, cx, dna, mood);

  // =========================
  // 🧔 BEARD
  // =========================
  drawBeard(ctx, cx, dna);

  // =========================
  // 👓 ACCESSORIES
  // =========================
  drawAccessories(ctx, cx, dna);

  // =========================
  // 👕 BODY
  // =========================
  drawBody(ctx, cx, country);
}


// ======================================
// 🧬 DNA GENERATION
// ======================================

function createDNA(rand){

  const skinSet = pick(rand, SKIN_TONES);

  return {
    skinLight: skinSet[0],
    skinMid: skinSet[1],
    skinDark: skinSet[2],

    hairColor: pick(rand, HAIR_COLORS),
    eyeColor: pick(rand, EYE_COLORS),

    headType: pick(rand, ["round","oval","wide"]),
    hairStyle: pick(rand, ["short","long","bald"]),
    eyeType: pick(rand, ["small","normal"]),
    beard: pick(rand, ["none","short","full"]),

    glasses: rand() < 0.25,
    accessory: rand() < 0.15 ? "band" : null
  };
}


// ======================================
// 👤 HEAD
// ======================================

function drawHead(ctx, cx, dna){

  ctx.fillStyle = dna.skinMid;

  if(dna.headType === "round"){
    ctx.beginPath();
    ctx.arc(cx, 28, 18, 0, Math.PI*2);
    ctx.fill();
  }

  if(dna.headType === "oval"){
    ctx.beginPath();
    ctx.ellipse(cx, 28, 16, 20, 0, 0, Math.PI*2);
    ctx.fill();
  }

  if(dna.headType === "wide"){
    ctx.beginPath();
    ctx.ellipse(cx, 28, 20, 18, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // shading bottom
  ctx.fillStyle = dna.skinDark;
  ctx.fillRect(cx-20, 28, 40, 16);

  // highlight top
  ctx.fillStyle = dna.skinLight;
  ctx.fillRect(cx-20, 12, 40, 6);
}


// ======================================
// 💇 HAIR
// ======================================

function drawHair(ctx, cx, dna){

  if(dna.hairStyle === "bald") return;

  ctx.fillStyle = dna.hairColor;

  if(dna.hairStyle === "short"){
    ctx.fillRect(cx-18, 10, 36, 10);
  }

  if(dna.hairStyle === "long"){
    ctx.fillRect(cx-20, 10, 40, 18);
  }
}


// ======================================
// 👁 EYES
// ======================================

function drawEyes(ctx, cx, dna){

  const y = 26;
  const offset = 8;

  ctx.fillStyle = "#fff";

  ctx.fillRect(cx-offset, y, 4, 3);
  ctx.fillRect(cx+offset-4, y, 4, 3);

  ctx.fillStyle = dna.eyeColor;

  ctx.fillRect(cx-offset+1, y, 2, 2);
  ctx.fillRect(cx+offset-3, y, 2, 2);

  ctx.fillStyle = "#000";

  ctx.fillRect(cx-offset+1, y, 1, 1);
  ctx.fillRect(cx+offset-3, y, 1, 1);
}


// ======================================
// 👄 MOUTH
// ======================================

function drawMouth(ctx, cx, dna, mood){

  ctx.fillStyle = "#400";

  if(mood === "happy"){
    ctx.fillRect(cx-6, 38, 12, 2);
  } else if(mood === "angry"){
    ctx.fillRect(cx-5, 38, 10, 1);
  } else {
    ctx.fillRect(cx-4, 38, 8, 2);
  }
}


// ======================================
// 🧔 BEARD
// ======================================

function drawBeard(ctx, cx, dna){

  if(dna.beard === "none") return;

  ctx.fillStyle = "rgba(0,0,0,0.25)";

  if(dna.beard === "short"){
    ctx.fillRect(cx-10, 36, 20, 6);
  }

  if(dna.beard === "full"){
    ctx.fillRect(cx-14, 34, 28, 10);
  }
}


// ======================================
// 👓 ACCESSORIES
// ======================================

function drawAccessories(ctx, cx, dna){

  if(dna.glasses){
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    ctx.strokeRect(cx-12, 25, 8, 6);
    ctx.strokeRect(cx+4, 25, 8, 6);

    ctx.beginPath();
    ctx.moveTo(cx-4, 28);
    ctx.lineTo(cx+4, 28);
    ctx.stroke();
  }

  if(dna.accessory === "band"){
    ctx.fillStyle = "#222";
    ctx.fillRect(cx-20, 18, 40, 4);
  }
}


// ======================================
// 👕 BODY
// ======================================

function drawBody(ctx, cx, country){
  ctx.fillStyle = getColor(country);
  ctx.fillRect(cx-20, 46, 40, 18);
}


// ======================================
// 🎨 PALETTES
// ======================================

const SKIN_TONES = [
  ["#f6e0c9","#e9c2a6","#d9a07a"],
  ["#eac39b","#d29a6a","#b97c4f"],
  ["#c68642","#a86b33","#7c4a1f"],
  ["#8d5524","#6f3f1a","#4e2a12"]
];

const HAIR_COLORS = [
  "#1c1c1c","#3b2f2f","#6b4f3a","#d6a77a","#c0c0c0"
];

const EYE_COLORS = [
  "#000","#3b2f2f","#1f3b2f","#2a2a5a"
];


// ======================================
// 🧩 HELPERS
// ======================================

function pick(rand, arr){
  return arr[Math.floor(rand()*arr.length)];
}

function getColor(code){
  return {
    DE:"#dd0000",
    FR:"#0055A4",
    BR:"#009C3B"
  }[code] || "#888";
}
