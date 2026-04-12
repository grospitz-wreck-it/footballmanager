
// ======================================
// ⚽ HIGH QUALITY PIXEL MANAGER RENDERER
// ======================================

export function drawPlayer(ctx, rand, country, mood="neutral"){

  const size = 64;

  ctx.clearRect(0,0,size,size);
  ctx.imageSmoothingEnabled = false;

  const cx = 32;

  // =========================
  // 🎲 DNA
  // =========================
  const skin = pick(rand, ["#f1c27d","#e0ac69","#c68642","#8d5524"]);
  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a","#c0c0c0"]);
  const shirt = getColor(country);

  const headType = pick(rand, ["round","oval","wide"]);
  const hairStyle = pick(rand, ["short","long","bald"]);
  const eyes = pick(rand, ["small","normal"]);
  const beard = pick(rand, ["none","short"]);

  // =========================
  // 👤 HEAD
  // =========================
  ctx.fillStyle = skin;

  if(headType === "round"){
    ctx.beginPath();
    ctx.arc(cx, 28, 18, 0, Math.PI*2);
    ctx.fill();
  }

  if(headType === "oval"){
    ctx.beginPath();
    ctx.ellipse(cx, 28, 16, 20, 0, 0, Math.PI*2);
    ctx.fill();
  }

  if(headType === "wide"){
    ctx.beginPath();
    ctx.ellipse(cx, 28, 20, 18, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // =========================
  // 🌗 SHADING (2-tone!)
  // =========================
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(cx-20, 28, 40, 20);

  // =========================
  // 💇 HAIR
  // =========================
  ctx.fillStyle = hair;

  if(hairStyle === "short"){
    ctx.fillRect(cx-18, 10, 36, 12);
  }

  if(hairStyle === "long"){
    ctx.fillRect(cx-20, 10, 40, 20);
  }

  // =========================
  // 👁 EYES
  // =========================
  ctx.fillStyle = "#000";

  const eyeY = 26;
  const eyeOffset = 8;

  if(eyes === "small"){
    ctx.fillRect(cx-eyeOffset, eyeY, 2, 2);
    ctx.fillRect(cx+eyeOffset, eyeY, 2, 2);
  } else {
    ctx.fillRect(cx-eyeOffset, eyeY, 3, 3);
    ctx.fillRect(cx+eyeOffset, eyeY, 3, 3);
  }

  // =========================
  // 👄 MOUTH
  // =========================
  ctx.fillStyle = "#300";

  if(mood === "happy"){
    ctx.fillRect(cx-6, 38, 12, 2);
  } else {
    ctx.fillRect(cx-4, 38, 8, 2);
  }

  // =========================
  // 🧔 BEARD
  // =========================
  if(beard === "short"){
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(cx-10, 36, 20, 8);
  }

  // =========================
  // 👕 BODY
  // =========================
  ctx.fillStyle = shirt;
  ctx.fillRect(cx-20, 46, 40, 18);
}


// ======================================
// 🧩 HELPERS
// ======================================

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

