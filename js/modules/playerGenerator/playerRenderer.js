export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, ['#f1c27d','#e0ac69','#c68642','#8d5524']);
  const hair = pick(rand, ['#2c1b18','#3b2f2f','#000','#d2b48c','#915c3a']);

  // =========================
  // 👤 HEAD (größer!)
  // =========================
  circle(ctx, 32, 28, 18, skin);

  // 🎨 SHADING
  shade(ctx, 32, 28, 18);

  // =========================
  // 💇 HAIR (realistischer)
  // =========================
  const hairType = Math.floor(rand()*4);

  if(hairType === 0) circle(ctx, 32, 16, 18, hair); // voll
  if(hairType === 1) rect(ctx, 18, 10, 28, 10, hair); // kurz
  if(hairType === 2) rect(ctx, 20, 12, 24, 6, hair); // dünn
  // 3 = glatze

  // =========================
  // 👀 EYES (größer + Form)
  // =========================
  eye(ctx, 26, 28);
  eye(ctx, 36, 28);

  // =========================
  // 👃 NOSE
  // =========================
  rect(ctx, 31, 30, 2, 4, "#00000022");

  // =========================
  // 👄 MOUTH
  // =========================
  const m = rand();
  if(m < 0.3) line(ctx, 27, 36, 10, "#522");
  else if(m < 0.6) line(ctx, 28, 36, 8, "#300");
  else rect(ctx, 30, 36, 4, 2, "#633");

  // =========================
  // 🧔 BEARD (feiner)
  // =========================
  if(rand() > 0.6){
    for(let y=34;y<44;y++){
      for(let x=22;x<42;x++){
        if(rand() > 0.5){
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
    rect(ctx, 18, 10, 28, 6, c);
    rect(ctx, 24, 16, 16, 3, c);
  }

  // =========================
  // 👕 BODY
  // =========================
  rect(ctx, 18, 46, 28, 10, getColor(country));
}


// =========================
// HELPERS
// =========================

function px(ctx,x,y,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,1,1);
}

function rect(ctx,x,y,w,h,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,h);
}

function line(ctx,x,y,w,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,2);
}

function circle(ctx,cx,cy,r,c){
  ctx.fillStyle=c;
  for(let y=-r;y<=r;y++){
    for(let x=-r;x<=r;x++){
      if(x*x + y*y < r*r){
        ctx.fillRect(cx+x, cy+y, 1, 1);
      }
    }
  }
}

function shade(ctx,cx,cy,r){
  for(let y=-r;y<=r;y++){
    for(let x=-r;x<=r;x++){
      if(x*x + y*y < r*r){
        if(x < -5) px(ctx, cx+x, cy+y, "#00000022");
        if(x > 5) px(ctx, cx+x, cy+y, "#ffffff11");
      }
    }
  }
}

function eye(ctx,x,y){
  px(ctx,x,y,"#000");
  px(ctx,x+1,y,"#000");
  px(ctx,x,y,"#fff");
}

function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}

function getColor(code){
  return {
    DE:"#dd0000",
    FR:"#0055A4",
    BR:"#009C3B",
    ES:"#aa151b"
  }[code] || "#888";
}
