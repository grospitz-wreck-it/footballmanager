
```js
export function drawPlayer(ctx, rand, country, mood="neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, [
    ["#f6d2be","#e5b39a","#c98e6b","#a06d4f"],
    ["#eac39b","#d9a676","#b97a4f","#8a5c3a"],
    ["#c68642","#a47138","#7f5a2f","#5a3c22"]
  ]);

  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  drawFace(ctx, skin);
  drawHair(ctx, hair);
  drawEyes(ctx, 24, 26, mood);
  drawEyes(ctx, 40, 26, mood);
  drawBrows(ctx, mood);
  drawNose(ctx, skin);
  drawMouth(ctx, mood);
  drawBody(ctx, country);
}


// =========================
// 👤 FACE BASE (BIG UPGRADE)
// =========================
function drawFace(ctx, skin){

  const [hl, l, m, d] = skin;

  for(let y=8;y<60;y++){
    for(let x=10;x<54;x++){

      let dx = (x-32)/20;
      let dy = (y-32)/26;

      if(dx*dx + dy*dy > 1) continue;

      let col = m;

      // light direction
      let light = (-dx*0.6) + (-dy*0.8);

      if(light > 0.4) col = hl;
      else if(light > 0.1) col = l;
      else if(light < -0.4) col = d;

      // jaw shadow
      if(dy > 0.5 && Math.abs(dx) > 0.5){
        col = d;
      }

      px(ctx,x,y,col);
    }
  }
}


// =========================
// 💇 HAIR (NOT HELMET)
// =========================
function drawHair(ctx, hair){

  for(let y=6;y<26;y++){
    for(let x=12;x<52;x++){

      let dx = (x-32)/20;
      let dy = (y-20)/14;

      if(dx*dx + dy*dy < 1){
        px(ctx,x,y,hair);
      }
    }
  }
}


// =========================
// 👁 EYES (BIG & CLEAN)
// =========================
function drawEyes(ctx, cx, cy, mood){

  // sclera
  for(let x=-3;x<=3;x++){
    px(ctx,cx+x,cy,"#fff");
  }

  // iris
  px(ctx,cx,cy,"#3b82f6");

  // pupil
  px(ctx,cx,cy,"#000");

  // highlight
  px(ctx,cx+1,cy,"#fff");

  // eyelid
  for(let x=-3;x<=3;x++){
    px(ctx,cx+x,cy-1,"#000");
  }

  if(mood==="tired"){
    for(let x=-3;x<=3;x++){
      px(ctx,cx+x,cy+1,"#555");
    }
  }
}


// =========================
// 👁 BROWS
// =========================
function drawBrows(ctx, mood){

  if(mood==="angry"){
    line(ctx,21,23,10,"#000");
    line(ctx,33,23,10,"#000");
  }else{
    line(ctx,21,22,10,"#222");
    line(ctx,33,22,10,"#222");
  }
}


// =========================
// 👃 NOSE (REAL SHAPE)
// =========================
function drawNose(ctx, skin){

  const [hl, l, m, d] = skin;

  for(let y=28;y<38;y++){
    px(ctx,32,y,d);
  }

  px(ctx,31,32,l);
  px(ctx,31,33,hl);

  px(ctx,33,34,d);

  // nostrils
  px(ctx,31,38,d);
  px(ctx,33,38,d);
}


// =========================
// 👄 MOUTH (VISIBLE)
// =========================
function drawMouth(ctx, mood){

  if(mood==="happy"){
    px(ctx,28,46,"#722");
    px(ctx,29,47,"#722");
    px(ctx,30,48,"#722");
    px(ctx,31,48,"#722");
    px(ctx,32,48,"#722");
    px(ctx,33,47,"#722");
    px(ctx,34,46,"#722");
  }

  else if(mood==="angry"){
    line(ctx,28,45,8,"#400");
  }

  else{
    line(ctx,29,46,6,"#633");
  }
}


// =========================
// 👕 BODY
// =========================
function drawBody(ctx, country){
  fill(ctx,18,52,28,12,getColor(country));
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
