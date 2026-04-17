// =========================
// 🔌 SUPABASE CLIENT (SAFE GLOBAL)
// =========================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://kckwxggzoenybssryaqr.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja3d4Z2d6b2VueWJzc3J5YXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODA1NTksImV4cCI6MjA4OTg1NjU1OX0.J6zOyaBcrXphox1zwLn-bUOYP6SrWxs3_1x4z8B6ZDE";


export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);





  
 
