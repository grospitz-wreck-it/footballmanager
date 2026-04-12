export function drawPlayer(ctx, rand, country){

  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;

  // =========================
  // 🎨 PALETTES
  // =========================
  const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const hairColors = ['#2c1b18', '#3b2f2f', '#000000', '#d2b48c', '#915c3a'];
  const eyeColors = ['#000', '#222', '#444'];

  const skin = pick(rand, skinTones);
  const hair = pick(rand, hairColors);
  const eyes = pick(rand, eyeColors);

  const shadow = darken(skin);
  const highlight = lighten(skin);

  // =========================
  // 👤 HEAD BASE
  // =========================
  fill(ctx, 20, 12, 24, 28, skin);

  // Shading links/rechts
  fill(ctx, 20, 12, 3, 28, shadow);
  fill(ctx, 41, 12, 3, 28, shadow);

  // Highlight oben
  fill(ctx, 22, 12, 20, 2, highlight);

  // =========================
  // 💇 HAIR
  // =========================
  const hairType = Math.floor(rand() * 5);

  if(hairType === 0){ // kurz
    fill(ctx, 20, 8, 24, 6, hair);
  }

  if(hairType === 1){ // voll
    fill(ctx, 18, 6, 28, 10, hair);
  }

  if(hairType === 2){ // side fade
    fill(ctx, 20, 8, 24, 4, hair);
    fill(ctx, 20, 12, 4, 10, hair);
  }

  if(hairType === 3){ // mohawk
    fill(ctx, 30, 6, 4, 10, hair);
  }

  if(hairType === 4){ // glatze
    // nichts
  }

  // =========================
  // 🎩 CAP (selten)
  // =========================
  if(rand() > 0.8){
    const capColor = getCountryColor(country).primary;

    fill(ctx, 18, 6, 28, 6, capColor); // cap top
    fill(ctx, 24, 12, 16, 3, capColor); // visor
  }

  // =========================
  // 👀 EYES
  // =========================
  fill(ctx, 26, 24, 4, 2, eyes);
  fill(ctx, 34, 24, 4, 2, eyes);

  // Pupillen
  fill(ctx, 27, 24, 1, 1, "#fff");
  fill(ctx, 35, 24, 1, 1, "#fff");

  // =========================
  // 👃 NOSE
  // =========================
  fill(ctx, 31, 26, 2, 4, shadow);

  // =========================
  // 👄 MOUTH
  // =========================
  const mouth = Math.floor(rand() * 3);

  if(mouth === 0) fill(ctx, 28, 32, 8, 2, "#522");
  if(mouth === 1) fill(ctx, 28, 32, 8, 1, "#300");
  if(mouth === 2) fill(ctx, 30, 32, 4, 2, "#633");

  // =========================
  // 🧔 BEARD
  // =========================
  if(rand() > 0.6){
    const beardType = Math.floor(rand() * 3);

    if(beardType === 0){ // full beard
      fill(ctx, 22, 30, 20, 8, hair);
    }

    if(beardType === 1){ // goatee
      fill(ctx, 28, 32, 8, 6, hair);
    }

    if(beardType === 2){ // mustache
      fill(ctx, 26, 30, 12, 2, hair);
    }
  }

  // =========================
  // 🧥 BODY
  // =========================
  const shirt = getCountryColor(country);

  fill(ctx, 18, 42, 28, 10, shirt.primary);

  // Hals
  fill(ctx, 28, 38, 8, 4, skin);
}


// =========================
// HELPERS
// =========================
function fill(ctx, x, y, w, h, color){
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function pick(rand, arr){
  return arr[Math.floor(rand() * arr.length)];
}

function darken(hex){
  return "#00000055";
}

function lighten(hex){
  return "#ffffff22";
}

function getCountryColor(code){
  const map = {
    DE: { primary: "#dd0000" },
    FR: { primary: "#0055A4" },
    BR: { primary: "#009C3B" },
    ES: { primary: "#aa151b" },
    IT: { primary: "#008C45" }
  };

  return map[code] || { primary: "#888" };
}
