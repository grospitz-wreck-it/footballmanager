// =========================
// 🧠 CONTENT RESOLVER (NEU)
// =========================

import { game } from "../core/state.js";

function normalize(type){
  return String(type || "").toLowerCase();
}

export function resolveEventContent(event){

  const events = game.data?.gameEvents || [];
  const type = normalize(event.type);

  const matches = events.filter(e => 
    normalize(e.type) === type
  );

  if(!matches.length){
    return {
      text: null,
      assets: [],
      config: null
    };
  }

  // 🔥 optional vorbereitet für später
  matches.sort((a,b) => (b.priority || 0) - (a.priority || 0));

  const selected = matches[0];

  return {
    text: selected.title || null,
    assets: Array.isArray(selected.assets) ? selected.assets : [],
    config: {
      id: selected.id,
      category: selected.category || "default",
      priority: selected.priority || 0
    }
  };
}
