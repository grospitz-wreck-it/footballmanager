import { supabase } from "../js/client.js";

export function getUserId(){
  let id = localStorage.getItem("user_id");

  if(!id){
    id = crypto.randomUUID();
    localStorage.setItem("user_id", id);
  }

  return id;
}

export function getSessionId(){
  let id = localStorage.getItem("session_id");

  if(!id){
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }

  return id;
}

export async function track(event, payload = {}){
  try{
    await supabase.from("analytics_events").insert({
      event_name: event,
      payload,
      session_id: getSessionId(),
      user_id: getUserId(), // 👈 NEU
      created_at: new Date().toISOString()
    });
  } catch(e){
    console.warn("Tracking failed", e);
  }
}
export function trackEnd(event){

  const data = JSON.stringify({
    event_name: event,
    session_id: getSessionId(),
    user_id: getUserId(),
    created_at: new Date().toISOString()
  });

  navigator.sendBeacon(
    "https://kckwxggzoenybssryaqr.supabase.co/rest/v1/analytics_events?apikey=YOUR_ANON_KEY",
    new Blob([data], { type: "application/json" })
  );
}
