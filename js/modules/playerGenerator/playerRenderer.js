
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
  // 🎭 ARCHETYPES
  // =========================

  if(type === "defender"){
    dna.headW = 20;
    dna.jawWidth = 5;
    dna.beard = pick(rand, ["stubble","full"]);
  }

  if(type === "playmaker"){
    dna.headH = 22;
    dna.beard = pick(rand, ["goatee","mustache","none"]);
    dna.glasses = rand() < 0.2;
  }

  if(type === "winger"){
    dna.headW = 14;
    dna.eyeSpacing = 8;
  }

  if(type === "keeper"){
    dna.headH = 24;
    dna.eyeSpacing = 9;
  }

  if(type === "striker"){
    dna.noseType = pick(rand, ["long","wide"]);
  }

  // =========================
  // 🎲 GENERAL VARIATION
  // =========================

  // nur wenn noch kein Bart gesetzt wurde
  if(dna.beard === "none"){
    dna.beard = pick(rand, [
      "none",
      "stubble",
      "goatee",
      "chin",
      "full",
      "mustache"
    ]);
  }

  // =========================
  // 🚫 HARD OVERRIDES
  // =========================

  if(type === "youth"){
    dna.beard = "none";
    dna.headH = 18;
    dna.eyeSpacing = 8;
  }

  return dna;
}


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

  const cy = 28;

  const wL = dna.earSize + (dna.earOffsetL || 0);
  const wR = dna.earSize + (dna.earOffsetR || 0);

  const hL = 5 + (dna.earHeightL || 0);
  const hR = 5 + (dna.earHeightR || 0);

  const yL = cy + (dna.earYL || 0);
  const yR = cy + (dna.earYR || 0);

  // =========================
  // 👂 LEFT EAR
  // =========================
  drawEar(ctx, cx - dna.headW - 2, yL, wL, hL, dna);

  // =========================
  // 👂 RIGHT EAR
  // =========================
  drawEar(ctx, cx + dna.headW + 2 - wR, yR, wR, hR, dna);
}


function drawEar(ctx, x, y, w, h, dna){

  // Grundform (leicht oval)
  for(let i=0; i<h; i++){

    let shrink = Math.floor(i/3);

    ctx.fillStyle = dna.skinMid;
    ctx.fillRect(x + shrink, y + i, w - shrink*2, 1);
  }

  // Schatten innen (Tiefe!)
  ctx.fillStyle = dna.skinDark;
  ctx.fillRect(x + 1, y + 2, Math.max(1, w-2), 1);

  // Highlight oben
  ctx.fillStyle = dna.skinLight;
  ctx.fillRect(x + 1, y, Math.max(1, w-2), 1);
}



// ======================================
// 💇 HAIR
// ======================================

