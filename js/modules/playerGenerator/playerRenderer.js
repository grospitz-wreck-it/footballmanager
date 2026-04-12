
export function drawPlayer(ctx, rand, country, mood = "neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skinLight = "#f6d2be";
  const skinMid   = "#e5b39a";
  const skinDark  = "#c98e6b";
  const hair      = "#2b2b2b";

  // =========================
  // 👤 HEAD
  // =========================
  for(let y=14;y<50;y++){
    for(let x=18;x<46;x++){

      let dx = (x-32)/14;
      let dy = (y-30)/18;

      if(dx*dx + dy*dy > 1) continue;

      let col = skinMid;

      if(dy < -0.35) col = skinLight;
      if(dy > 0.55) col = skinDark;

      px(ctx,x,y,col);
    }
  }

  // =========================
  // 💇 HAIR
  // =========================
  fill(ctx,18,14,28,10,hair);
  fill(ctx,18,20,6,16,hair);
  fill(ctx,40,20,6,16,hair);

  // =========================
  // 👁 SOCKETS
  // =========================
  fill(ctx,24,29,6,3,skinDark);
  fill(ctx,36,29,6,3,skinDark);

  // =========================
  // 👁 EYES
  // =========================
  drawEye(ctx,26,30,mood);
  drawEye(ctx,38,30,mood);

  // =========================
  // 👁 EYELIDS / BROWS (Mood!)
  // =========================
  if(mood === "angry"){
    line(ctx,24,27,6,"#000");
    line(ctx,36,27,6,"#000");
  } else if(mood === "tired"){
    line(ctx,24,30,6,"#555");
    line(ctx,36,30,6,"#555");
  } else {
    line(ctx,24,28,6,"#000");
    line(ctx,36,28,6,"#000");

    line(ctx,24,26,6,"#111");
    line(ctx,36,26,6,"#111");
  }

  // =========================
  // 👃 NOSE
  // =========================
  for(let y=30;y<37;y++){
    px(ctx,32,y,skinDark);
  }

  px(ctx,31,33,skinLight);
  px(ctx,33,34,skinDark);

  px(ctx,31,37,skinDark);
  px(ctx,33,37,skinDark);

  // =========================
  // 👄 MOUTH (Mood!)
  // =========================
  if(mood === "happy"){
    px(ctx,29,42,skinDark);
    px(ctx,30,43,skinDark);
    px(ctx,31,44,skinDark);
    px(ctx,32,43,skinDark);
    px(ctx,33,42,skinDark);
  }

  else if(mood === "angry"){
    px(ctx,29,43,"#300");
    px(ctx,30,42,"#300");
    px(ctx,31,42,"#300");
    px(ctx,32,42,"#300");
    px(ctx,33,43,"#300");
  }

  else if(mood === "tired"){
    px(ctx,30,43,"#555");
    px(ctx,31,43,"#555");
  }

  else {
    px(ctx,29,42,skinDark);
    px(ctx,30,43,skinDark);
    px(ctx,31,43,skinDark);
    px(ctx,32,43,skinDark);
    px(ctx,33,42,skinDark);

    px(ctx,31,44,skinLight);
  }

  // =========================
  // 👕 BODY
  // =========================
  fill(ctx,20,48,24,12,getColor(country));
}


// =========================
// 👁 EYE
// =========================
function drawEye(ctx,x,y,mood){

  px(ctx,x-1,y,"#fff");
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  px(ctx,x,y,"#3b82f6");
  px(ctx,x,y,"#000");

  px(ctx,x+1,y,"#fff");

  if(mood === "tired"){
    px(ctx,x,y+1,"#555");
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
  ctx.fillRect(x,y,w,1);
}

function getColor(code){
  return {
    DE:"#dd0000",
    FR:"#0055A4",
    BR:"#009C3B"
  }[code] || "#888";
}

