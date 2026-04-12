export function drawPlayer(ctx, rand, country, mood = "neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  // =========================
  // 🎨 PALETTEN (REALISTISCHER)
  // =========================
  const skinSet = pick(rand, [
    ["#f2d6cb","#e0b7a3","#c28b6a"],
    ["#e8b17a","#d99a6c","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ]);

  const hair = pick(rand, ["#1c1c1c","#2b2b2b","#3b2f2f","#915c3a","#d6a77a"]);

  // =========================
  // 👤 FACE SHAPE (klarer)
  // =========================
  const faceType = Math.floor(rand()*3);

  for(let y=0;y<44;y++){
    for(let x=0;x<40;x++){

      let dx = x-20;
      let dy = y-22;

      let inside = false;

      if(faceType === 0) inside = dx*dx + dy*dy < 360;          // rund
      if(faceType === 1) inside = (dx*dx)/1.4 + dy*dy < 360;    // schmal
      if(faceType === 2) inside = dx*dx + (dy*dy)/1.5 < 360;    // breit

      if(!inside) continue;

      // 💡 Lichtquelle oben links
      let col = skinSet[1];

      if(dx < -5 || dy < -6) col = skinSet[0];
      if(dx > 6 || dy > 6) col = skinSet[2];

      px(ctx,12+x,8+y,col);
    }
  }

  // =========================
  // 💇 HAIR STYLES
  // =========================
  const hairStyle = Math.floor(rand()*4);

  if(hairStyle === 0){ // short
    for(let y=0;y<14;y++){
      for(let x=0;x<44;x++){
        if(rand()>0.3) px(ctx,10+x,6+y,hair);
      }
    }
  }

  if(hairStyle === 1){ // fade
    for(let y=0;y<18;y++){
      for(let x=0;x<44;x++){
        if(rand() > (y/20)) px(ctx,10+x,6+y,hair);
      }
    }
  }

  if(hairStyle === 2){ // afro
    for(let y=0;y<20;y++){
      for(let x=0;x<44;x++){
        if(rand()>0.5) px(ctx,10+x,6+y,hair);
      }
    }
  }

  if(hairStyle === 3){ // buzz
    for(let y=0;y<10;y++){
      for(let x=0;x<44;x++){
        if(rand()>0.7) px(ctx,10+x,6+y,hair);
      }
    }
  }

  // =========================
  // 👁 EYES (REAL)
  // =========================
  const eyeY = 28;

  drawEye(ctx,26,eyeY,rand,mood);
  drawEye(ctx,36,eyeY,rand,mood);

  // =========================
  // 👃 NOSE (DEPTH)
  // =========================
  px(ctx,31,31,"#00000022");
  px(ctx,32,32,"#00000033");
  px(ctx,33,31,"#ffffff22");

  // =========================
  // 👄 MOUTH (EMOTION)
  // =========================
  drawMouth(ctx,36,mood);

  // =========================
  // 🧔 BEARD
  // =========================
  if(rand()>0.6){
    for(let y=34;y<44;y++){
      for(let x=20;x<44;x++){
        if(rand()>0.6) px(ctx,x,y,hair);
      }
    }
  }

  // =========================
  // 🎩 CAP
  // =========================
  if(rand()>0.85){
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
// 👁 EYE (DETAIL)
// =========================
function drawEye(ctx,x,y,rand,mood){

  // Weiß
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  // Iris
  const iris = pick(rand, ["#3b82f6","#22c55e","#6b7280","#92400e"]);
  px(ctx,x,y,iris);

  // Pupille
  px(ctx,x,y,"#000");

  // Highlight
  if(rand()>0.5) px(ctx,x+1,y,"#fff");

  // Emotion
  if(mood==="angry"){
    px(ctx,x,y-2,"#000");
  }

  if(mood==="tired"){
    px(ctx,x,y+1,"#000");
  }
}


// =========================
// 👄 MOUTH
// =========================
function drawMouth(ctx,y,mood){

  if(mood==="happy"){
    px(ctx,30,y,"#6b3a3a");
    px(ctx,31,y+1,"#6b3a3a");
    px(ctx,32,y,"#6b3a3a");
  }

  else if(mood==="angry"){
    line(ctx,29,y,6,"#300");
  }

  else if(mood==="tired"){
    line(ctx,30,y,4,"#555");
  }

  else{
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
