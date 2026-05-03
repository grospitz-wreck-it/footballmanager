// /gameplay/core/matchOrchestrator.js
// Phase 1.4 Harmonized Production Upgrade

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
        (
          this.state.metadata.possession === "HOME"
            ? this.config.team.home.name
            : this.config.team.away.name
        ),

      playerName:
        rawEvent.playerName ||
        null,

      ball:
        rawEvent.ball ||
        [
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

  updateTeamShapes(event) {
    let shiftX = 0;

    switch (event.type) {
      case EVENT_TYPES.BUILDUP_RIGHT:
      case EVENT_TYPES.BUILDUP_LEFT:
        shiftX = 0.025;
        break;

      case EVENT_TYPES.THROUGH_PASS:
        shiftX = 0.045;
        break;

      case EVENT_TYPES.SHOT:
      case EVENT_TYPES.BIG_CHANCE:
        shiftX = 0.065;
        break;

      default:
        shiftX = 0.01;
        break;
    }

    const possession =
      this.state.metadata.possession;

    if (possession === "HOME") {
      this.state.home.forEach((player) => {
        player.x = Math.min(
          player.x + shiftX,
          0.96
        );
      });

      this.state.away.forEach((player) => {
        player.x = Math.min(
          player.x + shiftX * 0.22,
          0.94
        );
      });
    } else {
      this.state.away.forEach((player) => {
        player.x = Math.max(
          player.x - shiftX,
          0.04
        );
      });

      this.state.home.forEach((player) => {
        player.x = Math.max(
          player.x - shiftX * 0.22,
          0.06
        );
      });
    }
  }

  reset() {
    this.state = createInitialMatchState({
      ...gameplayConfig,
      tacticalProfiles,
    });

    this.sequence.reset();
    this.momentum.reset();

    this.elapsed = 0;

    this.queue.clear();
  }
}
