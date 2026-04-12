export function drawPlayer(ctx, rand, country, mood = "neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  // =========================
  // 🎨 PALETTEN
  // =========================
  const skinSet = pick(rand, [
    ["#f1c27d","#e0ac69","#c68642"],
    ["#e8b17a","#d99a6c","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ]);

  const hair = pick(rand, ["#2c1b18","#3b2f2f","#000","#915c3a"]);

  // =========================
  // 👤 FACE SHAPE (CLEANER)
  // =========================
  const faceType = Math.floor(rand()*3);

  for(let y=0;y<42;y++){
    for(let x=0;x<40;x++){

      const dx = x-20;
      const dy = y-22;

      let inside = false;

      if(faceType === 0) inside = dx*dx + dy*dy < 360;
      if(faceType === 1) inside = (dx*dx)/1.3 + dy*dy < 360;
      if(faceType === 2) inside = dx*dx + (dy*dy)/1.5 < 360;

      if(!inside) continue;

      let col = skinSet[1];

      // Licht von links oben
      if(dx < -5 || dy < -6) col = skinSet[0];
      if(dx > 6 || dy > 6) col = skinSet[2];

      // viel weniger noise!
      if(rand() > 0.97){
        col = skinSet[Math.floor(rand()*3)];
      }

      px(ctx,12+x,8+y,col);
    }
  }

  // =========================
  // 💇 HAIR (STRUCTURED)
  // =========================
  for(let y=0;y<14;y++){
    for(let x=0;x<40;x++){
      if(rand() > 0.25){
        px(ctx,12+x,6+y,hair);
      }
    }
  }

  // Hairline cleaner
  for(let x=14;x<50;x++){
    if(rand() > 0.5){
      px(ctx,x,20,hair);
    }
  }

  // =========================
  // 👁 EYES
  // =========================
  const eyeY = 28;

  drawEye(ctx,26,eyeY,mood);
  drawEye(ctx,36,eyeY,mood);

  // Augenbrauen
  if(rand() > 0.3){
    line(ctx,26,eyeY-3,4,hair);
    line(ctx,36,eyeY-3,4,hair);
  }

  // =========================
  // 👃 NOSE
  // =========================
  px(ctx,32,30,"#00000022");
  px(ctx,31,31,"#00000033");
  px(ctx,33,31,"#ffffff11");

  // =========================
  // 👄 MOUTH
  // =========================
  drawMouth(ctx,36,mood);

  // =========================
  // 😓 SWEAT
  // =========================
  if(mood === "tired" && rand() > 0.6){
    px(ctx,38,30,"#9ca3af");
  }

  // =========================
  // 😡 RED EYES
  // =========================
  if(mood === "angry"){
    px(ctx,26,29,"#550000");
    px(ctx,36,29,"#550000");
  }

  // =========================
  // 🧔 BEARD (CLEANER)
  // =========================
  if(rand() > 0.6){
    for(let y=34;y<44;y++){
      for(let x=22;x<42;x++){
        if(rand() > 0.7){
          px(ctx,x,y,hair);
        }
      }
    }
  }

  // =========================
  // 🎩 CAP
  // =========================
  if(rand() > 0.9){
    const c = getColor(country);
    fill(ctx,14,6,36,6,c);
    fill(ctx,22,12,20,3,c);
  }

  // =========================
  // 👕 BODY
  // =========================
  fill(ctx,18,48,28,12,getColor(country));
}


// =========================
// 👁 EYE (IMPROVED)
// =========================
function drawEye(ctx,x,y,mood){

  // white
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  // pupil
  px(ctx,x,y,"#000");

  if(mood === "angry"){
    px(ctx,x,y-2,"#000");
  }

  if(mood === "tired"){
    px(ctx,x,y-1,"#000");
    px(ctx,x+1,y-1,"#000");
  }

  if(mood === "happy"){
    px(ctx,x,y-1,"#000");
  }
}


// =========================
// 👄 MOUTH (IMPROVED)
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
