import { supabase } from "../js/client.js";

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
      created_at: new Date().toISOString()
    });
  } catch(e){
    console.warn("Tracking failed", e);
  }
}
