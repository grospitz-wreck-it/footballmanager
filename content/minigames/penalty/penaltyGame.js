/* =========================================================
   penaltyGame.js – SINGLE SHOT EVENT VERSION
   FULL DROP-IN REPLACEMENT
   ========================================================= */

import { DEFAULT_PENALTY_CONFIG, mergePenaltyConfig } from "./penaltyConfig.js";

import { PenaltyInput } from "./penaltyInput.js";
import { PenaltyRenderer } from "./penaltyRenderer.js";
import { PenaltyUI } from "./penaltyUI.js";
import { KeeperAI } from "./keeperAI.js";

import {
  calculateShot,
  getBallPosition,
  getBallFollowThrough,
  resolveShot,
} from "./penaltyPhysics.js";

export class PenaltyGame {
  constructor(rootElement, config = {}) {
    this.root = rootElement;

    this.config = mergePenaltyConfig(DEFAULT_PENALTY_CONFIG, {
      ...config,
      rounds: 1,
    });

    this.input = new PenaltyInput(rootElement, this.config);

    this.renderer = new PenaltyRenderer(rootElement);

    this.ui = new PenaltyUI(rootElement);

    this.keeper = new KeeperAI(this.config);

    this.rafId = null;

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
      currentShot: null,
    };
  }

  /* =========================
     START
     ========================= */

  start() {
    /* =========================
     ACTIVATE GAME
     ========================= */

    this.state.active = true;

    this.state.resolved = false;

    this.state.result = null;

    this.state.currentShot = null;

    /* =========================
     RESET VISUALS
     ========================= */

    this.renderer.resetActors();

    /* =========================
     RESET UI
     ========================= */

    this.ui.updateScore(
      {
        goals: 0,
        saves: 0,
      },
      1,
      1,
    );

    /* =========================
     INTRO
     ========================= */

    this.ui.setFeedback("PENALTY AWARDED");

    /* =========================
     ROUND START HOOK
     ========================= */

    this.config.hooks.onRoundStart?.({
      round: 1,
    });

    /* =========================
     INPUT DELAY
     ========================= */

    setTimeout(() => {
      if (!this.state.active) {
        return;
      }

      this.ui.setFeedback("Tap or swipe to shoot");

      this.input.mount((inputData) => this.handleShot(inputData));
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

    this.state.active = false;

    this.config.hooks.onGameEnd?.(this.state.result);
  }

  /* =========================
     DIFFICULTY
     ========================= */

  setDifficulty(level) {
    this.config.difficulty = level;

    this.keeper.setDifficulty(level);
  }

  /* =========================
     SHOT INPUT
     ========================= */

  handleShot(inputData) {
    if (!this.state.active || this.state.currentShot || this.state.resolved) {
      return;
    }

    this.input.unmount();

    const shot = calculateShot(inputData, this.config);

    const keeperDecision = this.keeper.decide({
      zone: shot.zone,
      power: shot.power,
      target: shot.target,
    });

    const startedAt = performance.now();

    this.state.currentShot = {
      shot,
      keeperDecision,
      startedAt,
    };

    this.config.hooks.onShotTaken?.({
      shot,
      keeperDecision,
    });

    this.ui.setFeedback("Shot in flight...");

    this.runShotAnimation();
  }

  runShotAnimation() {
    const tick = () => {
      if (!this.state.currentShot) {
        return;
      }

      const { shot, keeperDecision, startedAt } = this.state.currentShot;

      /* =========================
         TIMING
         ========================= */

      const elapsed = performance.now() - startedAt;

      const progress = Math.min(1, elapsed / shot.durationMs);

      /* =========================
         BALL FLIGHT
         ========================= */

      const ballPos = getBallPosition(shot, progress);

      /* =========================
         KEEPER MOVEMENT
         ========================= */

      const keeperPose = this.keeper.computePose(
        keeperDecision,
        elapsed,
        shot.durationMs,
        shot,
      );

      /* =========================
         RENDER LIVE PHASE
         ========================= */

      this.renderer.renderBall(ballPos);

      this.renderer.renderKeeper(
        keeperPose,
        keeperDecision.direction,
        false,
        false,
        "normal",
      );

      /* =========================
         SHOT IMPACT
         ========================= */

      if (progress >= 1) {
        const result = resolveShot(shot, keeperPose, keeperDecision);

        this.runFollowThrough(shot, keeperPose, keeperDecision, result);

        return;
      }

      /* =========================
         LOOP CONTINUE
         ========================= */

      this.rafId = requestAnimationFrame(tick);
    };

    /* =========================
       RESET LOOP
       ========================= */

    this.stopLoop();

    this.rafId = requestAnimationFrame(tick);
  }

  /* =========================================================
   DIREKT DARUNTER EINFÜGEN:
   ========================================================= */

  runFollowThrough(shot, keeperPose, keeperDecision, result) {
    const followStart = performance.now();

    const duration = result.goal ? 550 : result.saved ? 380 : 500;

    const tick = () => {
      const elapsed = performance.now() - followStart;

      const progress = Math.min(1, elapsed / duration);

      const ballPos = getBallFollowThrough(shot, result, progress);

      /* =========================
         KEEPER HOLDS BALL
         ========================= */

      const keeperHasBall =
        result.saved &&
        (result.saveQuality === "perfect" || result.saveQuality === "strong");

      if (this.renderer.ball) {
        this.renderer.ball.style.opacity = keeperHasBall ? "0" : "1";
      }

      if (!keeperHasBall) {
        this.renderer.renderBall(ballPos);
      }

      /* =========================
         KEEPER FOLLOW THROUGH
         ========================= */

      this.renderer.renderKeeper(
        keeperPose,
        keeperDecision.direction,
        result.saved,
        false,
        result.saveQuality,
      );

      /* =========================
         END FOLLOW THROUGH
         ========================= */

      if (progress >= 1) {
        this.resolveShotEvent(shot, keeperPose, keeperDecision);

        return;
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.stopLoop();

    this.rafId = requestAnimationFrame(tick);
  }

  resolveShotEvent(shot, keeperPose, keeperDecision) {
    const result = resolveShot(shot, keeperPose, keeperDecision);

    /* =========================
     IMMEDIATE BALL RESET
     ========================= */

    if (this.renderer.ball) {
      this.renderer.ball.style.opacity = "1";
    }

    this.state.currentShot = null;

    this.state.resolved = true;

    this.state.result = {
      ...result,
      shot,
      keeperDecision,

      outcome: result.goal ? "goal" : result.saved ? "saved" : "missed",
    };

    this.config.hooks.onRoundResolved?.({
      round: 1,
      result: this.state.result,
    });

    /* =========================
     GOAL FX
     ========================= */

    if (result.goal) {
      if (this.renderer.pitch) {
        this.renderer.pitch.classList.add("penalty-goal-hit");

        setTimeout(() => {
          this.renderer.pitch.classList.remove("penalty-goal-hit");
        }, 500);
      }

      this.root.classList.add("goal-shake");

      setTimeout(() => {
        this.root.classList.remove("goal-shake");
      }, 420);

      /* =========================
       BALL INTO NET
       ========================= */

      this.renderer.renderBall({
        x: shot.target.x,
        y: shot.target.y + 0.05,
      });

      this.ui.setFeedback("GOAL!");
      this.ui.showResultGraphic("goal");
    } else if (result.saved) {
      /* =========================
       SAVE FX
       ========================= */

      this.root.classList.add("save-shake");

      setTimeout(() => {
        this.root.classList.remove("save-shake");
      }, 280);

      this.ui.setFeedback("SAVED!");
      this.ui.showResultGraphic("saved");
    } else {
      /* =========================
       MISS FX
       ========================= */

      this.ui.setFeedback("MISSED!");
      this.ui.showResultGraphic("miss");
    }

    /* =========================
     FINAL BALL RESET
     ========================= */

    if (this.renderer.ball) {
      this.renderer.ball.style.opacity = "1";
    }

    /* =========================
     CLOSE EVENT
     ========================= */

    setTimeout(() => {
      this.end();
    }, 1800);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = null;
  }
}
let penaltyGameInstance = null;

export function startPenaltyGame(config = {}) {
  const root = config.rootElement;

  if (!root) {
    throw new Error("startPenaltyGame requires config.rootElement");
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
  if (!penaltyGameInstance) {
    return;
  }

  penaltyGameInstance.end();

  penaltyGameInstance = null;
}
