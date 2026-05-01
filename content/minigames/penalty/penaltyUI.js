export class PenaltyUI {
  constructor(root) {
    this.root = root;
    this.roundEl = root.querySelector('[data-penalty-round]');
    this.scoreEl = root.querySelector('[data-penalty-score]');
    this.feedbackEl = root.querySelector('[data-penalty-feedback]');
  }

  updateScore(score, totalRounds, currentRound) {
    if (this.roundEl) {
      this.roundEl.textContent = `Round ${currentRound}/${totalRounds}`;
    }

    if (this.scoreEl) {
      this.scoreEl.textContent = `${score.goals} : ${score.saves}`;
    }
  }

  setFeedback(message) {
    if (this.feedbackEl) {
      this.feedbackEl.textContent = message;
    }
  }
}
