// =========================
// 🔴 REALTIME GAME EVENTS
// =========================

import { supabase } from "../client.js";
import { game } from "../core/state.js";

// =========================
// 📥 INITIAL LOAD
// =========================
export async function loadGameEvents(){

  const { data, error } = await supabase
    .from("game_events")
    .select("*");

  if(error){
    console.error("❌ loadGameEvents error:", error);
    return;
  }

  game.data = game.data || {};
  game.data.gameEvents = data || [];

  console.log("🔥 Events geladen:", game.data.gameEvents);
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
      {
        event: "INSERT",
        schema: "public",
        table: "game_events"
      },
      payload => {

        console.log("➕ EVENT INSERT", payload.new);

        game.data.gameEvents.push(payload.new);
      }
    )

    // =========================
    // ✏️ UPDATE
    // =========================
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "game_events"
      },
      payload => {

        console.log("✏️ EVENT UPDATE", payload.new);

        const index = game.data.gameEvents.findIndex(
          e => String(e.id) === String(payload.new.id)
        );

        if(index !== -1){
          game.data.gameEvents[index] = payload.new;
        }
      }
    )

    // =========================
    // ❌ DELETE
    // =========================
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "game_events"
      },
      payload => {

        console.log("❌ EVENT DELETE", payload.old);

        game.data.gameEvents = game.data.gameEvents.filter(
          e => String(e.id) !== String(payload.old.id)
        );
      }
    )

    .subscribe();

  return channel;
}
