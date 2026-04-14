
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
    "https://kckwxggzoenybssryaqr.supabase.co/rest/v1/analytics_events?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja3d4Z2d6b2VueWJzc3J5YXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODA1NTksImV4cCI6MjA4OTg1NjU1OX0.J6zOyaBcrXphox1zwLn-bUOYP6SrWxs3_1x4z8B6ZDE",
    new Blob([data], { type: "application/json" })
  );
}
