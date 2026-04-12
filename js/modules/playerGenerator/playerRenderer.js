export function drawPlayer(ctx, rand, palette) {
  const skinTones = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
  const skin = skinTones[Math.floor(rand() * skinTones.length)];

  // Clear
  ctx.clearRect(0, 0, 64, 64);

  // Shirt (unten)
  ctx.fillStyle = palette.primary;
  ctx.fillRect(8, 32, 48, 24);

  // Kopf
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(32, 24, 14, 0, Math.PI * 2);
  ctx.fill();

  // Haare (random)
  if (rand() > 0.5) {
    ctx.fillStyle = '#222';
    ctx.fillRect(18, 8, 28, 10);
  }

  // Augen (minimal)
  ctx.fillStyle = '#000';
  ctx.fillRect(26, 22, 2, 2);
  ctx.fillRect(36, 22, 2, 2);
}
