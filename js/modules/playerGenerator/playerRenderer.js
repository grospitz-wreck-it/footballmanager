
// ======================================
// ⚽ PIXEL MANAGER RENDERER V4 (ADVANCED)
// ======================================

export function drawPlayer(ctx, rand, country, mood="neutral", quality=0.5){

  const size = 64;
  ctx.clearRect(0,0,size,size);
  ctx.imageSmoothingEnabled = false;

  const cx = 32;

  const dna = createDNA(rand, country, quality);

  drawHead(ctx, cx, dna);
  drawEars(ctx, cx, dna);
  drawHair(ctx, cx, dna);
  drawEyes(ctx, cx, dna);
  drawNose(ctx, cx, dna);
  drawMouth(ctx, cx, dna, mood);
  drawBeard(ctx, cx, dna);
  drawAccessories(ctx, cx, dna);
  drawBody(ctx, cx, country);
}


// ======================================
// 🧬 DNA SYSTEM (UPGRADED)
// ======================================


function createDNA(rand, country, quality){

  const type = pick(rand, [
    "winger","playmaker","defender","striker","keeper","youth"
  ]);

  const skinSet = pick(rand, SKIN_TONES);

  let dna = {
    skinLight: skinSet[0],
    skinMid: skinSet[1],
    skinDark: skinSet[2],

    hairColor: pick(rand, HAIR_COLORS),
    eyeColor: pick(rand, EYE_COLORS),

    glasses: false,
    beard: "none",

    // defaults
    headW: 16,
    headH: 20,
    eyeSpacing: 7,
    eyeY: 25,
    noseType: "small",
    jawWidth: 2,
    cheekWidth: 2
  };

  // =========================
  // ⚽ ARCHETYPE SHAPING
  // =========================

  if(type === "winger"){
    dna.headW = 14;
    dna.headH = 20;
    dna.eyeSpacing = 8;
  }

  if(type === "playmaker"){
    dna.headH = 22;
    dna.beard = rand() < 0.6 ? "short" : "none";
    dna.glasses = rand() < 0.2;
  }

  if(type === "defender"){
    dna.headW = 20;
    dna.jawWidth = 5;
    dna.eyeSpacing = 6;
  }

  if(type === "striker"){
    dna.noseType = pick(rand, ["long","wide"]);
    dna.eyeSpacing = 7;
  }

  if(type === "keeper"){
    dna.headH = 24;
    dna.eyeSpacing = 9;
  }

  if(type === "youth"){
    dna.headW = 15;
    dna.headH = 18;
    dna.eyeSpacing = 8;
    dna.beard = "none";
  }

  // =========================
  // ⭐ QUALITY (STARS LOOK BETTER)
  // =========================
  if(rand() < quality){
    dna.eyeSpacing += 1;
    dna.headW += 1;
  }

  // =========================
  // 🎲 ASYMMETRY (CRITICAL!)
  // =========================
  dna.eyeOffsetL = Math.floor(rand()*2);
  dna.eyeOffsetR = Math.floor(rand()*2);

  return dna;
}




// ======================================
// 👤 HEAD (MULTI-ZONE)
// ======================================

function drawHead(ctx, cx, dna){

  const cy = 28;

  for(let y=-dna.headH; y<=dna.headH; y++){

    let t = y / dna.headH;
    let w = Math.round(dna.headW * Math.sqrt(1 - t*t));

    // cheeks widen
    if(y > 0 && y < dna.headH/2){
      w += dna.cheekWidth;
    }

    // jaw
    if(y > dna.headH/2){
      w += dna.jawWidth;
    }

    let color = dna.skinMid;

    if(y < -dna.headH*0.3) color = dna.skinLight;
    if(y > dna.headH*0.4) color = dna.skinDark;

    ctx.fillStyle = color;
    ctx.fillRect(cx - w, cy + y, w*2, 1);
  }
}


// ======================================
// 👂 EARS
// ======================================

