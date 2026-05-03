export class SequenceEngine {
  constructor(scenario) { this.scenario = scenario; this.index = 0; }
  hasNext() { return this.index < this.scenario.length; }
  next() { return this.hasNext() ? this.scenario[this.index++] : null; }
}
