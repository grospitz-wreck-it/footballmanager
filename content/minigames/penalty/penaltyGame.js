import { DEFAULT_PENALTY_CONFIG, mergePenaltyConfig } from './penaltyConfig.js';
import { PenaltyInput } from './penaltyInput.js';
import { PenaltyRenderer } from './penaltyRenderer.js';
import { PenaltyUI } from './penaltyUI.js';
import { KeeperAI } from './keeperAI.js';
import {
  calculateShot,
  getBallPosition,
  resolveShot
} from './penaltyPhysics.js';

export class PenaltyGame {
  constructor(rootElement, config = {}) {
    this.root = rootElement;

    this.config = mergePenaltyConfig(
      DEFAULT_PENALTY_CONFIG,
      config
    );

    this.input = new PenaltyInput(
      rootElement,
      this.config
    );

    this.renderer = new PenaltyRenderer(rootElement);
    this.ui = new PenaltyUI(rootElement);
    this.keeper = new KeeperAI(this.config);

    this.rafId = null;

    this.resetState();
  }

  resetState() {
    this.state = {
      active: false,
      round: 1,
      score: {
        goals: 0,
        saves: 0
      },
      currentShot: null
    };
  }

  start() {
    this.state.active = true;

    this.renderer.resetActors();

    this.ui.updateScore(
      this.state.score,
      this.config.rounds,
      this.state.round
    );

    this.ui.setFeedback('Tap or swipe to shoot');

    this.config.hooks.onRoundStart?.({
      round: this.state.round,
      score: this.state.score
    });

    this.input.mount(
      (inputData) => this.handleShot(inputData)
    );
  }

  reset() {
    this.stopLoop();
    this.input.unmount();
    this.resetState();
    this.start();
  }

  end() {
    this.stopLoop();
    this.input.unmount();

    this.state.active = false;

    this.ui.setFeedback('Game over');

    this.config.hooks.onGameEnd?.(
      this.state.score
    );
  }

  setDifficulty(level) {
    this.config.difficulty = level;
    this.keeper.setDifficulty(level);
  }

  handleShot(inputData) {
    if (
      !this.state.active ||
      this.state.currentShot
    ) {
      return;
    }

    // Nur ein Schuss pro Runde
    this.input.unmount();

    const shot = calculateShot(
      inputData,
      this.config
    );

    const keeperDecision = this.keeper.decide({
      zone: shot.zone,
      power: shot.power
    });

    const startedAt = performance.now();

    this.state.currentShot = {
      shot,
      keeperDecision,
      startedAt
    };

    this.config.hooks.onShotTaken?.({
      shot,
      keeperDecision
    });

    this.ui.setFeedback('Shot in flight...');

    this.runShotAnimation();
  }

  runShotAnimation() {
    const tick = () => {
      if (!this.state.currentShot) return;

      const {
        shot,
        keeperDecision,
        startedAt
      } = this.state.currentShot;

      const elapsed =
        performance.now() - startedAt;

      const progress = Math.min(
        1,
        elapsed / shot.durationMs
      );

      const ballPos = getBallPosition(
        shot,
        progress
      );

      const keeperPose =
        this.keeper.computePose(
          keeperDecision,
          elapsed,
          shot.durationMs
        );

      this.renderer.renderBall(ballPos);

      this.renderer.renderKeeper(
        keeperPose,
        keeperDecision.direction
      );

      if (progress >= 1) {
        this.resolveRound(
          shot,
          keeperPose,
          keeperDecision
        );
        return;
      }

      this.rafId =
        requestAnimationFrame(tick);
    };

    this.stopLoop();

    this.rafId =
      requestAnimationFrame(tick);
  }

  resolveRound(
    shot,
    keeperPose,
    keeperDecision
  ) {
    const result = resolveShot(
      shot,
      keeperPose,
      keeperDecision
    );

    if (result.goal) {
      this.state.score.goals += 1;
    }

    if (result.saved) {
      this.state.score.saves += 1;
    }

    this.config.hooks.onRoundResolved?.({
      round: this.state.round,
      result,
      score: this.state.score
    });

    this.ui.setFeedback(
      result.goal
        ? 'GOAL!'
        : 'Saved by keeper'
    );

    this.state.round += 1;

    this.ui.updateScore(
      this.state.score,
      this.config.rounds,
      Math.min(
        this.state.round,
        this.config.rounds
      )
    );

    this.state.currentShot = null;

    // Spielende
    if (
      this.state.round >
      this.config.rounds
    ) {
      this.end();
      return;
    }

    // Nächste Runde
    setTimeout(() => {
      if (!this.state.active) return;

      this.renderer.resetActors();

      this.ui.setFeedback(
        'Tap or swipe to shoot'
      );

      this.config.hooks.onRoundStart?.({
        round: this.state.round,
        score: this.state.score
      });

      this.input.mount(
        (inputData) =>
          this.handleShot(inputData)
      );
    }, 900);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(
        this.rafId
      );
    }

    this.rafId = null;
  }
}

let penaltyGameInstance = null;

export function startPenaltyGame(
  config = {}
) {
  const root = config.rootElement;

  if (!root) {
    throw new Error(
      'startPenaltyGame requires config.rootElement'
    );
  }

  penaltyGameInstance?.end();

  penaltyGameInstance =
    new PenaltyGame(root, config);

  penaltyGameInstance.start();

  return penaltyGameInstance;
}

export function resetPenaltyGame() {
  penaltyGameInstance?.reset();
}

export function setPenaltyDifficulty(
  level
) {
  penaltyGameInstance?.setDifficulty(
    level
  );
}

export function destroyPenaltyGame() {
  if (!penaltyGameInstance) return;

  penaltyGameInstance.end();
  penaltyGameInstance = null;
}
