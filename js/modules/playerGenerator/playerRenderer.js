
export function drawPlayer(ctx, rand, country, mood="neutral"){

  // 🔥 HIGH RES BUFFER
  const scale = 4;
  const buffer = document.createElement("canvas");
  buffer.width = 64 * scale;
  buffer.height = 64 * scale;

  const bctx = buffer.getContext("2d");

  // 🎲 Variation (dein System bleibt!)
  const faceW = 60 + rand()*20;
  const faceH = 80 + rand()*20;
  const eyeY = 110 + rand()*10;
  const eyeSpacing = 50 + rand()*10;
  const mouthCurve = rand()*20;

  const skin = pick(rand, ["#f6d2be","#eac39b","#c68642"]);
  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  // =========================
  // 👤 FACE (Spline)
  // =========================
  bctx.fillStyle = skin;
  bctx.beginPath();
  bctx.ellipse(128, 140, faceW, faceH, 0, 0, Math.PI*2);
  bctx.fill();

  // =========================
  // 💇 HAIR
  // =========================
  bctx.fillStyle = hair;
  bctx.beginPath();
  bctx.ellipse(128, 90, faceW + 20, 70, 0, 0, Math.PI);
  bctx.fill();

  // =========================
  // 👁 EYES (REAL SHAPES)
  // =========================
  drawEye(bctx, 128 - eyeSpacing/2, eyeY, mood);
  drawEye(bctx, 128 + eyeSpacing/2, eyeY, mood);

  // =========================
  // 👄 MOUTH (curve)
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
  // ⬇️ DOWNSCALE
  // =========================
  ctx.clearRect(0,0,64,64);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, 64, 64);
}


// =========================
// 👁 EYE
// =========================
function drawEye(ctx, x, y, mood){

  // white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 10, 0, 0, Math.PI*2);
  ctx.fill();

  // pupil
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI*2);
  ctx.fill();

  // eyelid
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x-16, y-6);
  ctx.lineTo(x+16, y-6);
  ctx.stroke();

  if(mood === "tired"){
    ctx.strokeStyle = "#555";
    ctx.beginPath();
    ctx.moveTo(x-16, y+6);
    ctx.lineTo(x+16, y+6);
    ctx.stroke();
  }
}


// =========================
// 🧩 HELPERS
// =========================
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

