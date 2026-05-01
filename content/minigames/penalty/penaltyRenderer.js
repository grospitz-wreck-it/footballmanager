export class PenaltyRenderer {
  constructor(root) {
    this.root = root;
    this.pitch = root.querySelector('[data-penalty-pitch]');
    this.ball = root.querySelector('[data-penalty-ball]');
    this.keeper = root.querySelector('[data-penalty-keeper]');
  }

  renderBall(position) {
    if (!this.ball) return;
    this.ball.style.left = `${position.x * 100}%`;
    this.ball.style.top = `${position.y * 100}%`;
  }

  renderKeeper(pose, direction) {
    if (!this.keeper) return;
    this.keeper.style.left = `${pose.x * 100}%`;
    this.keeper.style.top = `${pose.y * 100}%`;
    this.keeper.dataset.direction = direction;
  }

  resetActors() {
    this.renderBall({ x: 0.5, y: 0.96 });
    this.renderKeeper({ x: 0.5, y: 0.9 }, 'center');
  }
}