function drawHair(ctx, cx, dna, rand){

  if(dna.hairStyle === "none") return;

  ctx.fillStyle = dna.hairColor;

  const top = 10;
  const w = dna.headW + 2;

  // =========================
  // ✂️ CROP (klassisch)
  // =========================
  if(dna.hairStyle === "crop"){

    for(let y=0; y<dna.hairHeight; y++){
      let width = w - Math.floor(y/2);
      ctx.fillRect(cx - width, top + y, width*2, 1);
    }
  }

  // =========================
  // 🌊 MESSY (DOTT STYLE)
  // =========================
  if(dna.hairStyle === "messy"){

    for(let y=0; y<dna.hairHeight; y++){

      let width = w - Math.floor(y/3);

      // asymmetrie!
      let shift = Math.floor(rand()*3) - 1;

      ctx.fillRect(cx - width + shift, top + y, width*2, 1);
    }

    // stray pixels (controlled!)
    if(rand() < 0.3){
      ctx.fillRect(cx - w - 1, top + 2, 2, 1);
    }
  }

  // =========================
  // 🧱 FLAT TOP
  // =========================
  if(dna.hairStyle === "flat"){

    ctx.fillRect(cx - w, top, w*2, dna.hairHeight);

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(cx - w, top + dna.hairHeight - 1, w*2, 1);
  }

  // =========================
  // 🔪 SIDECUT
  // =========================
  if(dna.hairStyle === "sidecut"){

    ctx.fillRect(cx - w, top, w*2, dna.hairHeight);

    // eine Seite kürzer
    ctx.clearRect(cx, top, w, dna.hairHeight);
  }

  // =========================
  // 🪖 BUZZ
  // =========================
  if(dna.hairStyle === "buzz"){

    for(let x=-w; x<w; x+=2){
      ctx.fillRect(cx + x, top, 1, 2);
    }
  }

  // =========================
  // 🌀 AFRO (pixel version!)
  // =========================
  if(dna.hairStyle === "afro"){

    for(let y=0; y<dna.hairHeight+4; y++){

      let width = w + 2 - Math.floor(y/2);

      ctx.fillRect(cx - width, top + y, width*2, 1);
    }
  }

  // =========================
  // 👴 RECEDING
  // =========================
  if(dna.hairStyle === "receding"){

    ctx.fillRect(cx - w, top, w*2, dna.hairHeight);

    // Geheimratsecken
    ctx.clearRect(cx - w, top, 6, 4);
    ctx.clearRect(cx + w - 6, top, 6, 4);
  }
}



  // =========================
  // ✂️ SHORT HAIR (mit Struktur)
  // =========================
  if(dna.hairStyle === "short"){

    for(let y=0; y<h; y++){
      let width = w - Math.floor(y/2);

      ctx.fillRect(cx - width, top + y, width*2, 1);
    }

    // kleine Unregelmäßigkeit (🔥 wichtig)
    if(Math.random() < 0.5){
      ctx.fillRect(cx - w - 1, top + 2, 2, 1);
    }
  }

  // =========================
  // 🧱 FLAT HAIR (Top Cut)
  // =========================
  if(dna.hairStyle === "flat"){

    ctx.fillRect(cx - w, top, w*2, h);

    // Kante betonen
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(cx - w, top + h - 1, w*2, 1);
  }

  // =========================
  // 🌊 MESSY HAIR (NEU!)
  // =========================
  if(dna.hairStyle === "messy"){

    for(let y=0; y<h; y++){
      let width = w - Math.floor(y/3);

      let jitter = Math.floor(Math.random()*2);

      ctx.fillRect(cx - width + jitter, top + y, width*2, 1);
    }
  }

  // =========================
  // 🪖 BUZZ CUT (NEU!)
  // =========================
  if(dna.hairStyle === "buzz"){

    ctx.fillStyle = dna.hairColor;

    for(let x=-w; x<w; x+=2){
      ctx.fillRect(cx + x, top, 1, 2);
    }
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

  const y = 36;
  const w = dna.headW;

  ctx.fillStyle = dna.hairColor;

  // =========================
  // 🧔 STUBBLE (leicht)
  // =========================
  if(dna.beard === "stubble"){

    for(let x=-w+4; x<w-4; x+=2){
      ctx.fillRect(cx + x, y, 1, 1);
    }
  }

  // =========================
  // 🧔 GOATEE
  // =========================
  if(dna.beard === "goatee"){

    ctx.fillRect(cx-2, y, 4, 4);

    // kleiner Kinnpunkt
    ctx.fillRect(cx-1, y+4, 2, 2);
  }

  // =========================
  // 🧔 CHIN STRAP
  // =========================
  if(dna.beard === "chin"){

    ctx.fillRect(cx - w + 3, y, 2, 6);
    ctx.fillRect(cx + w - 5, y, 2, 6);

    // Verbindung unten
    ctx.fillRect(cx - w + 3, y+5, w*2 - 6, 1);
  }

  // =========================
  // 🧔 FULL (FORMED!)
  // =========================
  if(dna.beard === "full"){

    for(let i=0; i<6; i++){

      let width = w - 2 - Math.floor(i/2);

      ctx.fillRect(cx - width, y + i, width*2, 1);
    }
  }

  // =========================
  // 👨 MUSTACHE
  // =========================
  if(dna.beard === "mustache"){

    ctx.fillRect(cx-6, y-4, 4, 1);
    ctx.fillRect(cx+2, y-4, 4, 1);

    // kleine Krümmung
    ctx.fillRect(cx-4, y-3, 2, 1);
    ctx.fillRect(cx+2, y-3, 2, 1);
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


function drawBody(ctx, cx, country, rand){

  const y = 46;

  const base = getColor(country);
  const secondary = getSecondaryColor(country);

  // =========================
  // 👕 SHIRT BASE (mit Schultern)
  // =========================
  ctx.fillStyle = base;

  // Schultern breiter
  ctx.fillRect(cx-20, y, 40, 16);

  // leicht verjüngen unten
  ctx.fillRect(cx-18, y+12, 36, 8);

  // =========================
  // 🎨 PATTERN (Team Identity!)
  // =========================
  const pattern = pick(rand, ["plain","stripe","center","half"]);

  ctx.fillStyle = secondary;

  if(pattern === "stripe"){
    // vertikale Streifen
    for(let x=-16; x<=16; x+=6){
      ctx.fillRect(cx+x, y, 2, 16);
    }
  }

  if(pattern === "center"){
    // Bruststreifen (PSG style)
    ctx.fillRect(cx-3, y, 6, 16);
  }

  if(pattern === "half"){
    // halb/halb
    ctx.fillRect(cx, y, 20, 16);
  }

  // =========================
  // 🧣 COLLAR
  // =========================
  ctx.fillStyle = "#fff";

  ctx.fillRect(cx-4, y, 8, 2);

  // V-Ausschnitt
  ctx.clearRect(cx-2, y, 4, 2);

  // =========================
  // 🌗 SHADING
  // =========================
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(cx-20, y, 40, 2);

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(cx-18, y+14, 36, 2);
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

