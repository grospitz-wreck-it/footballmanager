export function drawPlayer(ctx, rand, country, mood = "neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  // =========================
  // 🎨 PALETTEN (3-stufig!)
  // =========================
  const skinSet = pick(rand, [
    ["#f1c27d","#e0ac69","#c68642"],
    ["#e8b17a","#d99a6c","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ]);

  const hair = pick(rand, ["#2c1b18","#3b2f2f","#000","#915c3a"]);

  // =========================
  // 👤 FACE SHAPE
  // =========================
  const faceType = Math.floor(rand()*3);

  for(let y=0;y<42;y++){
    for(let x=0;x<40;x++){

      let dx = x-20;
      let dy = y-22;

      let inside = false;

      if(faceType === 0) inside = dx*dx + dy*dy < 360;
      if(faceType === 1) inside = (dx*dx)/1.3 + dy*dy < 360;
      if(faceType === 2) inside = dx*dx + (dy*dy)/1.5 < 360;

      if(!inside) continue;

      // Licht
      let col = skinSet[1];

      if(dx < -4 || dy < -6) col = skinSet[0];
      if(dx > 6 || dy > 6) col = skinSet[2];

      // Noise
      if(rand() > 0.94){
        col = skinSet[Math.floor(rand()*3)];
      }

      px(ctx,12+x,8+y,col);
    }
  }

  // =========================
  // 💇 HAIR
  // =========================
  for(let y=0;y<18;y++){
    for(let x=0;x<44;x++){
      if(rand() > 0.4){
        px(ctx,10+x,6+y,hair);
      }
    }
  }

  // =========================
  // 👁 AUGEN + BRAUEN
  // =========================
  const eyeY = 28 + Math.floor(rand()*2);

  drawEye(ctx,26,eyeY,rand,mood);
  drawEye(ctx,36,eyeY,rand,mood);

  if(rand() > 0.3){
    line(ctx,26,eyeY-2,4,hair);
    line(ctx,36,eyeY-2,4,hair);
  }

  // =========================
  // 👃 NOSE
  // =========================
  px(ctx,32,30,"#00000022");
  px(ctx,31,31,"#00000033");
  px(ctx,33,31,"#ffffff11");

  // =========================
  // 👄 MOUTH (EMOTION!)
  // =========================
  drawMouth(ctx,36,mood);

  // =========================
  // 😓 SWEAT (tired)
  // =========================
  if(mood === "tired" && rand() > 0.5){
    px(ctx,38,30,"#9ca3af");
  }

  // =========================
  // 😡 RED EYES (angry)
  // =========================
  if(mood === "angry"){
    px(ctx,26,29,"#550000");
    px(ctx,36,29,"#550000");
  }

  // =========================
  // 🧔 BEARD
  // =========================
  if(rand() > 0.6){
    for(let y=34;y<44;y++){
      for(let x=20;x<44;x++){
        if(rand() > 0.65){
          px(ctx,x,y,hair);
        }
      }
    }
  }

  // =========================
  // 🎩 CAP
  // =========================
  if(rand() > 0.85){
    const c = getColor(country);
    fill(ctx,12,6,40,6,c);
    fill(ctx,22,12,20,3,c);
  }

  // =========================
  // 👕 BODY
  // =========================
  fill(ctx,18,48,28,12,getColor(country));
}


// =========================
// 👁 EYE (mit Emotion)
// =========================
function drawEye(ctx,x,y,rand,mood){

  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  px(ctx,x,y,"#000");

  if(mood === "angry"){
    px(ctx,x,y-2,"#000");
    px(ctx,x+1,y-1,"#000");
  }

  if(mood === "tired"){
    px(ctx,x,y,"#000");
    px(ctx,x+1,y,"#000");
    px(ctx,x,y-1,"#000");
  }

  if(mood === "happy"){
    px(ctx,x,y-1,"#000");
  }
}


// =========================
// 👄 MOUTH (mit Emotion)
// =========================
function drawMouth(ctx,y,mood){

  if(mood === "happy"){
    px(ctx,30,y,"#6b3a3a");
    px(ctx,31,y+1,"#6b3a3a");
    px(ctx,32,y,"#6b3a3a");
  }

  else if(mood === "angry"){
    line(ctx,29,y,6,"#300");
  }

  else if(mood === "tired"){
    line(ctx,30,y,4,"#555");
  }

  else {
    px(ctx,30,y,"#6b3a3a");
    px(ctx,31,y,"#6b3a3a");
  }
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
  ctx.fillRect(x,y,w,2);
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
