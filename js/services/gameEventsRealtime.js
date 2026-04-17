// =========================
// 🔴 REALTIME GAME EVENTS (FINAL CLEAN)
// =========================

import { supabase } from "../client.js";
import { game } from "../core/state.js";
import { emit } from "../core/events.js";
import { EVENTS } from "../core/events.constants.js";

// =========================
// 📥 INITIAL LOAD
// =========================

export async function loadGameEvents(){

  const { data, error } = await supabase
    .from("game_events")
    .select("*");

  // 🔥 HIER rein
  console.log("RAW RESPONSE:", { data, error });

  if(error){
    console.error("❌ loadGameEvents error:", error);
    return [];
  }

  game.data = game.data || {};
  game.data.gameEvents = data || [];

  console.log("🔥 Events geladen:", game.data.gameEvents);

  return data || [];
}

// =========================
// 🔴 REALTIME SUBSCRIBE
// =========================
export function subscribeGameEvents(){

  console.log("🔴 Realtime Events aktiv");

  const channel = supabase
    .channel("game-events-channel")

    // =========================
    // ➕ INSERT
    // =========================
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "game_events" },
      payload => {

        const newEvent = payload.new;

        console.log("➕ EVENT INSERT", newEvent);

        const exists = game.data.gameEvents.some(
          e => String(e.id) === String(newEvent.id)
        );

        if(!exists){
          game.data.gameEvents.push(newEvent);
        }

        emit(EVENTS.STATE_CHANGED);
      }
    )

    // =========================
    // ✏️ UPDATE
    // =========================
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "game_events" },
      payload => {

        const updated = payload.new;

        console.log("✏️ EVENT UPDATE", updated);

        const index = game.data.gameEvents.findIndex(
          e => String(e.id) === String(updated.id)
        );

        if(index !== -1){
          game.data.gameEvents[index] = updated;
        }

        emit(EVENTS.STATE_CHANGED);
      }
    )

    // =========================
    // ❌ DELETE
    // =========================
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "game_events" },
      payload => {

        const deleted = payload.old;

        console.log("❌ EVENT DELETE", deleted);

        game.data.gameEvents = game.data.gameEvents.filter(
          e => String(e.id) !== String(deleted.id)
        );

        emit(EVENTS.STATE_CHANGED);
      }
    )

    .subscribe();

  return channel;
}
