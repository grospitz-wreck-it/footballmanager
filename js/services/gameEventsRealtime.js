// =========================
// 🔴 REALTIME EVENT DEFINITIONS
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
    .from("event_definitions")
    .select("*");

  console.log("RAW RESPONSE:", { data, error });

  if(error){
    console.error("❌ loadEventDefinitions error:", error);
    return [];
  }

  game.data = game.data || {};
  game.data.eventDefinitions = data || [];

  console.log("🔥 EventDefinitions geladen:", game.data.eventDefinitions.length);

  return data || [];
}

// =========================
// 🔴 REALTIME SUBSCRIBE
// =========================
export function subscribeGameEvents(){

  console.log("🔴 Realtime EventDefinitions aktiv");

  const channel = supabase
    .channel("event-definitions-channel")

    // =========================
    // ➕ INSERT
    // =========================
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "event_definitions" },
      payload => {

        const newEvent = payload.new;

        console.log("➕ EVENT DEF INSERT", newEvent);

        if(!game.data?.eventDefinitions){
          game.data.eventDefinitions = [];
        }

        const exists = game.data.eventDefinitions.some(
          e => String(e.id) === String(newEvent.id)
        );

        if(!exists){
          game.data.eventDefinitions.push(newEvent);
        }

        emit(EVENTS.STATE_CHANGED);
      }
    )

    // =========================
    // ✏️ UPDATE
    // =========================
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "event_definitions" },
      payload => {

        const updated = payload.new;

        console.log("✏️ EVENT DEF UPDATE", updated);

        const index = game.data.eventDefinitions.findIndex(
          e => String(e.id) === String(updated.id)
        );

        if(index !== -1){
          game.data.eventDefinitions[index] = updated;
        }

        emit(EVENTS.STATE_CHANGED);
      }
    )

    // =========================
    // ❌ DELETE
    // =========================
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "event_definitions" },
      payload => {

        const deleted = payload.old;

        console.log("❌ EVENT DEF DELETE", deleted);

        game.data.eventDefinitions = (game.data.eventDefinitions || []).filter(
          e => String(e.id) !== String(deleted.id)
        );

        emit(EVENTS.STATE_CHANGED);
      }
    )

    .subscribe();

  return channel;
}
