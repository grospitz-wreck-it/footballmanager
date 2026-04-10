// =========================
// 🧠 EVENT RESOLVER
// =========================

import { EVENT_REGISTRY } from "./eventRegistry.js";

export function resolveEvent(eventId, context){

  const def = EVENT_REGISTRY[eventId];
  if(!def) return null;

  // Effekt ausführen
  if(def.effect){
    def.effect(context);
  }

  // Chain prüfen
  if(def.chanceNext){
    for(const next of def.chanceNext){
      if(Math.random() < next.chance){
        return next.event;
      }
    }
  }

  return null;
}
