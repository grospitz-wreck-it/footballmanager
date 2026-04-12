```js
// =====================================
// 🎯 HIGH QUALITY PIXEL FACE GENERATOR
// =====================================
export function drawPlayer(ctx, rand, country, mood="neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  // =========================
  // 🎨 SKIN PALETTES
  // =========================
  const skins = [
    ["#f2d6cb","#e0b7a3","#c28b6a"],
    ["#e8b17a","#d99a6c","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ];
  const skin = pick(rand, skins);

  const hair = pick(rand, ["#1c1c1c","#2b2b2b","#5a3a2e","#d6a77a"]);

  // =========================
  // 👤 FACE (PLANES + LIGHT)
  // =========================
  drawFace(ctx, skin);

  // =========================
  // 💇 HAIR (FORM BASED)
  // =========================
  drawHair(ctx, hair);

  // =========================
  // 👕 BODY
  // =========================
  fill(ctx,20,48,24,12,getColor(country));
}


// =====================================
// 👤 FACE CORE
// =====================================
function drawFace(ctx, skin){

  const light = skin[0];
  const mid   = skin[1];
  const dark  = skin[2];

  const cx = 32;
  const cy = 30;

  // =========================
  // BASE SHAPE (ELLIPSE)
  // =========================
  for(let y=12;y<52;y++){
    for(let x=16;x<48;x++){

      let dx = (x-cx)/16;
      let dy = (y-cy)/20;

      if(dx*dx + dy*dy > 1) continue;

      let col = mid;

      // 🎯 PLANAR SHADING
      if(dy < -0.35) col = light;     // forehead
      if(dy > 0.45) col = dark;       // chin
      if(dx > 0.55) col = dark;       // shadow side
      if(dx < -0.45) col = light;     // light side

      px(ctx,x,y,col);
    }
  }

  // =========================
  // 👁 EYE SOCKETS
  // =========================
  for(let x=24;x<=28;x++) px(ctx,x,30,dark);
  for(let x=36;x<=40;x++) px(ctx,x,30,dark);

  // =========================
  // 👁 EYES
  // =========================
  drawEye(ctx,26,30);
  drawEye(ctx,38,30);

  // =========================
  // 👁 EYELIDS
  // =========================
  line(ctx,24,29,6,"#000");
  line(ctx,36,29,6,"#000");

  // =========================
  // 👁 EYEBROWS
  // =========================
  line(ctx,24,27,6,"#111");
  line(ctx,36,27,6,"#111");

  // =========================
  // 👃 NOSE
  // =========================
  for(let y=30;y<38;y++){
    px(ctx,32,y,dark);
  }

  px(ctx,31,34,light);
  px(ctx,33,34,dark);

  px(ctx,31,38,dark);
  px(ctx,32,38,dark);
  px(ctx,33,38,dark);

  // =========================
  // 👄 MOUTH
  // =========================
  px(ctx,29,42,dark);
  px(ctx,30,43,dark);
  px(ctx,31,43,dark);
  px(ctx,32,43,dark);
  px(ctx,33,42,dark);

  px(ctx,31,44,light); // lip highlight
}


// =====================================
// 👁 EYE (HQ)
// =====================================
function drawEye(ctx,x,y){

  // sclera
  px(ctx,x-1,y,"#fff");
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  // iris
  px(ctx,x,y,"#3b82f6");

  // pupil
  px(ctx,x,y,"#000");

  // highlight
  px(ctx,x+1,y,"#fff");
}


// =====================================
// 💇 HAIR (CLEAN SHAPE)
// =====================================
function drawHair(ctx, hair){

  for(let y=10;y<24;y++){
    for(let x=16;x<48;x++){

      let dx = (x-32)/18;
      let dy = (y-20)/10;

      if(dx*dx + dy*dy < 1){
        px(ctx,x,y,hair);
      }
    }
  }
}


// =====================================
// 🧩 HELPERS
// =====================================
function px(ctx,x,y,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,1,1);
}

function fill(ctx,x,y,w,h,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,h);
}

function line(ctx,x,y,w,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,1);
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
```
