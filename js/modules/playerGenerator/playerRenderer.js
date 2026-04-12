export function drawPlayer(ctx, rand, country, mood="neutral"){

  const scale = 4;
  const buffer = document.createElement("canvas");
  buffer.width = 64 * scale;
  buffer.height = 64 * scale;

  const bctx = buffer.getContext("2d");

  // 🎲 Variation
  const faceW = 60 + rand()*20;
  const faceH = 80 + rand()*20;
  const eyeY = 110 + rand()*10;
  const eyeSpacing = 50 + rand()*10;
  const mouthCurve = rand()*20;

  const skin = pick(rand, ["#f6d2be","#eac39b","#c68642"]);
  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  // =========================
  // 👤 FACE (verzerrte ellipse = pseudo spline)
  // =========================
  bctx.fillStyle = skin;
  bctx.beginPath();

  const cx = 128;
  const cy = 140;

  bctx.moveTo(cx, cy - faceH);

  for(let a=0; a<=Math.PI*2; a+=0.3){
    let x = cx + Math.cos(a) * faceW + (rand()-0.5)*6;
    let y = cy + Math.sin(a) * faceH + (rand()-0.5)*6;
    bctx.lineTo(x,y);
  }

  bctx.closePath();
  bctx.fill();

  // =========================
  // 🌗 SHADING (Doom Style!)
  // =========================
  let grad = bctx.createLinearGradient(0, 60, 0, 220);
  grad.addColorStop(0, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(0,0,0,0.4)");

  bctx.fillStyle = grad;
  bctx.fill();

  // =========================
  // 💇 HAIR (rough)
  // =========================
  bctx.fillStyle = hair;
  bctx.beginPath();

  for(let a=0; a<=Math.PI; a+=0.25){
    let x = cx + Math.cos(a)*(faceW+20) + (rand()-0.5)*8;
    let y = 90 + Math.sin(a)*70 + (rand()-0.5)*6;
    if(a===0) bctx.moveTo(x,y);
    else bctx.lineTo(x,y);
  }

  bctx.closePath();
  bctx.fill();

  // =========================
  // 👁 EYES
  // =========================
  drawEye(bctx, cx - eyeSpacing/2, eyeY, mood, rand);
  drawEye(bctx, cx + eyeSpacing/2, eyeY, mood, rand);

  // =========================
  // 👄 MOUTH (rough spline)
  // =========================
  bctx.strokeStyle = "#722";
  bctx.lineWidth = 6;
  bctx.beginPath();

  if(mood === "happy"){
    bctx.moveTo(90, 190);
    bctx.quadraticCurveTo(128, 190 + mouthCurve, 166, 190);
  }
  else if(mood === "angry"){
    bctx.moveTo(90, 195);
    bctx.lineTo(166, 195);
  }
  else{
    bctx.moveTo(100, 190);
    bctx.quadraticCurveTo(128, 185, 156, 190);
  }

  bctx.stroke();

  // =========================
  // 👕 BODY
  // =========================
  bctx.fillStyle = getColor(country);
  bctx.fillRect(80, 220, 96, 40);

  // =========================
  // 🎨 PALETTE REDUKTION
  // =========================
  applyPalette(bctx, buffer.width, buffer.height);

  // =========================
  // ⬇️ PIXELIZE + DOWNSCALE
  // =========================
  pixelize(bctx, buffer.width, buffer.height, 4);

  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, 64, 64);
}
