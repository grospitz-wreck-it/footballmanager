// /gameplay/integration/gameplayMount.js

/**
 * GameplayMount V1.4
 *
 * Öffentlicher Einstiegspunkt
 * für spätere Main-App Integration.
 *
 * Aktuell:
 * Sandbox-safe
 * Keine bestehende App wird verändert.
 */

import { MatchOrchestrator } from "../core/matchOrchestrator.js";
import { GameLoop } from "../core/gameLoop.js";
import { GameplayCanvas } from "../render/gameplayCanvas.js";
import { CameraController } from "../render/cameraController.js";
import { InterpolationEngine } from "../render/interpolationEngine.js";
import { DebugOverlay } from "../dev/debugOverlay.js";
import { MinigameTriggerService } from "../triggers/minigameTriggerService.js";

export function mountGameplaySystem({
  canvas,
  config,
  eventBarAdapter = null,
  commentaryAdapter = null,
  debugContainer = null,
  scenario = null,
}) {
  if (!canvas) {
    throw new Error(
      "mountGameplaySystem requires a valid canvas."
    );
  }

  const camera = new CameraController();

  const orchestrator = new MatchOrchestrator({
    scenario,
  });

  const interpolation = new InterpolationEngine();

  const renderer = new GameplayCanvas(
    canvas,
    config,
    camera
  );

  const debug =
    debugContainer
      ? new DebugOverlay(debugContainer)
      : null;

  const minigameTriggers =
    new MinigameTriggerService();

  const system = {
    camera,
    orchestrator,
    interpolation,
    renderer,
    debug,
    minigameTriggers,

    adapters: {
      eventBar: eventBarAdapter,
      commentary: commentaryAdapter,
    },

    loop: null,
  };

  system.loop = new GameLoop({
    tickRate: config.tickRate,

    interpolationEngine: interpolation,

    debugOverlay: debug,

    onTick: (dt) => {
      orchestrator.tick(dt);

      camera.update(dt);

      interpolation.capture(
        orchestrator.state
      );

      const events =
        orchestrator.queue.drain();

      for (const event of events) {
        // Camera
        if (event.camera) {
          camera.setFocus(event.camera);
        } else {
          camera.triggerEventFocus(
            event.type
          );
        }

        // Visual trails
        if (
          event.type === "PASS" ||
          event.type === "THROUGH_PASS"
        ) {
          renderer.addTrail(
            [0.45, 0.5],
            event.ball,
            "pass"
          );
        }

        if (
          event.type === "SHOT" ||
          event.type === "BIG_CHANCE"
        ) {
          renderer.addTrail(
            [0.82, 0.5],
            event.ball,
            "shot"
          );

          renderer.triggerHighlight(
            event.ball
          );
        }

        if (event.type === "GOAL") {
          renderer.triggerHighlight(
            event.ball
          );
        }

        // Event Bar Hook
        if (
          eventBarAdapter?.pushTimelineEvent
        ) {
          eventBarAdapter.pushTimelineEvent(
            event
          );
        }

        // Commentary Hook
        if (
          commentaryAdapter?.emitCommentary
        ) {
          commentaryAdapter.emitCommentary(
            event
          );
        }

        // Minigame Trigger Hook
        minigameTriggers.evaluate(
          event
        );
      }

      if (debug) {
        debug.updateMatchState(
          orchestrator.state,
          config.tickRate
        );
      }
    },

    onRender: () => {
      const interpolated =
        interpolation.getInterpolatedState() ||
        orchestrator.state;

      renderer.render(interpolated);

      if (debug) {
        debug.render();
      }
    },
  });

  return {
    start() {
      system.loop.start();
    },

    stop() {
      system.loop.stop();
    },

    reset() {
      orchestrator.reset();
      minigameTriggers.reset();
      interpolation.reset();
    },

    getState() {
      return orchestrator.state;
    },

    getPendingTrigger() {
      return minigameTriggers.consumeTrigger();
    },

    system,
  };
}
