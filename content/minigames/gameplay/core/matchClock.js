export class MatchClock {
  constructor(startMinute = 53) { this.minute = startMinute; }
  setMinute(minute) { this.minute = minute; }
  getLabel() { return `${this.minute}’`; }
}
