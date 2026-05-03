
// /gameplay/core/matchOrchestrator.js
// Phase 1.6 Harmonized Production Upgrade

import { gameplayConfig } from "../config/gameplayConfig.js";
import { tacticalProfiles } from "../config/tacticalProfiles.js";

import { createInitialMatchState } from "../engine/matchState.js";
import { EventQueue } from "../engine/eventQueue.js";
import { SequenceEngine } from "../engine/sequenceEngine.js";

import {
  createMatchEvent,
  EVENT_TYPES,
} from "../engine/eventContract.js";

import { demoScenario } from "../dev/demoScenario.js";

import { MomentumModel } from "../simulation/momentumModel.js";

export class MatchOrchestrator {
  constructor(options = {}) {
    this.config = gameplayConfig;

    this.state = createInitialMatchState({
      ...gameplayConfig,
      tacticalProfiles,
    });

    this.queue = new EventQueue();

    this.sequence = new SequenceEngine(
      options.scenario || demoScenario,
      {
        randomize: true,
        loop: false,
        tacticalProfiles,
      }
    );

    this.momentum = new MomentumModel();

    this.elapsed = 0;
    this.tickInterval = options.tickInterval || 1.8;

    this.hooks = {
      onEvent: options.onEvent || null,
      onGoal: options.onGoal || null,
      onSequenceEnd: options.onSequenceEnd || null,
    };
  }

  tick(dt) {
    this.elapsed += dt;

    // Smooth player + ball interpolation every frame
    this.interpolateTeamShapes(dt);

    if (this.elapsed < this.tickInterval) return;

    this.elapsed = 0;

    if (!this.sequence.hasNext()) {
      if (this.hooks.onSequenceEnd) {
        this.hooks.onSequenceEnd(this.state);
      }
      return;
    }

    const rawEvent = this.sequence.next();

    if (!rawEvent) return;

    const event = this.buildMatchEvent(rawEvent);

    this.applyEventToState(event);

    // Stamina + tactical elasticity layer
    this.postProcessEvent(event);

    this.queue.push(event);

    if (this.hooks.onEvent) {
      this.hooks.onEvent(event, this.state);
    }

    if (
      event.type === EVENT_TYPES.GOAL &&
      this.hooks.onGoal
    ) {
      this.hooks.onGoal(event, this.state);
    }
  }

  buildMatchEvent(rawEvent) {
    const minute =
      rawEvent.minute ??
      this.state.clock.minute;

    const second =
      rawEvent.second ??
      this.state.clock.second;

    const momentum = this.momentum.applyEvent(
      rawEvent.type,
      this.state.score,
      minute
    );

    return createMatchEvent({
      minute,
      second,

      type:
        rawEvent.type ||
        EVENT_TYPES.PASS,

      team:
        rawEvent.team ||
        this.state.metadata.possession,

      teamName:
        rawEvent.teamName ||
        (this.state.metadata.possession === "HOME"
          ? this.config.team.home.name
          : this.config.team.away.name),

      playerName:
        rawEvent.playerName || null,

      ball:
        rawEvent.ball || [
          this.state.ball.x,
          this.state.ball.y,
        ],

      camera:
        rawEvent.camera || null,

      timelineText:
        rawEvent.timelineText ||
        rawEvent.type,

      intensity:
        rawEvent.intensity || 1,

      momentum,

      score: {
        ...this.state.score,
      },

      tacticalContext: {
        home: tacticalProfiles.home,
        away: tacticalProfiles.away,
      },

      metadata: {
        sequenceStep:
          this.state.metadata.sequenceStep,
      },
    });
  }

  applyEventToState(event) {
    this.state.clock.minute = event.minute;
    this.state.clock.second = event.second;

    this.state.phase = event.type;

    this.state.ball.x = event.ball[0];
    this.state.ball.y = event.ball[1];

    this.state.metadata.lastEvent = event;
    this.state.metadata.sequenceStep += 1;

    this.state.momentum.value = event.momentum;
    this.state.momentum.dominantTeam =
      this.momentum.getDominantSide();

    switch (event.type) {
      case EVENT_TYPES.BALL_WIN:
      case EVENT_TYPES.BALL_RECOVERY:
        this.state.metadata.possession = "HOME";
        break;

      case EVENT_TYPES.INTERCEPTION:
      case EVENT_TYPES.BALL_LOSS:
        this.state.metadata.possession =
          this.state.metadata.possession === "HOME"
            ? "AWAY"
            : "HOME";
        break;

      case EVENT_TYPES.GOAL:
        if (event.team === "AWAY") {
          this.state.score.away += 1;
        } else {
          this.state.score.home += 1;
        }
        break;
    }

    this.updateTeamShapes(event);
  }