function drawEars(ctx, cx, dna){

  ctx.fillStyle = dna.skinMid;

  ctx.fillRect(cx - dna.headW - 2, 28, dna.earSize, 6);
  ctx.fillRect(cx + dna.headW + 2 - dna.earSize, 28, dna.earSize, 6);
}


// ======================================
// 💇 HAIR
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
// 👁 EYES
// ======================================

function drawEyes(ctx, cx, dna){

  const y = dna.eyeY;

  // 👁 individuelle Offsets (ASYMMETRIE!)
  const oL = dna.eyeSpacing;
  const oR = dna.eyeSpacing + (dna.eyeOffsetR || 0);

  const yL = y + (dna.eyeOffsetYL || 0);
  const yR = y + (dna.eyeOffsetYR || 0);

  const sizeL = dna.eyeSizeL || 4;
  const sizeR = dna.eyeSizeR || 4;

  // =========================
  // 👁 LEFT EYE
  // =========================
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - oL, yL, sizeL, 3);

  ctx.fillStyle = dna.eyeColor;
  ctx.fillRect(cx - oL + 1, yL, 2, 2);

  ctx.fillStyle = "#000";
  ctx.fillRect(cx - oL + 1, yL, 1, 1);

  // =========================
  // 👁 RIGHT EYE
  // =========================
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx + oR - sizeR, yR, sizeR, 3);

  ctx.fillStyle = dna.eyeColor;
  ctx.fillRect(cx + oR - sizeR + 1, yR, 2, 2);

  ctx.fillStyle = "#000";
  ctx.fillRect(cx + oR - sizeR + 1, yR, 1, 1);

  // =========================
  // ✨ HIGHLIGHTS (optional)
  // =========================
  if(dna.detail){
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - oL + 2, yL, 1, 1);
    ctx.fillRect(cx + oR - 2, yR, 1, 1);
  }

  // =========================
  // 👁 EYEBROWS (CHARACTER!)
  // =========================
  ctx.fillStyle = "rgba(0,0,0,0.5)";

  // leicht unterschiedlich
  ctx.fillRect(cx - oL, yL - 3, sizeL, 1);
  ctx.fillRect(cx + oR - sizeR, yR - 3 + (dna.browOffset || 0), sizeR, 1);
}



// ======================================
// 👃 NOSE (NEW!)
// ======================================

function drawNose(ctx, cx, dna){

  ctx.fillStyle = dna.skinDark;

  if(dna.noseType === "small"){
    ctx.fillRect(cx-1, 30, 2, 2);
  }

  if(dna.noseType === "wide"){
    ctx.fillRect(cx-2, 30, 4, 2);
  }

  if(dna.noseType === "long"){
    ctx.fillRect(cx-1, 30, 2, 4);
  }
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

  ctx.strokeRect(cx-12, dna.eyeY, 8, 6);
  ctx.strokeRect(cx+4, dna.eyeY, 8, 6);

  ctx.beginPath();
  ctx.moveTo(cx-4, dna.eyeY+3);
  ctx.lineTo(cx+4, dna.eyeY+3);
  ctx.stroke();
}


// ======================================
// 👕 BODY
// ======================================

function drawBody(ctx, cx, country){

  ctx.fillStyle = getColor(country);
  ctx.fillRect(cx-18, 46, 36, 18);

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(cx-18, 46, 36, 3);
}


// ======================================
// 🎨 PALETTES + REGION
// ======================================

const SKIN_TONES = [
  ["#f6e0c9","#e9c2a6","#d9a07a"],
  ["#eac39b","#d29a6a","#b97c4f"],
  ["#c68642","#a86b33","#7c4a1f"],
  ["#8d5524","#6f3f1a","#4e2a12"]
];

const SKIN_BY_REGION = {
  BR: SKIN_TONES,
  FR: SKIN_TONES,
  DE: SKIN_TONES
};

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

