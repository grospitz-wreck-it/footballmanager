
// ======================================
// 🎮 DOOM STYLE PLAYER RENDERER (UPGRADED)
// ======================================
import faceData from "./faceData.js";
export function drawPlayer(ctx, rand, country, mood = "neutral") {

  const scale = 4;
  const buffer = document.createElement("canvas");
  buffer.width = 64 * scale;
  buffer.height = 64 * scale;

  const bctx = buffer.getContext("2d");

  const cx = 128;
  const cy = 140;

  // =========================
  // 🎲 VARIATION
  // =========================
  const faceW = 55 + rand()*30;
  const faceH = 75 + rand()*30;
  const eyeY = 105 + rand()*15;
  const eyeSpacing = 45 + rand()*20;

  const skin = pick(rand, ["#f6d2be","#eac39b","#c68642","#8d5524"]);
  const hair = pick(rand, ["#1c1c1c","#3b2f2f","#6b4f3a","#d6a77a"]);

  const hairStyle = pick(rand, ["short","long","bald","messy"]);
  const beard = pick(rand, ["none","stubble","full"]);
  const glasses = rand() < 0.25;

  // =========================
  // 👤 FACE BASE
  // =========================
  bctx.fillStyle = skin;
  bctx.beginPath();

  for(let a=0;a<=Math.PI*2;a+=0.25){
    let x = cx + Math.cos(a)*faceW + (rand()-0.5)*8;
    let y = cy + Math.sin(a)*faceH + (rand()-0.5)*8;

    if(a===0) bctx.moveTo(x,y);
    else bctx.lineTo(x,y);
  }

  bctx.closePath();
  bctx.fill();

  // =========================
  // 🌗 LIGHT (TOP LIGHT)
  // =========================
  let grad = bctx.createRadialGradient(cx, 80, 20, cx, 140, 180);
  grad.addColorStop(0, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(0,0,0,0.5)");

  bctx.fillStyle = grad;
  bctx.fill();

  // =========================
  // 🧠 EYE SHADOWS (WICHTIG!)
  // =========================
  drawEyeSocket(bctx, cx - eyeSpacing/2, eyeY);
  drawEyeSocket(bctx, cx + eyeSpacing/2, eyeY);

  // =========================
  // 👁 EYES (mehr Doom)
  // =========================
  drawEye(bctx, cx - eyeSpacing/2, eyeY, rand);
  drawEye(bctx, cx + eyeSpacing/2, eyeY, rand);

  // =========================
  // 👃 NOSE SHADOW
  // =========================
  bctx.fillStyle = "rgba(0,0,0,0.25)";
  bctx.beginPath();
  bctx.ellipse(cx, 150, 12, 25, 0, 0, Math.PI);
  bctx.fill();

  // =========================
  // 👄 MOUTH (volume!)
  // =========================
  bctx.fillStyle = "#400";
  bctx.beginPath();
  bctx.ellipse(cx, 190, 30, 12 + rand()*6, 0, 0, Math.PI*2);
  bctx.fill();

  // lip shadow
  bctx.fillStyle = "rgba(0,0,0,0.3)";
  bctx.fillRect(cx-30, 185, 60, 4);

  // =========================
  // 💇 HAIR
  // =========================
  drawHair(bctx, cx, faceW, hairStyle, hair, rand);

  // =========================
  // 🧔 BEARD
  // =========================
  drawBeard(bctx, cx, cy, beard);

  // =========================
  // 👓 GLASSES
  // =========================
  if(glasses){
    drawGlasses(bctx, cx-eyeSpacing/2, cx+eyeSpacing/2, eyeY);
  }

  // =========================
  // 🎨 SKIN NOISE (WICHTIG)
  // =========================
  addNoise(bctx, buffer.width, buffer.height, 10);

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
// 👁 EYE SOCKET (depth)
// ======================================
function drawEyeSocket(ctx,x,y){
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x,y,20,14,0,0,Math.PI*2);
  ctx.fill();
}


// ======================================
// 👁 EYE (realer)
// ======================================
function drawEye(ctx,x,y,rand){

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(x,y,14,9,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + (rand()-0.5)*4, y, 5, 0, Math.PI*2);
  ctx.fill();
}


// ======================================
// 💇 HAIR
// ======================================
function drawHair(ctx,cx,faceW,style,color,rand){

  if(style==="bald") return;

  ctx.fillStyle = color;
  ctx.beginPath();

  for(let a=0;a<=Math.PI;a+=0.2){
    let x = cx + Math.cos(a)*(faceW+20) + (rand()-0.5)*10;
    let y = 90 + Math.sin(a)*70 + (rand()-0.5)*10;

    if(a===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  }

  ctx.closePath();
  ctx.fill();
}


// ======================================
// 🧔 BEARD
// ======================================
function drawBeard(ctx,cx,cy,type){

  if(type==="none") return;

  ctx.fillStyle="rgba(0,0,0,0.35)";

  ctx.beginPath();
  ctx.ellipse(cx,cy+40,50,40,0,0,Math.PI);
  ctx.fill();
}


// ======================================
// 👓 GLASSES
// ======================================
function drawGlasses(ctx,x1,x2,y){

  ctx.strokeStyle="#000";
  ctx.lineWidth=3;

  ctx.strokeRect(x1-14,y-8,28,16);
  ctx.strokeRect(x2-14,y-8,28,16);

  ctx.beginPath();
  ctx.moveTo(x1+14,y);
  ctx.lineTo(x2-14,y);
  ctx.stroke();
}


// ======================================
// 🎨 NOISE
// ======================================
function addNoise(ctx,w,h,amount){

  let img = ctx.getImageData(0,0,w,h);
  let d = img.data;

  for(let i=0;i<d.length;i+=4){
    let n = (Math.random()-0.5)*amount;

    d[i]+=n;
    d[i+1]+=n;
    d[i+2]+=n;
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
  let img = ctx.getImageData(0,0,w,h);
  let d = img.data;

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

  let img = ctx.getImageData(0,0,w,h);
  let d = img.data;

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
// HELPERS
// ======================================
function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}

