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

  // =========================
  // 👤 FACE SHAPE (elliptisch)
  // =========================
  const cx = 32;
  const cy = 30;

  for(let y=10;y<52;y++){
    for(let x=12;x<52;x++){

      let dx = (x-cx)/18;
      let dy = (y-cy)/22;

      if(dx*dx + dy*dy > 1) continue;

      // 💡 echtes Lighting
      let light = (-dx*0.7) + (-dy*0.9);

      let col = skin[1];
      if(light > 0.25) col = skin[0];
      if(light < -0.25) col = skin[2];

      px(ctx,x,y,col);
    }
  }

  // =========================
  // 💇 HAIR (Form statt Noise)
  // =========================
  for(let y=10;y<22;y++){
    for(let x=14;x<50;x++){

      let dx = (x-32)/18;
      let dy = (y-20)/10;

      if(dx*dx + dy*dy < 1){
        px(ctx,x,y,hair);
      }
    }
  }

  // =========================
  // 👁 EYES
  // =========================
  drawEye(ctx,26,30,rand,mood);
  drawEye(ctx,38,30,rand,mood);

  // =========================
  // 👃 NOSE
  // =========================
  for(let i=0;i<4;i++){
    px(ctx,32,32+i,"#00000033");
  }
  px(ctx,31,33,"#ffffff22");

  // =========================
  // 👄 MOUTH
  // =========================
  drawMouth(ctx,36,mood);

  // =========================
  // 👁️ EYEBROWS (super wichtig)
  // =========================
  drawBrows(ctx,mood);

  // =========================
  // 🧔 BEARD (weich, kein Noise)
  // =========================
  if(rand()>0.6){
    for(let y=36;y<48;y++){
      for(let x=20;x<44;x++){
        if((x+y)%2===0){
          px(ctx,x,y,hair);
        }
      }
    }
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
