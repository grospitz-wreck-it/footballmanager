// /gameplay/engine/eventQueue.js

import {
  validateMatchEvent,
  cloneMatchEvent,
} from "./eventContract.js";

/**
 * EventQueue V1.3
 *
 * Priorisierte, sichere Eventverwaltung
 * für:
 * - Render
 * - Event-Bar
 * - Commentary
 * - Trigger
 */

export class EventQueue {
  #items = [];

  push(event) {
    if (!validateMatchEvent(event)) {
      console.warn("Invalid MatchEvent rejected:", event);
      return false;
    }

    this.#items.push(cloneMatchEvent(event));

    this.#items.sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    return true;
  }

  pushMany(events = []) {
    events.forEach((event) => this.push(event));
  }

  drain() {
    const drained = [...this.#items];
    this.#items = [];
    return drained;
  }

  peek() {
    return this.#items.length
      ? this.#items[0]
      : null;
  }

  size() {
    return this.#items.length;
  }

  clear() {
    this.#items = [];
  }

  isEmpty() {
    return this.#items.length === 0;
  }

  filterByType(type) {
    return this.#items.filter(
      (event) => event.type === type
    );
  }

  removeById(eventId) {
    this.#items = this.#items.filter(
      (event) => event.id !== eventId
    );
  }

  debugSnapshot() {
    return this.#items.map((event) => ({
      id: event.id,
      minute: event.minute,
      type: event.type,
      priority: event.priority,
    }));
  }
}
