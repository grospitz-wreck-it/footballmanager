
// ======================================
// ⚽ PLAYER RENDERER (ARCADE CLEAN VERSION)
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
  drawBody(ctx, cx, country, rand);

  outline(ctx); // ✅ FIXED POSITION
}


// ======================================
// 🧬 DNA (REDUCED FOR ARCADE)
// ======================================

function createDNA(rand, country, quality){

  const skinSet = SKIN_TONES[0]; // 🔥 fixed palette

  return {
    skinLight: skinSet[0],
    skinMid: skinSet[1],
    skinDark: skinSet[2],

    hairColor: pick(rand, HAIR_COLORS),
    eyeColor: "#000",

    hairStyle: pick(rand, ["messy","flat","buzz","none"]),
    beard: pick(rand, ["none","stubble"]),

    glasses: rand() < 0.1
  };
}


// ======================================
// 👤 HEAD (BLOCK SHAPE + OUTLINE)
// ======================================

function drawHead(ctx, cx, dna){

  const cy = 28;

  const skin = [dna.skinLight, dna.skinMid, dna.skinDark];

  const shape = [
    {w:8, c:0},
    {w:10,c:0},
    {w:12,c:1},
    {w:13,c:1},
    {w:14,c:1},
    {w:15,c:1},
    {w:15,c:1},
    {w:14,c:2},
    {w:13,c:2},
    {w:12,c:2},
    {w:10,c:2},
  ];

  for(let i=0;i<shape.length;i++){
    const row = shape[i];
    ctx.fillStyle = skin[row.c];
    ctx.fillRect(cx - row.w, cy - 10 + i, row.w*2, 1);
  }

  // 🔥 HARD OUTLINE
  ctx.fillStyle = "#000";
  ctx.fillRect(cx-15, cy-10, 1, 11);
  ctx.fillRect(cx+14, cy-10, 1, 11);
  ctx.fillRect(cx-8, cy-11, 16, 1);
}


// ======================================
// 👂 EARS (SIMPLIFIED)
// ======================================

function drawEars(ctx, cx, dna){

  const y = 26;

  ctx.fillStyle = dna.skinMid;

  ctx.fillRect(cx-16, y, 2, 4);
  ctx.fillRect(cx+14, y, 2, 4);
}


// ======================================
// 💇 HAIR (CLUSTERS)
// ======================================

function drawHair(ctx, cx, dna){

  if(dna.hairStyle === "none") return;

  ctx.fillStyle = dna.hairColor;

  const y = 14;

  ctx.fillRect(cx-10, y, 20, 2);

  if(dna.hairStyle === "messy"){
    ctx.fillRect(cx-12, y+2, 4, 2);
    ctx.fillRect(cx+8, y+2, 4, 2);
  }

  if(dna.hairStyle === "flat"){
    ctx.fillRect(cx-10, y+2, 20, 2);
  }

  if(dna.hairStyle === "buzz"){
    for(let x=-10;x<=10;x+=2){
      ctx.fillRect(cx+x, y, 1, 1);
    }
  }
}


// ======================================
// 👁 EYES
// ======================================

function drawEyes(ctx, cx){

  const y = 24;
  const d = 6;

  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - d, y, 3, 2);
  ctx.fillRect(cx + d - 3, y, 3, 2);

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
  ctx.fillRect(cx-4, 34, 8, 2);
}


// ======================================
// 👓 ACCESSORIES
// ======================================

function drawAccessories(ctx, cx, dna){

  if(!dna.glasses) return;

  ctx.strokeStyle="#000";
  ctx.strokeRect(cx-10,24,6,4);
  ctx.strokeRect(cx+4,24,6,4);

  ctx.beginPath();
  ctx.moveTo(cx-4,26);
  ctx.lineTo(cx+4,26);
  ctx.stroke();
}


// ======================================
// 👕 BODY (RETRO SIZE)
// ======================================

function drawBody(ctx, cx, country, rand){

  const y = 46;

  const base = getColor(country);
  const secondary = getSecondaryColor(country);

  ctx.fillStyle = base;
  ctx.fillRect(cx-14, y, 28, 14);

  const pattern = pick(rand, ["plain","stripe","center"]);

  ctx.fillStyle = secondary;

  if(pattern==="stripe"){
    for(let x=-10;x<=10;x+=6){
      ctx.fillRect(cx+x,y,2,14);
    }
  }

  if(pattern==="center"){
    ctx.fillRect(cx-2,y,4,14);
  }
}


// ======================================
// 🧱 OUTLINE (FAST VERSION)
// ======================================

function outline(ctx){

  const img = ctx.getImageData(0,0,64,64);
  const data = img.data;

  function empty(x,y){
    if(x<0||y<0||x>=64||y>=64) return true;
    return data[(y*64+x)*4+3] === 0;
  }

  ctx.fillStyle = "#000";

  for(let y=0;y<64;y++){
    for(let x=0;x<64;x++){

      const a = data[(y*64+x)*4+3];
      if(a === 0) continue;

      if(empty(x+1,y)) ctx.fillRect(x+1,y,1,1);
      if(empty(x-1,y)) ctx.fillRect(x-1,y,1,1);
      if(empty(x,y+1)) ctx.fillRect(x,y+1,1,1);
      if(empty(x,y-1)) ctx.fillRect(x,y-1,1,1);
    }
  }
}


// ======================================
// 🎨 DATA
// ======================================

const SKIN_TONES = [
  ["#f2c9a0","#d99a6c","#8a5a3a"]
];

const HAIR_COLORS = [
  "#2b1d14","#5a3a2a","#c9a36a"
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

