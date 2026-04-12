
// ======================================
// 🎮 PLAYER RENDERER (FIXED + STABLE)
// ======================================

import faceData from "./faceData.js";

export function drawPlayer(ctx, rand, country, mood="neutral"){

  const scale = 4;
  const buffer = document.createElement("canvas");
  buffer.width = 256;
  buffer.height = 256;

  const bctx = buffer.getContext("2d");

  const cx = 128;
  const cy = 140;

  // =========================
  // 🧬 PICK FACE
  // =========================
  const raw = faceData[Math.floor(rand()*faceData.length)];
  const pts = toPoints(raw);

  normalize(pts, cx, cy, 1.0);

  // =========================
  // 🎨 COLORS
  // =========================
  const skin = pick(rand, ["#f6d2be","#eac39b","#c68642","#8d5524"]);
  const hair = pick(rand, ["#1c1c1c","#3b2f2f","#6b4f3a","#d6a77a"]);

// =========================
// 👤 HEAD (HYBRID SYSTEM)
// =========================

const headTypes = [
  { w: 65, h: 95 },   // lang
  { w: 75, h: 85 },   // normal
  { w: 85, h: 80 },   // breit
  { w: 70, h: 70 }    // rund
];

const head = pick(rand, headTypes);

drawHead(bctx, pts, cx, cy, head, skin);

function drawHead(ctx, pts, cx, cy, head, skin){

  ctx.fillStyle = skin;
  ctx.beginPath();

  // 👉 Start links unten (Kiefer)
  ctx.moveTo(pts[0][0], pts[0][1]);

  // 👉 echte Kieferlinie
  for(let i=1;i<=16;i++){
    ctx.lineTo(pts[i][0], pts[i][1]);
  }

  // 👉 rechte Seite hoch (zum Schädel)
  ctx.quadraticCurveTo(
    cx + head.w,
    cy - head.h,
    cx,
    cy - head.h
  );

  // 👉 obere Rundung
  ctx.quadraticCurveTo(
    cx - head.w,
    cy - head.h,
    pts[0][0],
    pts[0][1]
  );

  ctx.closePath();
  ctx.fill();
}


  // =========================
  // 💇 HAIR (moved BEFORE face details)
  // =========================
  bctx.fillStyle = hair;
  bctx.beginPath();
  bctx.ellipse(cx, cy-80, 80, 50, 0, Math.PI, 0);
  bctx.fill();

  // =========================
  // 🌗 SHADING (FIXED)
  // =========================
  let grad = bctx.createLinearGradient(0, 60, 0, 240);
  grad.addColorStop(0,"rgba(255,255,255,0.25)");
  grad.addColorStop(1,"rgba(0,0,0,0.5)");
  bctx.fillStyle = grad;
  bctx.fillRect(0,0,256,256);

  // =========================
  // 👁 EYE SOCKETS
  // =========================
  drawEyeSocket(bctx, center(pts.slice(36,42)));
  drawEyeSocket(bctx, center(pts.slice(42,48)));

  // =========================
  // 👁 EYES
  // =========================
  drawEye(bctx, pts.slice(36,42));
  drawEye(bctx, pts.slice(42,48));

  // =========================
  // 👃 NOSE SHADOW
  // =========================
  const nose = center(pts.slice(27,36));
  bctx.fillStyle = "rgba(0,0,0,0.25)";
  bctx.beginPath();
  bctx.ellipse(nose[0], nose[1]+10, 10, 20, 0, 0, Math.PI);
  bctx.fill();

  // =========================
  // 👄 MOUTH (FIXED)
  // =========================
  drawMouth(bctx, pts.slice(48,60));

  // =========================
  // 🎨 NOISE (SEEDED FIX)
  // =========================
  addNoise(bctx, buffer.width, buffer.height, 12, rand);

  // =========================
  // 🎨 PALETTE
  // =========================
  applyPalette(bctx, buffer.width, buffer.height);

  // =========================
  // 🧱 PIXELIZE
  // =========================
  pixelize(bctx, buffer.width, buffer.height, 4);

  // =========================
  // FINAL
  // =========================
  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, 64, 64);
}


