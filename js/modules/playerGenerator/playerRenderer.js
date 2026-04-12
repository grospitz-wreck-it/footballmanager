
// ======================================
// ⚽ PIXEL MANAGER RENDERER V3 (PURE PIXEL ART)
// ======================================

export function drawPlayer(ctx, rand, country, mood="neutral"){

  const size = 64;
  ctx.clearRect(0,0,size,size);
  ctx.imageSmoothingEnabled = false;

  const cx = 32;

  const dna = createDNA(rand);

  // =========================
  // 👤 HEAD (PIXEL BUILT)
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
// 🧬 DNA
// ======================================

function createDNA(rand){

  const skinSet = pick(rand, SKIN_TONES);

  return {
    skinLight: skinSet[0],
    skinMid: skinSet[1],
    skinDark: skinSet[2],

    hairColor: pick(rand, HAIR_COLORS),
    eyeColor: pick(rand, EYE_COLORS),

    headW: 14 + Math.floor(rand()*6),
    headH: 18 + Math.floor(rand()*6),

    eyeSpacing: 6 + Math.floor(rand()*4),
    eyeY: 25 + Math.floor(rand()*2),

    hairStyle: pick(rand, ["short","flat","none"]),
    beard: pick(rand, ["none","short","full"]),

    glasses: rand() < 0.25
  };
}


// ======================================
// 👤 HEAD (TRUE PIXEL OVAL)
// ======================================

function drawHead(ctx, cx, dna){

  const cy = 28;

  for(let y=-dna.headH; y<=dna.headH; y++){

    let t = y / dna.headH;
    let w = Math.round(dna.headW * Math.sqrt(1 - t*t));

    // shading zones
    let color = dna.skinMid;

    if(y < -dna.headH*0.3) color = dna.skinLight;
    if(y > dna.headH*0.4) color = dna.skinDark;

    ctx.fillStyle = color;

    ctx.fillRect(cx - w, cy + y, w*2, 1);
  }
}


// ======================================
// 💇 HAIR (BLOCK STYLE)
// ======================================

function drawHair(ctx, cx, dna){

  if(dna.hairStyle === "none") return;

  ctx.fillStyle = dna.hairColor;

  if(dna.hairStyle === "short"){
    ctx.fillRect(cx-16, 10, 32, 6);
  }

  if(dna.hairStyle === "flat"){
    ctx.fillRect(cx-18, 10, 36, 10);
  }
}


// ======================================
// 👁 EYES (ICONIC)
// ======================================

function drawEyes(ctx, cx, dna){

  const y = dna.eyeY;
  const o = dna.eyeSpacing;

  // whites
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx-o, y, 4, 3);
  ctx.fillRect(cx+o-4, y, 4, 3);

  // iris
  ctx.fillStyle = dna.eyeColor;
  ctx.fillRect(cx-o+1, y, 2, 2);
  ctx.fillRect(cx+o-3, y, 2, 2);

  // pupil
  ctx.fillStyle = "#000";
  ctx.fillRect(cx-o+1, y, 1, 1);
  ctx.fillRect(cx+o-3, y, 1, 1);

  // highlight (critical!)
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx-o+2, y, 1, 1);
  ctx.fillRect(cx+o-2, y, 1, 1);

  // eyebrows
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(cx-o, y-3, 4, 1);
  ctx.fillRect(cx+o-4, y-3, 4, 1);
}


// ======================================
// 👄 MOUTH
// ======================================

function drawMouth(ctx, cx, dna, mood){

  ctx.fillStyle = "#300";

  if(mood === "happy"){
    ctx.fillRect(cx-5, 38, 10, 2);
  }
  else if(mood === "angry"){
    ctx.fillRect(cx-4, 38, 8, 1);
  }
  else{
    ctx.fillRect(cx-3, 38, 6, 1);
  }
}


// ======================================
// 🧔 BEARD
// ======================================

function drawBeard(ctx, cx, dna){

  if(dna.beard === "none") return;

  ctx.fillStyle = "rgba(0,0,0,0.3)";

  if(dna.beard === "short"){
    ctx.fillRect(cx-10, 36, 20, 5);
  }

  if(dna.beard === "full"){
    ctx.fillRect(cx-14, 34, 28, 10);
  }
}


// ======================================
// 👓 ACCESSORIES
// ======================================

function drawAccessories(ctx, cx, dna){

  if(!dna.glasses) return;

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;

  ctx.strokeRect(cx-12, 25, 8, 6);
  ctx.strokeRect(cx+4, 25, 8, 6);

  ctx.beginPath();
  ctx.moveTo(cx-4, 28);
  ctx.lineTo(cx+4, 28);
  ctx.stroke();
}


// ======================================
// 👕 BODY
// ======================================

function drawBody(ctx, cx, country){

  ctx.fillStyle = getColor(country);
  ctx.fillRect(cx-18, 46, 36, 18);

  // collar
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(cx-18, 46, 36, 3);
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

