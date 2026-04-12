export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, [
    ["#f1c27d","#e0ac69","#c68642"],
    ["#e8b17a","#d99a6c","#b97a4f"],
    ["#c68642","#a47138","#7f5a2f"],
    ["#8d5524","#6a3d1a","#4b2a12"]
  ]);

  const hair = pick(rand, [
    "#2c1b18","#3b2f2f","#000","#915c3a","#d2b48c"
  ]);

  // =========================
  // 👤 HEAD BASE (weich)
  // =========================
  for(let y=0;y<40;y++){
    for(let x=0;x<40;x++){

      const dx = x-20;
      const dy = y-22;

      if(dx*dx + dy*dy < 360){

        let col = skin[1];

        if(dx < -5) col = skin[2]; // shadow
        if(dx > 6) col = skin[0];  // light

        // noise → realistischer look
        if(rand() > 0.92){
          col = skin[Math.floor(rand()*3)];
        }

        px(ctx,12+x,8+y,col);
      }
    }
  }

  // =========================
  // 💇 HAIR (organisch!)
  // =========================
  for(let y=0;y<18;y++){
    for(let x=0;x<44;x++){
      if(rand() > 0.45){
        px(ctx,10+x,6+y,hair);
      }
    }
  }

  // =========================
  // 👀 EYES (richtig!)
  // =========================
  eye(ctx, 26, 28, rand);
  eye(ctx, 36, 28, rand);

  // =========================
  // 👃 NOSE (weich)
  // =========================
  px(ctx,32,30,"#00000022");
  px(ctx,31,31,"#00000022");

  // =========================
  // 👄 MOUTH (natürlich)
  // =========================
  if(rand() > 0.5){
    line(ctx,28,36,8,"#5a2a2a");
  } else {
    px(ctx,30,36,"#5a2a2a");
    px(ctx,31,36,"#5a2a2a");
  }

  // =========================
  // 🧔 BEARD (fein!)
  // =========================
  if(rand() > 0.6){
    for(let y=34;y<44;y++){
      for(let x=20;x<44;x++){
        if(rand() > 0.6){
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

function eye(ctx,x,y,rand){
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  px(ctx,x,y,"#000");
  if(rand() > 0.5) px(ctx,x+1,y,"#000");
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
