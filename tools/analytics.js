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

export function track(event, payload = {}){

  supabase
    .from("analytics_events")
    .insert({
      event_name: event,
      payload,
      session_id: getSessionId(),
      user_id: getUserId(),
      created_at: new Date().toISOString()
    })
    .then(({ error }) => {
      if(error){
        console.warn("Tracking failed", error);
      }
    })
    .catch(() => {
      // 🔇 komplett silent fail (wichtig für UX)
    });
}
