
// ======================================
// ⚽ PLAYER RENDERER (FULL FIXED VERSION)
// ======================================

export function drawPlayer(ctx, rand, country, mood="neutral", quality=0.5){

  const size = 64;
  ctx.clearRect(0,0,size,size);
  ctx.imageSmoothingEnabled = false;

  const cx = 32;

  const dna = createDNA(rand, country, quality);

  drawHead(ctx, cx, dna);
  drawEars(ctx, cx, dna);
  drawHair(ctx, cx, dna, rand);
  drawEyes(ctx, cx, dna);
  drawNose(ctx, cx, dna);
  drawMouth(ctx, cx, dna, mood);
  drawBeard(ctx, cx, dna);
  drawAccessories(ctx, cx, dna);
  drawBody(ctx, cx, country, rand);
}


// ======================================
// 🧬 DNA
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

    hairStyle: pick(rand, ["crop","messy","flat","sidecut","buzz","afro","receding","none"]),
    hairHeight: 3 + Math.floor(rand()*6),

    beard: "none",
    glasses: false,

    headW: 16,
    headH: 20,
    eyeSpacing: 7,
    eyeY: 25,
    noseType: "small",
    jawWidth: 2,
    cheekWidth: 2,

    earSize: 2 + Math.floor(rand()*2),

    eyeOffsetL: Math.floor(rand()*2),
    eyeOffsetR: Math.floor(rand()*2),
    eyeOffsetYL: Math.floor(rand()*2),
    eyeOffsetYR: Math.floor(rand()*2)
  };

  // Archetypes
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

  if(dna.beard === "none"){
    dna.beard = pick(rand, ["none","stubble","goatee","chin","full","mustache"]);
  }

  if(type === "youth"){
    dna.beard = "none";
    dna.headH = 18;
  }

  if(rand() < quality){
    dna.eyeSpacing += 1;
    dna.headW += 1;
  }

  return dna;
}


// ======================================
// 👤 HEAD
// ======================================

function drawHead(ctx, cx, dna){
  const cy = 28;

  for(let y=-dna.headH; y<=dna.headH; y++){
    let t = y / dna.headH;
    let w = Math.round(dna.headW * Math.sqrt(1 - t*t));

    if(y > 0 && y < dna.headH/2) w += dna.cheekWidth;
    if(y > dna.headH/2) w += dna.jawWidth;

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
  drawEar(ctx, cx - dna.headW - 2, 28, dna.earSize, 5, dna);
  drawEar(ctx, cx + dna.headW + 2 - dna.earSize, 28, dna.earSize, 5, dna);
}

function drawEar(ctx, x, y, w, h, dna){
  for(let i=0;i<h;i++){
    let shrink = Math.floor(i/3);
    ctx.fillStyle = dna.skinMid;
    ctx.fillRect(x + shrink, y + i, w - shrink*2, 1);
  }
}


// ======================================
// 💇 HAIR (ALL STYLES)
// ======================================

function drawHair(ctx, cx, dna, rand){

  if(dna.hairStyle === "none") return;

  ctx.fillStyle = dna.hairColor;

  const top = 10;
  const w = dna.headW + 2;

  if(dna.hairStyle === "crop"){
    for(let y=0;y<dna.hairHeight;y++){
      let width = w - Math.floor(y/2);
      ctx.fillRect(cx - width, top + y, width*2, 1);
    }
  }

  if(dna.hairStyle === "messy"){
    for(let y=0;y<dna.hairHeight;y++){
      let width = w - Math.floor(y/3);
      let shift = Math.floor(rand()*3)-1;
      ctx.fillRect(cx - width + shift, top + y, width*2, 1);
    }
  }

  if(dna.hairStyle === "flat"){
    ctx.fillRect(cx - w, top, w*2, dna.hairHeight);
  }

  if(dna.hairStyle === "sidecut"){
    ctx.fillRect(cx - w, top, w*2, dna.hairHeight);
    ctx.clearRect(cx, top, w, dna.hairHeight);
  }

  if(dna.hairStyle === "buzz"){
    for(let x=-w;x<w;x+=2){
      ctx.fillRect(cx+x, top, 1, 2);
    }
  }

  if(dna.hairStyle === "afro"){
    for(let y=0;y<dna.hairHeight+3;y++){
      let width = w + 2 - Math.floor(y/2);
      ctx.fillRect(cx - width, top + y, width*2, 1);
    }
  }

  if(dna.hairStyle === "receding"){
    ctx.fillRect(cx - w, top, w*2, dna.hairHeight);
    ctx.clearRect(cx - w, top, 6, 4);
    ctx.clearRect(cx + w - 6, top, 6, 4);
  }
}


// ======================================
// 👁 EYES
// ======================================

function drawEyes(ctx, cx, dna){

  const y = dna.eyeY;

  const oL = dna.eyeSpacing;
  const oR = dna.eyeSpacing + dna.eyeOffsetR;

  const yL = y + dna.eyeOffsetYL;
  const yR = y + dna.eyeOffsetYR;

  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - oL, yL, 4, 3);
  ctx.fillRect(cx + oR - 4, yR, 4, 3);

  ctx.fillStyle = dna.eyeColor;
  ctx.fillRect(cx - oL + 1, yL, 2, 2);
  ctx.fillRect(cx + oR - 3, yR, 2, 2);

  ctx.fillStyle = "#000";
  ctx.fillRect(cx - oL + 1, yL, 1, 1);
  ctx.fillRect(cx + oR - 3, yR, 1, 1);
}


