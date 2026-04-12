export function drawPlayer(ctx, rand, country) {

  ctx.clearRect(0, 0, 64, 64);

  // === Farben ===
  const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const skin = skinTones[Math.floor(rand() * skinTones.length)];

  const teamColors = getCountryColor(country);

  // === Schatten (Button Look) ===
  ctx.fillStyle = "#00000055";
  ctx.beginPath();
  ctx.arc(32, 34, 18, 0, Math.PI * 2);
  ctx.fill();

  // === Hauptkreis (Button) ===
  ctx.fillStyle = teamColors.primary;
  ctx.beginPath();
  ctx.arc(32, 32, 18, 0, Math.PI * 2);
  ctx.fill();

  // === Highlight ===
  ctx.fillStyle = "#ffffff22";
  ctx.beginPath();
  ctx.arc(26, 26, 10, 0, Math.PI * 2);
  ctx.fill();

  // === Kopf (klein, oben) ===
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(32, 24, 8, 0, Math.PI * 2);
  ctx.fill();

  // === Haare (minimal random) ===
  if (rand() > 0.5) {
    ctx.fillStyle = "#222";
    ctx.fillRect(26, 16, 12, 4);
  }
}


// Farben je Land
function getCountryColor(code) {
  const map = {
    DE: { primary: "#dd0000" },
    FR: { primary: "#0055A4" },
    BR: { primary: "#009C3B" },
    ES: { primary: "#aa151b" }
  };

  return map[code] || { primary: "#888" };
}
