
export function drawPlayer(ctx, rand, country, mood="neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, [
    ["#f6d2be","#e5b39a","#c98e6b","#a06d4f"],
    ["#eac39b","#d9a676","#b97a4f","#8a5c3a"],
    ["#c68642","#a47138","#7f5a2f","#5a3c22"]
  ]);

  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  // 🔥 VARIATION DNA
  const faceType = Math.floor(rand()*3);
  const eyeOffset = Math.floor(rand()*5) - 2;     // -2 bis +2
  const eyeHeight = Math.floor(rand()*3) - 1;     // -1 bis +1
  const mouthWidth = 6 + Math.floor(rand()*4);    // 6–9
  const mouthOffset = Math.floor(rand()*3);       // asymmetry
  const eyeType = Math.floor(rand()*3);

  drawFace(ctx, skin, faceType);
  drawHair(ctx, hair);

  // 👁 unterschiedliche Position!
  drawEye(ctx, 24 + eyeOffset, 26 + eyeHeight, mood, eyeType);
  drawEye(ctx, 40 - eyeOffset, 26 + eyeHeight, mood, eyeType);

  drawBrows(ctx, mood, eyeOffset, eyeHeight);
  drawNose(ctx, skin);
  drawMouth(ctx, mood, mouthWidth, mouthOffset);

  drawBody(ctx, country);
}


// =========================
// 👤 FACE (VARIANTS)
// =========================
function drawFace(ctx, skin, type){

  const [hl, l, m, d] = skin;

  const width = [18, 22, 20][type];
  const jaw   = [0.6, 0.9, 0.4][type];

  for(let y=8;y<60;y++){
    for(let x=10;x<54;x++){

      let dx = (x-32)/width;
      let dy = (y-32)/26;

      if(dx*dx + dy*dy > 1) continue;

      let col = m;

      let light = (-dx*0.6) + (-dy*0.8);

      if(light > 0.4) col = hl;
      else if(light > 0.1) col = l;
      else if(light < -0.4) col = d;

      // jaw variation
      if(dy > 0.5 && Math.abs(dx) > jaw){
        col = d;
      }

      px(ctx,x,y,col);
    }
  }
}


// =========================
// 👁 EYES (VARIANTS)
// =========================
function drawEye(ctx, cx, cy, mood, type){

  const sizes = [3,4,2];
  const s = sizes[type];

  for(let x=-s;x<=s;x++){
    px(ctx,cx+x,cy,"#fff");
  }

  px(ctx,cx,cy,"#000");
  px(ctx,cx+1,cy,"#fff");

  // lid
  for(let x=-s;x<=s;x++){
    px(ctx,cx+x,cy-1,"#000");
  }

  if(mood==="tired"){
    for(let x=-s;x<=s;x++){
      px(ctx,cx+x,cy+1,"#555");
    }
  }
}


// =========================
// 👁 BROWS
// =========================
function drawBrows(ctx, mood, offset, height){

  const y = 22 + height;

  if(mood==="angry"){
    line(ctx,20 + offset,y,10,"#000");
    line(ctx,34 - offset,y,10,"#000");
  }else{
    line(ctx,20 + offset,y,10,"#222");
    line(ctx,34 - offset,y,10,"#222");
  }
}


// =========================
// 👃 NOSE
// =========================
function drawNose(ctx, skin){

  const [hl, l, m, d] = skin;

  for(let y=28;y<38;y++){
    px(ctx,32,y,d);
  }

  px(ctx,31,32,l);
  px(ctx,31,33,hl);

  px(ctx,33,34,d);

  px(ctx,31,38,d);
  px(ctx,33,38,d);
}


// =========================
// 👄 MOUTH (VARIANTS)
// =========================
function drawMouth(ctx, mood, width, offset){

  const start = 32 - Math.floor(width/2);

  if(mood==="happy"){
    for(let i=0;i<width;i++){
      px(ctx,start+i,46 + (i===offset?1:0),"#722");
    }
  }

  else if(mood==="angry"){
    line(ctx,start,45,width,"#400");
  }

  else{
    line(ctx,start,46,width,"#633");
  }
}


// =========================
// 💇 HAIR
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

