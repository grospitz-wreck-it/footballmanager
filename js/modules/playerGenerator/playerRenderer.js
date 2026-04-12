
export function drawPlayer(ctx, rand, country, mood="neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, [
    ["#f6d2be","#e5b39a","#c98e6b"],
    ["#eac39b","#d9a676","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"]
  ]);

  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  const face = pick(rand, FACE_SHAPES);
  const eyes = pick(rand, EYES);
  const mouth = pick(rand, MOUTHS);
  const brows = pick(rand, BROWS);

  face(ctx, skin);
  drawHair(ctx, hair);

  drawFeature(ctx, eyes, 24, 30);
  drawFeature(ctx, eyes, 36, 30);

  drawFeature(ctx, brows, 24, 26);
  drawFeature(ctx, brows, 36, 26);

  drawFeature(ctx, mouth, 28, 42);

  drawBody(ctx, country);
}


// =========================
// 👤 FACE BASES
// =========================
const FACE_SHAPES = [
  (ctx, skin) => drawEllipse(ctx,32,30,14,18,skin),
  (ctx, skin) => drawEllipse(ctx,32,30,12,18,skin),
  (ctx, skin) => drawEllipse(ctx,32,30,16,18,skin)
];


// =========================
// 👁 EYES (BIG UPGRADE)
// =========================
const EYES = [

  // normal
  [
    "01110",
    "11111",
    "01110"
  ],

  // sharp
  [
    "00111",
    "11110",
    "00111"
  ],

  // tired
  [
    "11111",
    "00000",
    "11111"
  ],

  // wide
  [
    "11111",
    "10101",
    "11111"
  ]
];


// =========================
// 👄 MOUTHS
// =========================
const MOUTHS = [

  // smile
  [
    "10001",
    "01110"
  ],

  // neutral
  [
    "11111"
  ],

  // sad
  [
    "01110",
    "10001"
  ],

  // open
  [
    "01110",
    "01110"
  ]
];


// =========================
// 👁 BROWS
// =========================
const BROWS = [

  [
    "11111"
  ],

  [
    "11100"
  ],

  [
    "00111"
  ],

  [
    "10101"
  ]
];


// =========================
// 🎨 RENDER FEATURE
// =========================
function drawFeature(ctx, pattern, ox, oy){

  for(let y=0;y<pattern.length;y++){
    for(let x=0;x<pattern[y].length;x++){

      if(pattern[y][x] === "1"){
        px(ctx, ox + x, oy + y, "#111");
      }
    }
  }
}


// =========================
// 👤 FACE BASE
// =========================
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

