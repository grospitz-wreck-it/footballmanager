
// ======================================
// 🎮 PLAYER RENDERER (DOOM STYLE)
// Datei: playerRenderer.js
// ======================================

export function drawPlayer(ctx, rand, country, mood = "neutral") {

  const scale = 4;
  const buffer = document.createElement("canvas");
  buffer.width = 64 * scale;
  buffer.height = 64 * scale;

  const bctx = buffer.getContext("2d");

  // =========================
  // 🎲 VARIATION
  // =========================
  const faceW = 60 + rand() * 20;
  const faceH = 80 + rand() * 20;
  const eyeY = 110 + rand() * 10;
  const eyeSpacing = 50 + rand() * 10;
  const mouthCurve = rand() * 20;

  const skin = pick(rand, ["#f6d2be","#eac39b","#c68642"]);
  const hair = pick(rand, ["#2b2b2b","#5a3a2e","#d6a77a"]);

  const cx = 128;
  const cy = 140;

  // =========================
  // 👤 FACE (rough spline look)
  // =========================
  bctx.fillStyle = skin;
  bctx.beginPath();

  for (let a = 0; a <= Math.PI * 2; a += 0.3) {
    let x = cx + Math.cos(a) * faceW + (rand() - 0.5) * 6;
    let y = cy + Math.sin(a) * faceH + (rand() - 0.5) * 6;

    if (a === 0) bctx.moveTo(x, y);
    else bctx.lineTo(x, y);
  }

  bctx.closePath();
  bctx.fill();

  // =========================
  // 🌗 SHADING (vertical doom)
  // =========================
  const grad = bctx.createLinearGradient(0, 60, 0, 220);
  grad.addColorStop(0, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(0,0,0,0.4)");

  bctx.fillStyle = grad;
  bctx.fill();

  // =========================
  // 💇 HAIR
  // =========================
  bctx.fillStyle = hair;
  bctx.beginPath();

  for (let a = 0; a <= Math.PI; a += 0.25) {
    let x = cx + Math.cos(a) * (faceW + 20) + (rand() - 0.5) * 8;
    let y = 90 + Math.sin(a) * 70 + (rand() - 0.5) * 6;

    if (a === 0) bctx.moveTo(x, y);
    else bctx.lineTo(x, y);
  }

  bctx.closePath();
  bctx.fill();

  // =========================
  // 👁 EYES
  // =========================
  drawEye(bctx, cx - eyeSpacing / 2, eyeY, mood, rand);
  drawEye(bctx, cx + eyeSpacing / 2, eyeY, mood, rand);

  // =========================
  // 👄 MOUTH
  // =========================
  bctx.strokeStyle = "#722";
  bctx.lineWidth = 6;
  bctx.beginPath();

  if (mood === "happy") {
    bctx.moveTo(90, 190);
    bctx.quadraticCurveTo(128, 190 + mouthCurve, 166, 190);
  } else if (mood === "angry") {
    bctx.moveTo(90, 195);
    bctx.lineTo(166, 195);
  } else {
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
  // 🎨 PALETTE REDUCTION
  // =========================
  applyPalette(bctx, buffer.width, buffer.height);

  // =========================
  // 🧱 PIXELIZE
  // =========================
  pixelize(bctx, buffer.width, buffer.height, 4);

  // =========================
  // ⬇️ FINAL DRAW
  // =========================
  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, 64, 64);
}


// ======================================
// 👁 EYE
// ======================================
function drawEye(ctx, x, y, mood, rand) {

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(
    x + (rand() - 0.5) * 2,
    y + (rand() - 0.5) * 2,
    16, 10, 0, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 6);
  ctx.lineTo(x + 16, y - 6);
  ctx.stroke();

  if (mood === "tired") {
    ctx.strokeStyle = "#555";
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 6);
    ctx.lineTo(x + 16, y + 6);
    ctx.stroke();
  }
}


// ======================================
// 🎨 PALETTE
// ======================================
const palette = [
  [0, 0, 0],
  [80, 60, 40],
  [120, 90, 60],
  [160, 120, 80],
  [200, 160, 120],
  [240, 200, 160]
];

function applyPalette(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {

    let best = palette[0];
    let dist = Infinity;

    for (let p of palette) {
      let dd =
        (d[i] - p[0]) ** 2 +
        (d[i + 1] - p[1]) ** 2 +
        (d[i + 2] - p[2]) ** 2;

      if (dd < dist) {
        dist = dd;
        best = p;
      }
    }

    d[i] = best[0];
    d[i + 1] = best[1];
    d[i + 2] = best[2];
  }

  ctx.putImageData(img, 0, 0);
}


// ======================================
// 🧱 PIXELIZE
// ======================================
function pixelize(ctx, w, h, size) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {

      let i = (y * w + x) * 4;

      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          let ii = ((y + dy) * w + (x + dx)) * 4;
          d[ii] = d[i];
          d[ii + 1] = d[i + 1];
          d[ii + 2] = d[i + 2];
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0);
}


// ======================================
// 🧩 HELPERS
// ======================================
function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function getColor(code) {
  return {
    DE: "#dd0000",
    FR: "#0055A4",
    BR: "#009C3B"
  }[code] || "#888";
}

