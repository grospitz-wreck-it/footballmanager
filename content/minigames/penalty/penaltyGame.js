import { DEFAULT_PENALTY_CONFIG, mergePenaltyConfig } from './penaltyConfig.js';
    const result = resolveShot(shot, keeperPose, keeperDecision);

    if (result.goal) this.state.score.goals += 1;
    if (result.saved) this.state.score.saves += 1;

    this.config.hooks.onRoundResolved?.({
      round: this.state.round,
      result,
      score: this.state.score
    });

    this.ui.setFeedback(result.goal ? 'GOAL!' : 'Saved by keeper');

    this.state.round += 1;

    this.ui.updateScore(
      this.state.score,
      this.config.rounds,
      Math.min(this.state.round, this.config.rounds)
    );

    this.state.currentShot = null;

    if (this.state.round > this.config.rounds) {
      this.end();
      return;
    }

    setTimeout(() => {
      if (!this.state.active) return;

      this.renderer.resetActors();
      this.ui.setFeedback('Tap or swipe to shoot');

      this.config.hooks.onRoundStart?.({
        round: this.state.round,
        score: this.state.score
      });

      this.input.mount((inputData) => this.handleShot(inputData));
    }, 900);
  }

  stopLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}

let penaltyGameInstance = null;

export function startPenaltyGame(config = {}) {
  const root = config.rootElement;

  if (!root) {
    throw new Error('startPenaltyGame requires config.rootElement');
  }

  penaltyGameInstance?.end();
  penaltyGameInstance = new PenaltyGame(root, config);
  penaltyGameInstance.start();

  return penaltyGameInstance;
}

export function resetPenaltyGame() {
  penaltyGameInstance?.reset();
}

export function setPenaltyDifficulty(level) {
  penaltyGameInstance?.setDifficulty(level);
}

export function destroyPenaltyGame() {
  if (!penaltyGameInstance) return;

  penaltyGameInstance.end();
  penaltyGameInstance = null;
}
