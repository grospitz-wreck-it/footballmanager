
// ======================================
// ⚽ PIXEL MANAGER RENDERER V5 (EXPLOSIVE)
// ======================================

export function drawPlayer(ctx, rand, country, mood="neutral", quality=0.5, prompt=""){

  const size = 64;
  ctx.clearRect(0,0,size,size);
  ctx.imageSmoothingEnabled = false;

  const cx = 32;

  const dna = createDNA(rand, country, quality, prompt);

  // BASE
  drawHead(ctx, cx, dna);
  drawEars(ctx, cx, dna);

  // STYLE PASS
  drawHair(ctx, cx, dna, rand);
  drawEyes(ctx, cx, dna);
  drawNose(ctx, cx, dna);
  drawMouth(ctx, cx, dna, mood);

  // DETAIL PASS
  drawBeard(ctx, cx, dna);
  drawAccessories(ctx, cx, dna);

  // CHAOS PASS 🔥
  if(rand() < quality){
    applyMutation(ctx, rand);
  }

  drawBody(ctx, cx, country, rand, dna);
}


// ======================================
// 🧬 DNA (PROMPT DRIVEN)
// ======================================

function createDNA(rand, country, quality, prompt){

  const type = pick(rand, ["warrior","mage","rogue","ranger","knight","priest"]);

  const skinSet = pick(rand, SKIN_TONES);

  let dna = {
    skinLight: skinSet[0],
    skinMid: skinSet[1],
    skinDark: skinSet[2],

    hairColor: pick(rand, HAIR_COLORS),
    eyeColor: pick(rand, EYE_COLORS),

    hairStyle: pick(rand, ["crop","messy","flat","buzz","afro","receding"]),
    hairHeight: 3 + Math.floor(rand()*6),

    beard: pick(rand, ["none","stubble","goatee","full","mustache"]),

    glasses: rand() < 0.1,

    headW: 14 + Math.floor(rand()*6),
    headH: 18 + Math.floor(rand()*6),

    eyeSpacing: 6 + Math.floor(rand()*4),
    eyeY: 24 + Math.floor(rand()*3),

    noseType: pick(rand, ["small","wide","long"]),

    chaos: rand()
  };

  // ======================================
  // 🧠 PROMPT INJECTION (CLIP STYLE)
  // ======================================

  if(prompt.includes("blond")) dna.hairColor = "#d6a77a";
  if(prompt.includes("old")) dna.beard = "full";
  if(prompt.includes("young")) dna.beard = "none";
  if(prompt.includes("wizard")) dna.hairStyle = "messy";
  if(prompt.includes("knight")) dna.hairStyle = "flat";
  if(prompt.includes("rogue")) dna.eyeSpacing += 2;
  if(prompt.includes("berserk")) dna.chaos = 1;

  // QUALITY BOOST
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
  drawEar(ctx, cx - dna.headW - 2, 28, 3, 5, dna);
  drawEar(ctx, cx + dna.headW + 2 - 3, 28, 3, 5, dna);
}

function drawEar(ctx, x, y, w, h, dna){
  ctx.fillStyle = dna.skinMid;
  ctx.fillRect(x, y, w, h);
}


// ======================================
// 💇 HAIR
// ======================================

function drawHair(ctx, cx, dna, rand){

  ctx.fillStyle = dna.hairColor;

  const top = 10;
  const w = dna.headW + 2;

  for(let y=0;y<dna.hairHeight;y++){
    let width = w - Math.floor(y/2);

    let jitter = Math.floor(rand()*3)-1;

    ctx.fillRect(cx - width + jitter, top + y, width*2, 1);
  }

  // CHAOS HAIR 🔥
  if(dna.chaos > 0.7){
    ctx.fillRect(cx - w - 2, top+2, 3, 1);
  }
}


// ======================================
// 👁 EYES
// ======================================

function drawEyes(ctx, cx, dna){

  const y = dna.eyeY;

  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - dna.eyeSpacing, y, 4, 3);
  ctx.fillRect(cx + dna.eyeSpacing - 4, y, 4, 3);

  ctx.fillStyle = dna.eyeColor;
  ctx.fillRect(cx - dna.eyeSpacing + 1, y, 2, 2);
  ctx.fillRect(cx + dna.eyeSpacing - 3, y, 2, 2);

  ctx.fillStyle = "#000";
  ctx.fillRect(cx - dna.eyeSpacing + 1, y, 1, 1);
  ctx.fillRect(cx + dna.eyeSpacing - 3, y, 1, 1);
}


// ======================================
// 👃 NOSE
// ======================================

function drawNose(ctx, cx, dna){
  ctx.fillStyle = dna.skinDark;
  ctx.fillRect(cx-1,30,2,2);
}


// ======================================
// 👄 MOUTH
// ======================================

function drawMouth(ctx, cx, dna, mood){
  ctx.fillStyle = "#300";

  if(mood==="happy") ctx.fillRect(cx-5,38,10,2);
  else ctx.fillRect(cx-3,38,6,1);
}


// ======================================
// 🧔 BEARD
// ======================================

function drawBeard(ctx, cx, dna){
  if(dna.beard==="none") return;

  ctx.fillStyle = dna.hairColor;

  for(let x=-dna.headW+4;x<dna.headW-4;x+=2){
    ctx.fillRect(cx+x,36,1,1);
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
}


// ======================================
// 💥 MUTATION SYSTEM (NEW)
// ======================================

function applyMutation(ctx, rand){

  for(let i=0;i<20;i++){
    if(rand()<0.3){
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(Math.floor(rand()*64), Math.floor(rand()*64), 1, 1);
    }
  }
}


// ======================================
// 👕 BODY
// ======================================

function drawBody(ctx, cx, country, rand, dna){

  const y = 46;

  const base = getColor(country);
  const secondary = getSecondaryColor(country);

  ctx.fillStyle = base;
  ctx.fillRect(cx-20, y, 40, 16);

  if(rand()<0.5){
    ctx.fillStyle = secondary;
    ctx.fillRect(cx-3,y,6,16);
  }
}


// ======================================
// 🎨 DATA
// ======================================

const SKIN_TONES = [
  ["#f6e0c9","#e9c2a6","#d9a07a"],
  ["#c68642","#a86b33","#7c4a1f"]
];

const HAIR_COLORS = [
  "#1c1c1c","#6b4f3a","#d6a77a"
];

const EYE_COLORS = [
  "#000","#2a2a5a","#1f3b2f"
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
