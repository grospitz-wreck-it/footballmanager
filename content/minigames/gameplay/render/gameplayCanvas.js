export class GameplayCanvas {
  constructor(canvas, config, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.camera = camera;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const w = this.canvas.clientWidth || 360;
    this.canvas.width = w * Math.min(2, window.devicePixelRatio || 1);
    this.canvas.height = (w / (16 / 9)) * Math.min(2, window.devicePixelRatio || 1);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(Math.min(2, window.devicePixelRatio || 1), Math.min(2, window.devicePixelRatio || 1));
  }
  render(state) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.fillStyle = this.config.theme.bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = this.config.theme.pitch; ctx.fillRect(8, 8, w - 16, h - 16);
    ctx.strokeStyle = this.config.theme.line; ctx.lineWidth = 2; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.beginPath(); ctx.moveTo(w / 2, 8); ctx.lineTo(w / 2, h - 8); ctx.stroke();
    const drawDot = (x, y, color, r = 6) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(8 + x*(w-16), 8 + y*(h-16), r, 0, Math.PI*2); ctx.fill(); };
    state.home.forEach(p => drawDot(p.x, p.y, state.colors.home.color));
    state.away.forEach(p => drawDot(p.x, p.y, state.colors.away.color));
    drawDot(state.ball.x, state.ball.y, this.config.theme.ball, 4);
  }
}
