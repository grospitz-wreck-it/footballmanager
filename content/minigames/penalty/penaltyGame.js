/* =========================================================
   penaltyGame.js – SINGLE SHOT EVENT VERSION
   FULL DROP-IN REPLACEMENT
   ========================================================= */

import {
  DEFAULT_PENALTY_CONFIG,
  mergePenaltyConfig
} from './penaltyConfig.js';

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
  constructor(
    rootElement,
    config = {}
  ) {
    this.root =
      rootElement;

    this.config =
      mergePenaltyConfig(
        DEFAULT_PENALTY_CONFIG,
        {
          ...config,
          rounds: 1
        }
      );

    this.input =
      new PenaltyInput(
        rootElement,
        this.config
      );

    this.renderer =
      new PenaltyRenderer(
        rootElement
      );

    this.ui =
      new PenaltyUI(
        rootElement
      );

    this.keeper =
      new KeeperAI(
        this.config
      );

    this.rafId =
      null;

    this.resetState();
  }

  /* =========================
     STATE
     ========================= */

  resetState() {
    this.state = {
      active: false,
      resolved: false,
      result: null,
      currentShot: null
    };
  }

  /* =========================
     START
     ========================= */

  start() {
    this.state.active = true;

    this.renderer.resetActors();

    this.ui.updateScore(
      { goals: 0, saves: 0 },
      1,
      1
    );

    this.ui.setFeedback(
      'PENALTY AWARDED'
    );

    this.config.hooks.onRoundStart?.({
      round: 1
    });

    setTimeout(() => {
      if (!this.state.active)
        return;

      this.ui.setFeedback(
        'Tap or swipe to shoot'
      );

      this.input.mount(
        (
          inputData
        ) =>
          this.handleShot(
            inputData
          )
      );
    }, 900);
  }

  /* =========================
     RESET
     ========================= */

  reset() {
    this.stopLoop();
    this.input.unmount();
    this.resetState();
    this.start();
  }

  /* =========================
     END
     ========================= */

  end() {
    this.stopLoop();
    this.input.unmount();

    this.state.active =
      false;

    this.config.hooks.onGameEnd?.(
      this.state.result
    );
  }

  /* =========================
     DIFFICULTY
     ========================= */

  setDifficulty(level) {
    this.config.difficulty =
      level;

    this.keeper.setDifficulty(
      level
    );
  }

  /* =========================
     SHOT INPUT
     ========================= */

  handleShot(
    inputData
  ) {
    if (
      !this.state.active ||
      this.state.currentShot ||
      this.state.resolved
    ) {
      return;
    }

    this.input.unmount();

    const shot =
      calculateShot(
        inputData,
        this.config
      );

    const keeperDecision =
      this.keeper.decide({
        zone:
          shot.zone,
        power:
          shot.power,
        target:
          shot.target
      });

    const startedAt =
      performance.now();

    this.state.currentShot =
      {
        shot,
        keeperDecision,
        startedAt
      };

    this.config.hooks.onShotTaken?.({
      shot,
      keeperDecision
    });

    this.ui.setFeedback(
      'Shot in flight...'
    );

    this.runShotAnimation();
  }

  /* =========================
     ANIMATION LOOP
     ========================= */

  runShotAnimation() {
    const tick = () => {
      if (
        !this.state.currentShot
      ) {
        return;
      }

      const {
        shot,
        keeperDecision,
        startedAt
      } =
        this.state.currentShot;

      const elapsed =
        performance.now() -
        startedAt;

      const progress =
        Math.min(
          1,
          elapsed /
            shot.durationMs
        );

      const ballPos =
        getBallPosition(
          shot,
          progress
        );

      const keeperPose =
        this.keeper.computePose(
          keeperDecision,
          elapsed,
          shot.durationMs,
          shot
        );

      this.renderer.renderBall(
        ballPos
      );

      this.renderer.renderKeeper(
        keeperPose,
        keeperDecision.direction
      );

      if (
        progress >= 1
      ) {
        this.resolveShotEvent(
          shot,
          keeperPose,
          keeperDecision
        );

        return;
      }

      this.rafId =
        requestAnimationFrame(
          tick
        );
    };

    this.stopLoop();

    this.rafId =
      requestAnimationFrame(
        tick
      );
  }

  /* =========================
     FINAL RESULT
     ========================= */

  resolveShotEvent(
    shot,
    keeperPose,
    keeperDecision
  ) {
    const result =
      resolveShot(
        shot,
        keeperPose,
        keeperDecision
      );

    this.state.currentShot =
      null;

    this.state.resolved =
      true;

    this.state.result =
      {
        ...result,

        shot,
        keeperDecision,

        outcome:
          result.goal
            ? 'goal'
            : result.saved
            ? 'saved'
            : 'missed'
      };

    this.config.hooks.onRoundResolved?.({
      round: 1,
      result:
        this.state.result
    });

    /* =====================
       FEEDBACK
       ===================== */

    if (
      result.goal
    ) {
      this.ui.setFeedback(
        'GOAL!'
      );
    } else if (
      result.saved
    ) {
      this.ui.setFeedback(
        'SAVED!'
      );
    } else {
      this.ui.setFeedback(
        'MISSED!'
      );
    }

    /* =====================
       FINAL VISUAL HOLD
       ===================== */

    setTimeout(() => {
      this.end();
    }, 1800);
  }

  /* =========================
     LOOP STOP
     ========================= */

  stopLoop() {
    if (
      this.rafId
    ) {
      cancelAnimationFrame(
        this.rafId
      );
    }

    this.rafId =
      null;
  }
}

/* =========================================================
   GLOBAL INSTANCE CONTROL
   ========================================================= */

let penaltyGameInstance =
  null;

export function startPenaltyGame(
  config = {}
) {
  const root =
    config.rootElement;

  if (!root) {
    throw new Error(
      'startPenaltyGame requires config.rootElement'
    );
  }

  penaltyGameInstance?.end();

  penaltyGameInstance =
    new PenaltyGame(
      root,
      config
    );

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
  if (
    !penaltyGameInstance
  ) {
    return;
  }

  penaltyGameInstance.end();

  penaltyGameInstance =
    null;
}
