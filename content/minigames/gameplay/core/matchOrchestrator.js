import { gameplayConfig } from '../config/gameplayConfig.js';
import { createInitialMatchState } from '../engine/matchState.js';
import { EventQueue } from '../engine/eventQueue.js';
import { SequenceEngine } from '../engine/sequenceEngine.js';
import { demoScenario } from '../dev/demoScenario.js';
import { MomentumModel } from '../simulation/momentumModel.js';

export class MatchOrchestrator {
  constructor() {
    this.config = gameplayConfig;
    this.state = createInitialMatchState(gameplayConfig);
    this.queue = new EventQueue();
    this.sequence = new SequenceEngine(demoScenario);
    this.momentum = new MomentumModel();
    this.elapsed = 0;
  }
  tick(dt) {
    this.elapsed += dt;
    if (this.elapsed >= 1.8 && this.sequence.hasNext()) {
      this.elapsed = 0;
      const event = this.sequence.next();
      this.state.ball.x = event.ball[0];
      this.state.ball.y = event.ball[1];
      this.state.phase = event.type;
      if (event.type === 'GOAL') this.state.score.home += 1;
      this.queue.push({ ...event, momentum: this.momentum.applyEvent(event.type) });
    }
  }
}
