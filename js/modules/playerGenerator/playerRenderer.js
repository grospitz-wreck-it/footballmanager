export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0, 0, 64, 64);

  // === PALETTES ===
  const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const hairColors = ['#2c1b18', '#3b2f2f', '#000000', '#d2b48c'];
  const eyeColors = ['#000', '#222', '#444'];

  const skin = pick(rand, skinTones);
  const hair = pick(rand, hairColors);
  const eyes = pick(rand, eyeColors);

  // === HEAD SHAPE ===
  fillRect(ctx, 20, 12, 24, 28, skin);

  // === SHADING (links/rechts) ===
  fillRect(ctx, 20, 12, 3, 28, darken(skin));
  fillRect(ctx, 41, 12, 3, 28, darken(skin));

  // === HAIR ===
  const hairType = Math.floor(rand() * 3);

  if(hairType === 0){
    fillRect(ctx, 20, 8, 24, 6, hair); // kurz
  }
  if(hairType === 1){
    fillRect(ctx, 18, 6, 28, 10, hair); // voll
  }
  if(hairType === 2){
    fillRect(ctx, 22, 10, 20, 4, hair); // dünn
  }

  // === AUGEN ===
  fillRect(ctx, 26, 24, 4, 2, eyes);
  fillRect(ctx, 34, 24, 4, 2, eyes);

  // === PUPILLEN ===
  fillRect(ctx, 27, 24, 1, 1, "#fff");
  fillRect(ctx, 35, 24, 1, 1, "#fff");

  // === NASE ===
  fillRect(ctx, 31, 26, 2, 4, darken(skin));

  // === MUND ===
  const mouthType = Math.floor(rand() * 3);

  if(mouthType === 0){
    fillRect(ctx, 28, 32, 8, 2, "#522");
  }
  if(mouthType === 1){
    fillRect(ctx, 28, 32, 8, 1, "#300");
  }
  if(mouthType === 2){
    fillRect(ctx, 30, 32, 4, 2, "#633");
  }

  // === TRIKOT (unten) ===
  const shirt = getCountryColor(country);

  fillRect(ctx, 18, 40, 28, 12, shirt.primary);

  // === HALS ===
  fillRect(ctx, 28, 38, 8, 4, skin);
}


// =========================
// HELPERS
// =========================

function fillRect(ctx, x, y, w, h, color){
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function pick(rand, arr){
  return arr[Math.floor(rand() * arr.length)];
}

function darken(hex){
  return "#00000055"; // simple shadow look (arcade)
}

function getCountryColor(code){
  const map = {
    DE: { primary: "#dd0000" },
    FR: { primary: "#0055A4" },
    BR: { primary: "#009C3B" },
    ES: { primary: "#aa151b" }
  };

  return map[code] || { primary: "#888" };
}
