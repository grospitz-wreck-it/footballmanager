
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

  const skin = [
    dna.skinLight,
    dna.skinMid,
    dna.skinDark
  ];

  // 80s STYLE: harte Stufen statt Kurve
  const shape = [
    {w:8, c:0},   // top highlight
    {w:10,c:0},
    {w:12,c:1},
    {w:13,c:1},
    {w:14,c:1},
    {w:15,c:1},
    {w:15,c:1},
    {w:14,c:2},   // shadow start
    {w:13,c:2},
    {w:12,c:2},
    {w:10,c:2},
  ];

  for(let i=0;i<shape.length;i++){
    const row = shape[i];
    ctx.fillStyle = skin[row.c];
    ctx.fillRect(cx - row.w, cy - 10 + i, row.w*2, 1);
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

function drawHair(ctx, cx, dna){

  if(dna.hairStyle === "none") return;

  ctx.fillStyle = dna.hairColor;

  const y = 14;

  // harte Pixel-Blöcke
  ctx.fillRect(cx-10, y, 20, 2);

  ctx.fillRect(cx-12, y+2, 4, 2);
  ctx.fillRect(cx+8, y+2, 4, 2);

  ctx.fillRect(cx-6, y+4, 12, 2);
}

// ======================================
// 👁 EYES
// ======================================

function drawEyes(ctx, cx, dna){

  const y = 24;
  const d = 6;

  // whites
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - d, y, 3, 2);
  ctx.fillRect(cx + d - 3, y, 3, 2);

  // pupils (immer 1px!)
  ctx.fillStyle = "#000";
  ctx.fillRect(cx - d + 1, y, 1, 1);
  ctx.fillRect(cx + d - 2, y, 1, 1);
}

// ======================================
// 👃 NOSE
// ======================================

function drawNose(ctx, cx, dna){
  ctx.fillStyle = dna.skinDark;
  ctx.fillRect(cx, 29, 1, 2);
}


// ======================================
// 👄 MOUTH
// ======================================

function drawMouth(ctx, cx, dna, mood){

  ctx.fillStyle = "#200";

  if(mood === "happy"){
    ctx.fillRect(cx-2, 36, 1, 1);
    ctx.fillRect(cx-1, 37, 2, 1);
    ctx.fillRect(cx+1, 36, 1, 1);
  } else {
    ctx.fillRect(cx-2, 36, 4, 1);
  }
}

// ======================================
// 🧔 BEARD
// ======================================

function drawBeard(ctx, cx, dna){

  if(dna.beard === "none") return;

  ctx.fillStyle = dna.hairColor;

  // nur Andeutung
  ctx.fillRect(cx-4, 34, 8, 2);
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

function outline(ctx){

  ctx.fillStyle = "#000";

  for(let y=0;y<64;y++){
    for(let x=0;x<64;x++){

      const p = ctx.getImageData(x,y,1,1).data;

      if(p[3] === 0) continue;

      // check neighbors
      const n = ctx.getImageData(x+1,y,1,1).data;
      if(n[3] === 0){
        ctx.fillRect(x+1,y,1,1);
      }
    }
  }
}
drawBody(...)
outline(ctx)
// ======================================
// 🎨 DATA
// ======================================

const SKIN_TONES = [
  ["#f2c9a0","#d99a6c","#8a5a3a"] // nur EIN Set nutzen!
];

const HAIR_COLORS = [
  "#2b1d14","#5a3a2a","#c9a36a"
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