// ======================================
// 👁 EYE
// ======================================
function drawEye(ctx, pts){

  ctx.fillStyle = "#fff";
  ctx.beginPath();

  ctx.moveTo(pts[0][0], pts[0][1]);
  for(let p of pts){
    ctx.lineTo(p[0], p[1]);
  }

  ctx.closePath();
  ctx.fill();

  const c = center(pts);

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(c[0], c[1], 4, 0, Math.PI*2);
  ctx.fill();
}


// ======================================
// 👁 SOCKET
// ======================================
function drawEyeSocket(ctx, c){
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(c[0], c[1], 18, 12, 0, 0, Math.PI*2);
  ctx.fill();
}


// ======================================
// 👄 MOUTH (FIXED → stroke statt blob)
// ======================================
function drawMouth(ctx, pts){

  ctx.strokeStyle = "#300";
  ctx.lineWidth = 2;
  ctx.beginPath();

  ctx.moveTo(pts[0][0], pts[0][1]);
  for(let p of pts){
    ctx.lineTo(p[0], p[1]);
  }

  ctx.stroke();
}


// ======================================
// 🧬 HELPERS
// ======================================

function toPoints(row){
  let pts=[];
  for(let i=0;i<row.length;i+=2){
    pts.push([row[i],row[i+1]]);
  }
  return pts;
}

// 🔥 FIXED NORMALIZE
function normalize(pts,cx,cy,scale){

  let minX=Infinity, maxX=-Infinity;
  let minY=Infinity, maxY=-Infinity;

  for(let p of pts){
    if(p[0]<minX) minX=p[0];
    if(p[0]>maxX) maxX=p[0];
    if(p[1]<minY) minY=p[1];
    if(p[1]>maxY) maxY=p[1];
  }

  let w = maxX - minX;
  let h = maxY - minY;

  let s = scale * Math.min(140/w, 180/h);

  for(let p of pts){
    p[0] = (p[0]-minX)*s + (cx - (w*s)/2);
    p[1] = (p[1]-minY)*s + (cy - (h*s)/2);
  }
}

function center(pts){
  let x=0,y=0;
  for(let p of pts){ x+=p[0]; y+=p[1]; }
  return [x/pts.length,y/pts.length];
}


// ======================================
// 🎨 NOISE (SEEDED)
// ======================================
function addNoise(ctx,w,h,amount,rand){
  let img=ctx.getImageData(0,0,w,h);
  let d=img.data;

  for(let i=0;i<d.length;i+=4){
    let n=(rand()-0.5)*amount;
    d[i]+=n; d[i+1]+=n; d[i+2]+=n;
  }

  ctx.putImageData(img,0,0);
}


// ======================================
// 🎨 PALETTE
// ======================================
const palette = [
  [0,0,0],
  [80,60,40],
  [120,90,60],
  [160,120,80],
  [200,160,120],
  [240,200,160]
];

function applyPalette(ctx,w,h){
  let img=ctx.getImageData(0,0,w,h);
  let d=img.data;

  for(let i=0;i<d.length;i+=4){
    let best,dist=999999;

    for(let p of palette){
      let dd=(d[i]-p[0])**2+(d[i+1]-p[1])**2+(d[i+2]-p[2])**2;
      if(dd<dist){dist=dd;best=p;}
    }

    d[i]=best[0];
    d[i+1]=best[1];
    d[i+2]=best[2];
  }

  ctx.putImageData(img,0,0);
}


// ======================================
// 🧱 PIXELIZE
// ======================================
function pixelize(ctx,w,h,size){
  let img=ctx.getImageData(0,0,w,h);
  let d=img.data;

  for(let y=0;y<h;y+=size){
    for(let x=0;x<w;x+=size){
      let i=(y*w+x)*4;

      for(let dy=0;dy<size;dy++){
        for(let dx=0;dx<size;dx++){
          let ii=((y+dy)*w+(x+dx))*4;
          d[ii]=d[i];
          d[ii+1]=d[i+1];
          d[ii+2]=d[i+2];
        }
      }
    }
  }

  ctx.putImageData(img,0,0);
}


// ======================================
// 🧩 HELPERS
// ======================================
function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}