// ======================================
// 👃 NOSE
// ======================================

function drawNose(ctx, cx, dna){
  ctx.fillStyle = dna.skinDark;

  if(dna.noseType === "small") ctx.fillRect(cx-1,30,2,2);
  if(dna.noseType === "wide") ctx.fillRect(cx-2,30,4,2);
  if(dna.noseType === "long") ctx.fillRect(cx-1,30,2,4);
}


// ======================================
// 👄 MOUTH
// ======================================

function drawMouth(ctx, cx, dna, mood){
  ctx.fillStyle = "#300";

  if(mood === "happy") ctx.fillRect(cx-5,38,10,2);
  else if(mood === "angry") ctx.fillRect(cx-4,38,8,1);
  else ctx.fillRect(cx-3,38,6,1);
}


// ======================================
// 🧔 BEARD
// ======================================

function drawBeard(ctx, cx, dna){

  if(dna.beard === "none") return;

  const y = 36;
  const w = dna.headW;

  ctx.fillStyle = dna.hairColor;

  if(dna.beard === "stubble"){
    for(let x=-w+4;x<w-4;x+=2){
      ctx.fillRect(cx+x,y,1,1);
    }
  }

  if(dna.beard === "goatee"){
    ctx.fillRect(cx-2,y,4,4);
    ctx.fillRect(cx-1,y+4,2,2);
  }

  if(dna.beard === "chin"){
    ctx.fillRect(cx - w + 3, y, 2, 6);
    ctx.fillRect(cx + w - 5, y, 2, 6);
    ctx.fillRect(cx - w + 3, y+5, w*2 - 6, 1);
  }

  if(dna.beard === "full"){
    for(let i=0;i<6;i++){
      let width = w - 2 - Math.floor(i/2);
      ctx.fillRect(cx - width, y+i, width*2, 1);
    }
  }

  if(dna.beard === "mustache"){
    ctx.fillRect(cx-6,y-4,4,1);
    ctx.fillRect(cx+2,y-4,4,1);
  }
}


// ======================================
// 👓 ACCESSORIES
// ======================================

function drawAccessories(ctx, cx, dna){
  if(!dna.glasses) return;

  ctx.strokeStyle="#000";
  ctx.strokeRect(cx-12,dna.eyeY,8,6);
  ctx.strokeRect(cx+4,dna.eyeY,8,6);

  ctx.beginPath();
  ctx.moveTo(cx-4,dna.eyeY+3);
  ctx.lineTo(cx+4,dna.eyeY+3);
  ctx.stroke();
}


// ======================================
// 👕 BODY
// ======================================

function drawBody(ctx, cx, country, rand){

  const y = 46;

  const base = getColor(country);
  const secondary = getSecondaryColor(country);

  ctx.fillStyle = base;
  ctx.fillRect(cx-20, y, 40, 16);

  const pattern = pick(rand, ["plain","stripe","center","half"]);

  ctx.fillStyle = secondary;

  if(pattern==="stripe"){
    for(let x=-16;x<=16;x+=6){
      ctx.fillRect(cx+x,y,2,16);
    }
  }

  if(pattern==="center"){
    ctx.fillRect(cx-3,y,6,16);
  }

  if(pattern==="half"){
    ctx.fillRect(cx,y,20,16);
  }
}


// ======================================
// 🎨 DATA
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

function getSecondaryColor(code){
  return {
    DE:"#000",
    FR:"#fff",
    BR:"#ffdf00"
  }[code] || "#222";
}

