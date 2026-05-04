export class PenaltyUI {
  constructor(root) {
    this.root = root;
    this.roundEl = root.querySelector("[data-penalty-round]");
    this.scoreEl = root.querySelector("[data-penalty-score]");
    this.feedbackEl = root.querySelector("[data-penalty-feedback]");
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
  showResultGraphic(type) {
    let overlay = this.root.querySelector(".penalty-result-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "penalty-result-overlay";
      this.root.appendChild(overlay);
    }

    const assetMap = {
      goal: "./content/minigames/penalty/tooor.webp",
      saved: "./content/minigames/penalty/gehalten.webp",
      miss: "./content/minigames/penalty/verschossen.webp",
    };

    const src = assetMap[type];
    if (!src) return;

    overlay.innerHTML = `<img src="${src}" alt="${type}" />`;
    overlay.classList.add("show");

    setTimeout(() => {
      overlay.classList.remove("show");
    }, 1600);
  }
}
