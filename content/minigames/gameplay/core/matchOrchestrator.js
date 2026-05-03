// /gameplay/core/matchOrchestrator.js

import { gameplayConfig } from "../config/gameplayConfig.js";
import { tacticalProfiles } from "../config/tacticalProfiles.js";

import { createInitialMatchState } from "../engine/matchState.js";
import { EventQueue } from "../engine/eventQueue.js";
import { SequenceEngine } from "../engine/sequenceEngine.js";

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

    const event = this.normalizeEvent(rawEvent);

    this.applyEventToState(event);

    this.queue.push(event);

    if (this.hooks.onEvent) {
      this.hooks.onEvent(event, this.state);
    }

    if (event.type === "GOAL" && this.hooks.onGoal) {
      this.hooks.onGoal(event, this.state);
    }
  }

  normalizeEvent(rawEvent) {
    const momentum = this.momentum.applyEvent(
      rawEvent.type,
      this.state.score
    );

    return {
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 9999)}`,

      minute:
        rawEvent.minute ??
        this.state.clock.minute,

      second:
        rawEvent.second ??
        this.state.clock.second,

      type: rawEvent.type,

      team:
        rawEvent.team ||
        this.state.metadata.possession,

      ball:
        rawEvent.ball ||
        [this.state.ball.x, this.state.ball.y],

      camera:
        rawEvent.camera || null,

      timelineText:
        rawEvent.timelineText ||
        rawEvent.type,

      intensity:
        rawEvent.intensity || 1,

      momentum,

      tacticalContext: {
        home: tacticalProfiles.home,
        away: tacticalProfiles.away,
      },
    };
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

    if (event.momentum > 0.15) {
      this.state.momentum.dominantTeam = "HOME";
    } else if (event.momentum < -0.15) {
      this.state.momentum.dominantTeam = "AWAY";
    } else {
      this.state.momentum.dominantTeam = null;
    }

    switch (event.type) {
      case "BALL_WIN":
        this.state.metadata.possession = "HOME";
        break;

      case "INTERCEPTION":
      case "BALL_LOSS":
        this.state.metadata.possession =
          this.state.metadata.possession === "HOME"
            ? "AWAY"
            : "HOME";
        break;

      case "GOAL":
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
    const shiftX =
      event.type === "BUILDUP_RIGHT"
        ? 0.03
        : event.type === "THROUGH_PASS"
        ? 0.05
        : event.type === "SHOT"
        ? 0.07
        : 0;

    if (this.state.metadata.possession === "HOME") {
      this.state.home.forEach((player) => {
        player.x = Math.min(player.x + shiftX, 0.95);
      });

      this.state.away.forEach((player) => {
        player.x = Math.min(player.x + shiftX * 0.3, 0.92);
      });
    } else {
      this.state.away.forEach((player) => {
        player.x = Math.max(player.x - shiftX, 0.05);
      });

      this.state.home.forEach((player) => {
        player.x = Math.max(player.x - shiftX * 0.3, 0.08);
      });
    }
  }

  reset() {
    this.state = createInitialMatchState({
      ...gameplayConfig,
      tacticalProfiles,
    });

    this.sequence.reset();
    this.elapsed = 0;
    this.queue.clear?.();
  }
}
