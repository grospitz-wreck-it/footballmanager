// =========================
// 🔌 SUPABASE CLIENT (SAFE GLOBAL)
// =========================

if(!window.supabaseClient){

  const SUPABASE_URL = "https://kckwxggzoenybssryaqr.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja3d4Z2d6b2VueWJzc3J5YXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODA1NTksImV4cCI6MjA4OTg1NjU1OX0.J6zOyaBcrXphox1zwLn-bUOYP6SrWxs3_1x4z8B6ZDE";

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  console.log("✅ Supabase Client erstellt");

} else {
  console.log("ℹ️ Supabase bereits vorhanden");
}
