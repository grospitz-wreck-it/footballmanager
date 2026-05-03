export class EventQueue {
  #items = [];
  push(event) { this.#items.push(event); }
  drain() { const items = this.#items; this.#items = []; return items; }
}
