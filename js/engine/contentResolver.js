// =========================
// 🧠 CONTENT RESOLVER (FINAL FIXED)
// =========================

import { game } from "../core/state.js";

// =========================
// 🔤 NORMALIZE
// =========================
function normalize(type){
  return String(type || "").toLowerCase();
}

// =========================
// 🔧 URL FIXER
// =========================
function fixUrl(url){
  if(!url) return url;

  // 🔥 Supabase Transform → Original
  url = url.replace("/render/image/public/", "/object/public/");

  // 🔥 OPTIONAL: PNG → WEBP (nur wenn deine Assets wirklich webp sind!)
  if(url.endsWith(".png")){
    url = url.replace(".png", ".webp");
  }

  return url;
}

// =========================
// 🎯 MAIN RESOLVER
// =========================
export function resolveEventContent(event){

  const events = game.data?.gameEvents || [];
  const type = normalize(event.type);

  // =========================
  // 🔍 MATCH EVENTS
  // =========================
  const matches = events.filter(e => {

    const possible = [
      e.type,
      e.effect,
      e.eventType
    ].map(normalize);

    return possible.includes(type);
  });

  // =========================
  // ❌ NO MATCH
  // =========================
  if(!matches.length){
    return {
      text: null,
      assets: [],
      config: null
    };
  }

  // =========================
  // 🔥 PRIORITY SORT
  // =========================
  matches.sort((a,b) => (b.priority || 0) - (a.priority || 0));

  const selected = matches[0];

  // =========================
  // 🖼 ASSETS FIX
  // =========================
  const assets = Array.isArray(selected.assets)
    ? selected.assets
        .flat()
        .map(asset => ({
          ...asset,
          url: fixUrl(asset.url)
        }))
    : [];

  // =========================
  // 🧾 RETURN
  // =========================
  return {
    text: selected.title || null,

    assets,

    config: {
      id: selected.id,
      category: selected.category || "default",
      priority: selected.priority || 0
    }
  };
}
