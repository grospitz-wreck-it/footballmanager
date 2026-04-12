```js
// =====================================
// 🎯 CLEAN PIXEL AVATAR GENERATOR
// =====================================

export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, [
    ["#f6d2be","#e5b39a","#c98e6b"],
    ["#eac39b","#d9a676","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ]);

  const hair = pick(rand, [
    "#2b2b2b","#5a3a2e","#d6a77a","#915c3a","#1c1c1c"
  ]);

  drawHead(ctx, skin);
  drawHair(ctx, hair, rand);
  drawEyes(ctx, rand);
  drawMouth(ctx, rand);
  drawBody(ctx, country);
}


// =========================
// 👤 HEAD
// =========================
function drawHead(ctx, skin){

  const [light, mid, dark] = skin;

  for(let y=14;y<50;y++){
    for(let x=18;x<46;x++){

      let dx = (x-32)/14;
      let dy = (y-30)/18;

      if(dx*dx + dy*dy > 1) continue;

      let col = mid;

      if(dy < -0.3) col = light;
      if(dy > 0.5) col = dark;

      px(ctx,x,y,col);
    }
  }
}


// =========================
// 💇 HAIR
// =========================
function drawHair(ctx, hair, rand){

  const style = Math.floor(rand()*3);

  if(style === 0){
    fill(ctx,18,14,28,8,hair);
  }

  if(style === 1){
    fill(ctx,18,14,28,10,hair);
    fill(ctx,18,20,10,10,hair);
  }

  if(style === 2){
    fill(ctx,18,14,28,12,hair);
    fill(ctx,18,20,6,20,hair);
    fill(ctx,40,20,6,20,hair);
  }
}


// =========================
// 👁 EYES
// =========================
function drawEyes(ctx, rand){
  drawEye(ctx,26,30);
  drawEye(ctx,38,30);
}

function drawEye(ctx,x,y){

  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  px(ctx,x,y,"#000");

  px(ctx,x,y-1,"#000");
  px(ctx,x+1,y-1,"#000");
}


// =========================
// 👄 MOUTH
// =========================
function drawMouth(ctx, rand){

  const style = Math.floor(rand()*3);

  if(style === 0){
    px(ctx,30,40,"#e11");
    px(ctx,31,41,"#e11");
    px(ctx,32,40,"#e11");
  }

  if(style === 1){
    px(ctx,30,40,"#a33");
    px(ctx,31,40,"#a33");
  }

  if(style === 2){
    px(ctx,30,40,"#000");
    px(ctx,31,40,"#000");
    px(ctx,31,41,"#f66");
  }
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
```