  // Phase 1.5: echte Spielerzielbewegung
  updateTeamShapes(event) {
    let shiftX = 0;
    let flankBias = 0;

    switch (event.type) {
      case EVENT_TYPES.BUILDUP_RIGHT:
        shiftX = 0.03;
        flankBias = 0.04;
        break;

      case EVENT_TYPES.BUILDUP_LEFT:
        shiftX = 0.03;
        flankBias = -0.04;
        break;

      case EVENT_TYPES.THROUGH_PASS:
        shiftX = 0.055;
        break;

      case EVENT_TYPES.SHOT:
      case EVENT_TYPES.BIG_CHANCE:
        shiftX = 0.075;
        break;

      case EVENT_TYPES.BALL_LOSS:
      case EVENT_TYPES.INTERCEPTION:
        shiftX = -0.045;
        break;

      default:
        shiftX = 0.01;
        break;
    }

    const possession =
      this.state.metadata.possession;

    const moveTeam = (
      players,
      direction
    ) => {
      players.forEach((player) => {
        let roleFlank = 0;

        if (player.role.includes("R")) {
          roleFlank = flankBias;
        }

        if (player.role.includes("L")) {
          roleFlank = -flankBias;
        }

        if (player.role === "CM") {
          roleFlank = flankBias * 0.3;
        }

        const speedFactor =
          player.speed || 1;

        player.targetX = Math.max(
          0.03,
          Math.min(
            0.97,
            player.x +
              shiftX *
                direction *
                speedFactor
          )
        );

        player.targetY = Math.max(
          0.06,
          Math.min(
            0.94,
            player.y +
              roleFlank *
                speedFactor
          )
        );
      });
    };

    if (possession === "HOME") {
      moveTeam(this.state.home, 1);
      moveTeam(this.state.away, 0.28);
    } else {
      moveTeam(this.state.away, -1);
      moveTeam(this.state.home, -0.28);
    }

    this.state.ball.targetX = event.ball[0];
    this.state.ball.targetY = event.ball[1];
  }

  // Phase 1.6: smooth interpolation
  interpolateTeamShapes(dt) {
    const lerpFactor =
      this.config.animation.playerLerpSpeed * dt;

    const ballLerp =
      this.config.animation.ballLerpSpeed * dt;

    const applyInterpolation = (players) => {
      players.forEach((player) => {
        const staminaFactor =
          player.stamina !== undefined
            ? Math.max(0.72, player.stamina)
            : 1;

        const adaptiveLerp =
          lerpFactor *
          (player.speed || 1) *
          staminaFactor;

        player.x +=
          (player.targetX - player.x) *
          adaptiveLerp;

        player.y +=
          (player.targetY - player.y) *
          adaptiveLerp;
      });
    };

    applyInterpolation(this.state.home);
    applyInterpolation(this.state.away);

    this.state.ball.x +=
      (this.state.ball.targetX -
        this.state.ball.x) *
      ballLerp;

    this.state.ball.y +=
      (this.state.ball.targetY -
        this.state.ball.y) *
      ballLerp;
  }

  // Phase 1.6: stamina system
  updatePlayerStamina(event) {
    const intensity =
      event.intensity || 1;

    const possession =
      this.state.metadata.possession;

    const drainTeam = (
      players,
      multiplier
    ) => {
      players.forEach((player) => {
        const workRate =
          player.workRate || 1;

        const staminaLoss =
          0.0025 *
          intensity *
          multiplier *
          workRate;

        player.stamina = Math.max(
          0.55,
          (player.stamina || 1) -
            staminaLoss
        );
      });
    };

    if (possession === "HOME") {
      drainTeam(this.state.home, 1.15);
      drainTeam(this.state.away, 0.72);
    } else {
      drainTeam(this.state.away, 1.15);
      drainTeam(this.state.home, 0.72);
    }
  }

  // Phase 1.6: formation elasticity
  applyFormationElasticity() {
    const possession =
      this.state.metadata.possession;

    const adjustShape = (
      players,
      isAttacking
    ) => {
      players.forEach((player) => {
        let compression = 0;

        switch (player.role) {
          case "CB":
            compression = isAttacking
              ? 0.015
              : -0.025;
            break;

          case "LB":
          case "RB":
            compression = isAttacking
              ? 0.03
              : -0.015;
            break;

          case "CM":
          case "CAM":
            compression = isAttacking
              ? 0.04
              : -0.01;
            break;

          case "LW":
          case "RW":
          case "ST":
            compression = isAttacking
              ? 0.05
              : -0.02;
            break;
        }

        player.targetX = Math.max(
          0.03,
          Math.min(
            0.97,
            player.targetX + compression
          )
        );
      });
    };

    if (possession === "HOME") {
      adjustShape(this.state.home, true);
      adjustShape(this.state.away, false);
    } else {
      adjustShape(this.state.away, true);
      adjustShape(this.state.home, false);
    }
  }

  postProcessEvent(event) {
    this.updatePlayerStamina(event);
    this.applyFormationElasticity();
  }
}
