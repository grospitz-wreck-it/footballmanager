export class PenaltyUI {
  constructor(root) {
    this.root = root;
    this.scoreEl = root.querySelector('[data-penalty-score]');
    this.roundEl = root.querySelector('[data-penalty-round]');
    this.feedbackEl = root.querySelector('[data-penalty-feedback]');
  }

  updateScore(score, rounds, currentRound) {
    if (this.scoreEl) this.scoreEl.textContent = `${score.goals} : ${score.saves}`;
    if (this.roundEl) this.roundEl.textContent = `Round ${currentRound}/${rounds}`;
  }

  setFeedback(text) {
    if (this.feedbackEl) this.feedbackEl.textContent = text;
  }
}
