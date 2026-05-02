// =========================
// 🧠 EVENT RESOLVER
// =========================

import { EVENT_REGISTRY } from "./eventRegistry.js";

export function resolveEvent(eventId, context) {

  const def = EVENT_REGISTRY[eventId];
  if (!def) return null;

  /* =========================
     PENALTY OVERRIDE
     ========================= */

  if (
    eventId === "FOUL" &&
    context?.attackPosition
  ) {
    const { x, y } =
      context.attackPosition;

    const inPenaltyBox =
      x >= 0.18 &&
      x <= 0.82 &&
      y <= 0.32;

    if (inPenaltyBox) {
      return "PENALTY";
    }
  }

  /* =========================
     EFFECT
     ========================= */

  if (def.effect) {
    def.effect(context);
  }

  /* =========================
     EVENT CHAIN
     ========================= */

  if (def.chanceNext) {
    for (const next of def.chanceNext) {
      if (Math.random() < next.chance) {
        return next.event;
      }
    }
  }

  return null;
}
