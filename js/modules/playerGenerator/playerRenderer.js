
export function drawPlayer(ctx, rand, country, mood="neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, [
    ["#f6d2be","#e5b39a","#c98e6b"],
    ["#eac39b","#d9a676","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"]
  ]);

  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  const faceType = pick(rand, FACE_SHAPES);
  const eyes     = pick(rand, EYES);
  const mouth    = pick(rand, MOUTHS);
  const brows    = pick(rand, BROWS);

  drawFaceBase(ctx, faceType, skin);
  drawHair(ctx, hair);
  drawFeature(ctx, eyes, 26, 30);
  drawFeature(ctx, eyes, 38, 30);
  drawFeature(ctx, brows, 26, 26);
  drawFeature(ctx, brows, 38, 26);
  drawFeature(ctx, mouth, 30, 42);

  drawBody(ctx, country);
}


// =========================
// 🎨 FACE BASES
// =========================
const FACE_SHAPES = [

  // round
  (ctx, skin) => {
    drawEllipse(ctx,32,30,14,18,skin);
  },

  // narrow
  (ctx, skin) => {
    drawEllipse(ctx,32,30,12,18,skin);
  },

  // wide
  (ctx, skin) => {
    drawEllipse(ctx,32,30,16,18,skin);
  }
];


// =========================
// 👁 EYES
// =========================
const EYES = [

  // normal
  [
    [1,1],
    [1,0]
  ],

  // big
  [
    [1,1,1],
    [1,0,1]
  ],

  // sleepy
  [
    [1,1,1]
  ],

  // sharp
  [
    [0,1,1],
    [1,1,0]
  ],

  // tiny
  [
    [1]
  ]
];


// =========================
// 👄 MOUTHS
// =========================
const MOUTHS = [

  // smile
  [
    [1,0,1],
    [0,1,0]
  ],

  // neutral
  [
    [1,1]
  ],

  // sad
  [
    [0,1,0],
    [1,0,1]
  ],

  // open
  [
    [1,1],
    [1,1]
  ],

  // smirk
  [
    [1,1,0]
  ]
];


// =========================
// 👁 BROWS
// =========================
const BROWS = [

  [
    [1,1,1]
  ],

  [
    [1,1,0]
  ],

  [
    [0,1,1]
  ],

  [
    [1,0,1]
  ]
];


// =========================
// 🧠 RENDER
// =========================
function drawFeature(ctx, pattern, ox, oy){

  for(let y=0;y<pattern.length;y++){
    for(let x=0;x<pattern[y].length;x++){

      if(pattern[y][x]){
        px(ctx, ox + x, oy + y, "#000");
      }
    }
  }
}


// =========================
// 👤 FACE BASE RENDER
// =========================
function drawFaceBase(ctx, fn, skin){
  fn(ctx, skin);
}

function drawEllipse(ctx,cx,cy,rx,ry,skin){

  const [l,m,d] = skin;

  for(let y=cy-ry;y<cy+ry;y++){
    for(let x=cx-rx;x<cx+rx;x++){

      let dx = (x-cx)/rx;
      let dy = (y-cy)/ry;

      if(dx*dx + dy*dy > 1) continue;

      let col = m;

      if(dy < -0.3) col = l;
      if(dy > 0.5) col = d;

      px(ctx,x,y,col);
    }
  }
}


// =========================
// 💇 HAIR
// =========================
function drawHair(ctx, hair){
  fill(ctx,18,14,28,10,hair);
}


// =========================
// 👕 BODY
// =========================
function drawBody(ctx, country){
  fill(ctx,20,48,24,12,getColor(country));
}


// =========================
// 🧩 HELPERS
// =========================
function px(ctx,x,y,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,1,1);
}

function fill(ctx,x,y,w,h,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,h);
}

function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}

function getColor(code){
  return {
    DE:"#dd0000",
    FR:"#0055A4",
    BR:"#009C3B"
  }[code] || "#888";
}

