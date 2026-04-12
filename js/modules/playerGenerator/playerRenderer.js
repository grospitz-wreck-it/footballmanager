export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;

  const skin = pick(rand, ['#f1c27d','#e0ac69','#c68642','#8d5524']);
  const hair = pick(rand, ['#2c1b18','#3b2f2f','#000','#d2b48c','#915c3a']);

  // === HEAD (runde Form simuliert) ===
  for(let y=0;y<28;y++){
    for(let x=0;x<24;x++){
      const dx = x-12;
      const dy = y-14;
      if(dx*dx + dy*dy < 140){
        draw(ctx, 20+x, 12+y, skin);
      }
    }
  }

  // === SHADING (links dunkel, rechts hell) ===
  for(let y=12;y<40;y++){
    draw(ctx, 20, y, "#00000033");
    draw(ctx, 43, y, "#ffffff22");
  }

  // === HAIR (organischer) ===
  const hairDensity = rand();

  for(let y=6;y<16;y++){
    for(let x=18;x<46;x++){
      if(rand() > 0.4 + hairDensity){
        draw(ctx, x, y, hair);
      }
    }
  }

  // === EYES (mit Variation) ===
  const eyeOffset = Math.floor(rand()*2);

  draw(ctx, 27, 24, "#000");
  draw(ctx, 35, 24, "#000");

  draw(ctx, 27, 24, "#fff");
  draw(ctx, 35, 24, "#fff");

  // === NOSE (weich) ===
  draw(ctx, 31, 26, "#00000033");
  draw(ctx, 32, 27, "#00000022");

  // === MOUTH (mehr Variation) ===
  const mouth = rand();

  if(mouth < 0.3){
    drawLine(ctx, 28, 32, 8, "#522");
  } else if(mouth < 0.6){
    drawLine(ctx, 28, 32, 8, "#300");
  } else {
    draw(ctx, 30, 32, "#633");
    draw(ctx, 31, 32, "#633");
  }

  // === BEARD (weich, nicht block) ===
  if(rand() > 0.6){
    for(let y=30;y<38;y++){
      for(let x=22;x<42;x++){
        if(rand() > 0.5){
          draw(ctx, x, y, hair);
        }
      }
    }
  }

  // === CAP (besser geformt) ===
  if(rand() > 0.8){
    const c = getCountryColor(country).primary;

    fill(ctx, 20, 6, 24, 6, c);
    fill(ctx, 24, 12, 16, 2, c);
  }

  // === BODY ===
  fill(ctx, 18, 42, 28, 10, getCountryColor(country).primary);
}


// helpers
function draw(ctx,x,y,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,1,1);
}

function fill(ctx,x,y,w,h,c){
  ctx.fillStyle=c;
  ctx.fillRect(x,y,w,h);
}

function drawLine(ctx,x,y,len,c){
  for(let i=0;i<len;i++){
    draw(ctx,x+i,y,c);
  }
}

function pick(rand,a){
  return a[Math.floor(rand()*a.length)];
}

function getCountryColor(code){
  return {
    DE:{primary:"#dd0000"},
    FR:{primary:"#0055A4"},
    BR:{primary:"#009C3B"}
  }[code] || {primary:"#888"};
}
