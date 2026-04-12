
export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;

  const skins = [
    ["#f6e2d3","#e8c4a8","#d2a679","#b07d56","#7a5235"],
    ["#eac39b","#d9a676","#c48754","#9e623c","#6e4328"],
    ["#c68642","#a47138","#8d5a2b","#6e431f","#4a2d15"]
  ];

  const skin = pick(rand, skins);
  const hair = pick(rand, ["#1c1c1c","#3a2b22","#d6a77a"]);

  drawFace(ctx, skin, rand);
  drawHair(ctx, hair);
  drawBody(ctx, country);
}


// =========================
// 👤 FACE (ADVANCED)
// =========================
function drawFace(ctx, s, rand){

  const [hl, l, m, d, sd] = s;

  const cx = 32;
  const cy = 30;

  const jaw = 0.9 + rand()*0.3; // variation!

  for(let y=12;y<52;y++){
    for(let x=16;x<48;x++){

      let dx = (x-cx)/16;
      let dy = (y-cy)/20;

      if(dx*dx + (dy*dy)*jaw > 1) continue;

      let col = m;

      let light = (-dx*0.7) + (-dy*0.9);

      if(light > 0.5) col = hl;
      else if(light > 0.2) col = l;
      else if(light < -0.5) col = sd;
      else if(light < -0.2) col = d;

      // cheekbone highlight
      if(dy > -0.1 && dy < 0.3 && Math.abs(dx) > 0.4){
        col = l;
      }

      px(ctx,x,y,col);
    }
  }

  // =========================
  // 👁 SOCKETS
  // =========================
  fill(ctx,23,29,7,3,d);
  fill(ctx,35,29,7,3,d);

  // =========================
  // 👁 EYES (better spacing)
  // =========================
  drawEye(ctx,26,30,rand);
  drawEye(ctx,38,30,rand);

  // eyelids
  line(ctx,23,28,7,"#000");
  line(ctx,35,28,7,"#000");

  // brows (angled)
  line(ctx,23,26,7,"#111");
  line(ctx,35,26,7,"#111");

  // =========================
  // 👃 NOSE (proper volume)
  // =========================
  for(let y=30;y<38;y++){
    px(ctx,32,y,d);
  }

  px(ctx,31,33,l);
  px(ctx,31,34,hl);

  px(ctx,33,34,sd);

  // nostrils
  px(ctx,31,38,sd);
  px(ctx,33,38,sd);

  // =========================
  // 👄 MOUTH (shape + volume)
  // =========================
  px(ctx,29,42,d);
  px(ctx,30,43,d);
  px(ctx,31,43,sd);
  px(ctx,32,43,d);
  px(ctx,33,42,d);

  px(ctx,31,44,l);
}


// =========================
// 👁 EYE PRO
// =========================
function drawEye(ctx,x,y,rand){

  const iris = pick(rand, ["#3b82f6","#22c55e","#6b7280","#92400e"]);

  px(ctx,x-1,y,"#fff");
  px(ctx,x,y,"#fff");
  px(ctx,x+1,y,"#fff");

  px(ctx,x,y,iris);
  px(ctx,x,y,"#000");

  px(ctx,x+1,y,"#fff"); // highlight
}


// =========================
// 💇 HAIR (layered)
// =========================
function drawHair(ctx, hair){

  for(let y=10;y<24;y++){
    for(let x=16;x<48;x++){

      let dx = (x-32)/18;
      let dy = (y-20)/10;

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
  fill(ctx,20,48,24,12,getColor(country));
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

