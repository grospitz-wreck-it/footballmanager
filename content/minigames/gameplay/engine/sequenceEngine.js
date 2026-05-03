// /gameplay/engine/sequenceEngine.js

export class SequenceEngine {
  constructor(scenario = [], options = {}) {
    this.baseScenario = scenario;
    this.index = 0;

    this.randomize = options.randomize || false;
    this.loop = options.loop || false;
    this.tacticalProfiles = options.tacticalProfiles || null;

    this.sequence = this.buildScenario();
  }

  buildScenario() {
    let scenario = [...this.baseScenario];

    if (this.randomize) {
      scenario = this.injectVariations(scenario);
    }

    return scenario;
  }

  injectVariations(sequence) {
    return sequence.map((event) => {
      const clone = { ...event };

      // Small positional variation
      if (clone.ball) {
        clone.ball = [
          Math.max(0.02, Math.min(0.98, clone.ball[0] + this.randomOffset())),
          Math.max(0.05, Math.min(0.95, clone.ball[1] + this.randomOffset(0.06))),
        ];
      }

      // Tactical flank bias
      if (this.tacticalProfiles?.home?.flankBias === "right") {
        if (clone.type === "BUILDUP_RIGHT") {
          clone.intensity = (clone.intensity || 1) + 0.15;
        }
      }

      if (this.tacticalProfiles?.home?.tempo === "high") {
        clone.speedMultiplier = 1.15;
      }

      return clone;
    });
  }

  randomOffset(range = 0.03) {
    return (Math.random() - 0.5) * range;
  }

  hasNext() {
    return this.index < this.sequence.length;
  }

  next() {
    if (!this.hasNext()) {
      if (this.loop) {
        this.reset();
      } else {
        return null;
      }
    }

    return this.sequence[this.index++];
  }

  peek() {
    return this.hasNext() ? this.sequence[this.index] : null;
  }

  reset() {
    this.index = 0;
    this.sequence = this.buildScenario();
  }

  getProgress() {
    return {
      current: this.index,
      total: this.sequence.length,
      complete: this.index >= this.sequence.length,
    };
  }

  injectScenarioBlock(block = []) {
    if (!Array.isArray(block) || block.length === 0) return;

    this.sequence.splice(this.index, 0, ...block);
  }

  branch(branchType) {
    const branchMap = {
      COUNTER: [
        {
          minute: null,
          type: "COUNTER_ATTACK",
          timelineText: "Schneller Konter!",
          ball: [0.72, 0.48],
          camera: [0.72, 0.5, 1.25],
        },
      ],

      FOUL: [
        {
          minute: null,
          type: "FOUL",
          timelineText: "Foul im Aufbau",
          ball: [0.61, 0.5],
          camera: [0.61, 0.5, 1.15],
        },
      ],
    };

    if (branchMap[branchType]) {
      this.injectScenarioBlock(branchMap[branchType]);
    }
  }
}
