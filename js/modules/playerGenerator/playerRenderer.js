export function drawPlayer(ctx, rand, country, mood="neutral"){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  // =========================
  // 🎨 PALETTEN
  // =========================
  const skins = [
    ["#f2d6cb","#e0b7a3","#c28b6a"],
    ["#e8b17a","#d99a6c","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ];
  const skin = pick(rand, skins);

  const hair = pick(rand, ["#1c1c1c","#2b2b2b","#5a3a2e","#d6a77a"]);

 function drawFace(ctx, skin){

  const light = skin[0];
  const mid   = skin[1];
  const dark  = skin[2];

  // =========================
  // BASE SHAPE (Planes!)
  // =========================
  for(let y=12;y<52;y++){
    for(let x=16;x<48;x++){

      let dx = (x-32)/16;
      let dy = (y-30)/20;

      if(dx*dx + dy*dy > 1) continue;

      let col = mid;

      // 🔥 PLANES statt Noise
      if(dy < -0.3) col = light;        // Stirn
      if(dy > 0.4) col = dark;          // Kinn
      if(dx > 0.5) col = dark;          // Schattenseite
      if(dx < -0.4) col = light;        // Lichtseite

      px(ctx,x,y,col);
    }
  }

  // =========================
  // 👁 EYE SOCKETS (entscheidend!)
  // =========================
  for(let x=24;x<=28;x++){
    px(ctx,x,30,dark);
  }
  for(let x=36;x<=40;x++){
    px(ctx,x,30,dark);
  }

  // =========================
  // 👁 EYES (sauber!)
  // =========================
  drawEyeHQ(ctx,26,30);
  drawEyeHQ(ctx,38,30);

  // =========================
  // 👁 EYELIDS (macht 80% Realismus)
  // =========================
  line(ctx,24,29,6,"#000");
  line(ctx,36,29,6,"#000");

  // =========================
  // 👁 EYEBROWS
  // =========================
  line(ctx,24,27,6,"#111");
  line(ctx,36,27,6,"#111");

  // =========================
  // 👃 NOSE (volumetrisch)
  // =========================
  for(let y=30;y<38;y++){
    px(ctx,32,y,dark);
  }

  px(ctx,31,34,light); // highlight
  px(ctx,33,34,dark);  // shadow edge

  // Nasenspitze
  px(ctx,31,38,dark);
  px(ctx,32,38,dark);
  px(ctx,33,38,dark);

  // =========================
  // 👄 MOUTH (Form, nicht Linie)
  // =========================
  px(ctx,29,42,dark);
  px(ctx,30,43,dark);
  px(ctx,31,43,dark);
  px(ctx,32,43,dark);
  px(ctx,33,42,dark);

  // Unterlippen-Highlight
  px(ctx,31,44,light);
}

  // =========================
  // 👕 BODY
  // =========================
  fill(ctx,20,48,24,12,getColor(country));
}


// =========================
// 👁 EYE (richtig gebaut)
// =========================
function drawEye(ctx,x,y,rand,mood){

  // sclera
  px(ctx,x-1,y,"#fff");
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  const iris = pick(rand, ["#3b82f6","#22c55e","#6b7280","#92400e"]);

  px(ctx,x,y,iris);
  px(ctx,x,y,"#000");

  // highlight
  px(ctx,x+1,y,"#fff");

  // eyelid
  px(ctx,x-1,y-1,"#000");
  px(ctx,x,y-1,"#000");
  px(ctx,x+1,y-1,"#000");

  if(mood==="tired"){
    px(ctx,x-1,y+1,"#555");
    px(ctx,x,y+1,"#555");
  }
}


// =========================
// 👄 MOUTH (form)
// =========================
function drawMouth(ctx,y,mood){

  if(mood==="happy"){
    px(ctx,30,y,"#5a2a2a");
    px(ctx,31,y+1,"#5a2a2a");
    px(ctx,32,y,"#5a2a2a");
  }

  else if(mood==="angry"){
    px(ctx,29,y,"#300");
    px(ctx,30,y-1,"#300");
    px(ctx,31,y-1,"#300");
    px(ctx,32,y,"#300");
  }

  else{
    px(ctx,30,y,"#5a2a2a");
    px(ctx,31,y,"#5a2a2a");
  }
}


// =========================
// 😠 EYEBROWS = Ausdruck
// =========================
function drawBrows(ctx,mood){

  if(mood==="angry"){
    line(ctx,24,27,6,"#000");
    line(ctx,36,27,6,"#000");
  }else{
    line(ctx,24,26,6,"#222");
    line(ctx,36,26,6,"#222");
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
