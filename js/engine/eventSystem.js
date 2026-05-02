// =========================
// 🎮 EVENT SYSTEM (CLEAN + NO GOAL OVERRIDE + VISUALS)
// =========================

import { resolveEvent } from "./eventResolver.js";
import { EVENT_REGISTRY } from "./eventRegistry.js";
import { game } from "../core/state.js";

import { resolveShot, resolveFoul } from "./resolver.js";
import { EVENT_TYPES } from "../core/events.constants.js";
import { emit } from "../core/events.js";
import { EVENTS } from "../core/events.constants.js";

// =========================
// 📦 AKTIVE EVENTS
// =========================
const activeEvents = [];

// =========================
// 🎨 ASSET HELPER
// =========================
function getAssetsByType(type){

  const events = game.data?.gameEvents || [];

  const e = events.find(ev =>
    ev.type === type ||
    ev.effect === type ||
    ev.eventType === type
  );

  return Array.isArray(e?.assets) ? e.assets : [];
}

// =========================
// 🎯 PRIORITY SYSTEM
// =========================
function getEventPriority(type){

  switch(type){
    case EVENT_TYPES.GOAL: return 100;
    case EVENT_TYPES.SHOT_SAVED: return 80;
    case EVENT_TYPES.RED_CARD: return 70;
    case EVENT_TYPES.YELLOW_CARD: return 60;
    case EVENT_TYPES.FOUL: return 40;
    case EVENT_TYPES.SHOT: return 20;
    default: return 10;
  }
}

// =========================
// 🧠 MATCH EVENT RESOLVER
// =========================
function processMatchEvent(event){

  if(!event) return false;
  if(event._resolved) return false;

  // =========================
  // 🎯 SHOT
  // =========================
  if(event.type === EVENT_TYPES.SHOT){

    const shooter = window.playerPool?.find(p => p.id == event.playerId);
    const keeper = window.playerPool?.find(p => p.id == event.relatedPlayerId);

    const result = resolveShot({ shooter, keeper });

    // ❗ GOAL NICHT HIER (MatchEngine macht Assets korrekt)
    if(result === EVENT_TYPES.GOAL){
      return false;
    }

    const assets =
      Array.isArray(event.assets) && event.assets.length
        ? event.assets
        : getAssetsByType(result);

    emit(EVENTS.MATCH_EVENT, {
      ...event,
      type: result,
      outcome: result,

      // 🔥 FIX: Assets IMMER setzen
      assets,

      // 🔥 NEU: UI SYSTEM
      priority: getEventPriority(result),
      visualType: result,

      _resolved: true
    });

    return true;
  }

  // =========================
  // 🚫 FOUL
  // =========================
  if(event.type === EVENT_TYPES.FOUL){

    const result = resolveFoul(event);

    if (result === EVENT_TYPES.PENALTY) {
      if (game.match?.live) {
        game.match.live.running = false;
      }

window.startPenaltySequence?.({
  ...event,
  team:
    event.team ||
    "home"
});
      return true;
    }
    const assets =
      Array.isArray(event.assets) && event.assets.length
        ? event.assets
        : getAssetsByType(result);

    emit(EVENTS.MATCH_EVENT, {
      ...event,
      type: result,
      outcome: result,

      assets,

      priority: getEventPriority(result),
      visualType: result,

      _resolved: true
    });

    return true;
  }

  return false;
}

// =========================
// 🧠 DB EVENT → ENGINE FORMAT
// =========================
function mapDbEvent(e){
  return {
    id: e.id,
    duration: e.duration || 0,

    modifier: {
      attack: e.modifier_attack || 0,
      defense: e.modifier_defense || 0
    },

    apply(context){

      switch(e.effect_type){

        case "goal":
          if(e.effect_target === "home") context.live.score.home += e.effect_value || 1;
          if(e.effect_target === "away") context.live.score.away += e.effect_value || 1;
          break;

        case "pause":
          context.pauseMatch?.();
          break;

        case "resume":
          context.resumeMatch?.();
          break;

        case "end":
          context.forceEndMatch?.(e.title);
          break;
      }
    }
  };
}

// =========================
// 🚀 TRIGGER EVENT
// =========================
function triggerEvent(eventId, context = {}){

  let def = null;

  const dbEvent = game.data.events?.find(e => e.id === eventId);

  if(dbEvent){
    def = mapDbEvent(dbEvent);
  } else {
    def = EVENT_REGISTRY[eventId];
  }

  if(!def) return;

  const eventObj = {
    id: eventId,
    minute: game.match?.live?.minute ?? 0,
    duration: def.duration || 0,
    data: context
  };

  activeEvents.push(eventObj);

  if(def.apply){
    def.apply(context);
  }

  const next = resolveEvent(eventId, context);
  if(next){
    triggerEvent(next, context);
  }

  // 👉 UI LOG
  if(game.match?.live?.events){
    game.match.live.events.unshift(
      (game.match.live.minute ?? 0) + "' - " + (dbEvent?.title || eventId)
    );

    if(game.match.live.events.length > 25){
      game.match.live.events.pop();
    }
  }
}

// =========================
// ⏳ UPDATE EVENTS
// =========================
function updateEvents(){

  const live = game.match?.live;
  if(!live) return;

  // 🔥 RESOLVER PIPELINE
  if(Array.isArray(live.events) && live.events.length){

    const remaining = [];

    live.events.forEach(event => {

      const handled = processMatchEvent(event);

      if(!handled){
        remaining.push(event);
      }
    });

    live.events = remaining;
  }

  // =========================
  // ⏳ ACTIVE EVENTS UPDATE
  // =========================
  for(let i = activeEvents.length - 1; i >= 0; i--){

    const e = activeEvents[i];

    if(e.duration > 0){
      e.duration--;

      if(e.duration <= 0){
        activeEvents.splice(i, 1);
      }
    }
  }
}

// =========================
// 📊 MODIFIER
// =========================
function getActiveModifiers(){

  return activeEvents
    .map(e => {

      const dbEvent = game.data.events?.find(ev => ev.id === e.id);

      if(dbEvent){
        return {
          attack: dbEvent.modifier_attack || 0,
          defense: dbEvent.modifier_defense || 0
        };
      }

      return EVENT_REGISTRY[e.id]?.modifier;
    })
    .filter(Boolean);
}

// =========================
// 🎲 RANDOM EVENTS
// =========================
function rollRandomEvents(context){

  const events = game.data.events || [];

  events.forEach(e => {

    if(!e.probability) return;

    if(Math.random() < e.probability){
      triggerEvent(e.id, context);
    }
  });
}

// =========================
// 📦 EXPORTS
// =========================
export {
  triggerEvent,
  updateEvents,
  getActiveModifiers,
  rollRandomEvents
};
