
// ======================================
// 🎮 PLAYER RENDERER (FIXED LANDMARK HYBRID)
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

  normalize(pts, cx, cy, 1.2);

  // =========================
  // 🎨 COLORS
  // =========================
  const skin = pick(rand, ["#f6d2be","#eac39b","#c68642","#8d5524"]);
  const hair = pick(rand, ["#1c1c1c","#3b2f2f","#6b4f3a","#d6a77a"]);

  // =========================
  // 👤 HEAD (NOT from landmarks!)
  // =========================
  bctx.fillStyle = skin;
  bctx.beginPath();
  bctx.ellipse(cx, cy, 70, 90, 0, 0, Math.PI*2);
  bctx.fill();

  // =========================
  // 🌗 SHADING
  // =========================
  let grad = bctx.createLinearGradient(0, 60, 0, 240);
  grad.addColorStop(0,"rgba(255,255,255,0.25)");
  grad.addColorStop(1,"rgba(0,0,0,0.5)");
  bctx.fillStyle = grad;
  bctx.fill();

  // =========================
  // 👁 EYE SOCKETS (DEPTH!)
  // =========================
  drawEyeSocket(bctx, center(pts.slice(36,42)));
  drawEyeSocket(bctx, center(pts.slice(42,48)));

  // =========================
  // 👁 EYES (from landmarks)
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
  // 👄 MOUTH (from landmarks)
  // =========================
  drawMouth(bctx, pts.slice(48,60));

  // =========================
  // 💇 HAIR (simple doom style)
  // =========================
  bctx.fillStyle = hair;
  bctx.beginPath();
  bctx.ellipse(cx, cy-60, 90, 60, 0, Math.PI, 0);
  bctx.fill();

  // =========================
  // 🎨 NOISE (important!)
  // =========================
  addNoise(bctx, buffer.width, buffer.height, 12);

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
// 👄 MOUTH
// ======================================
function drawMouth(ctx, pts){

  ctx.fillStyle = "#400";
  ctx.beginPath();

  ctx.moveTo(pts[0][0], pts[0][1]);
  for(let p of pts){
    ctx.lineTo(p[0], p[1]);
  }

  ctx.closePath();
  ctx.fill();
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

function normalize(pts,cx,cy,scale){
  let mx=0,my=0;
  for(let p of pts){ mx+=p[0]; my+=p[1]; }
  mx/=pts.length; my/=pts.length;

  for(let p of pts){
    p[0]=(p[0]-mx)*scale+cx;
    p[1]=(p[1]-my)*scale+cy;
  }
}

function center(pts){
  let x=0,y=0;
  for(let p of pts){ x+=p[0]; y+=p[1]; }
  return [x/pts.length,y/pts.length];
}


// ======================================
// 🎨 NOISE
// ======================================
function addNoise(ctx,w,h,amount){
  let img=ctx.getImageData(0,0,w,h);
  let d=img.data;

  for(let i=0;i<d.length;i+=4){
    let n=(Math.random()-0.5)*amount;
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

function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}



// ======================================
// HELPERS
// ======================================
function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}

