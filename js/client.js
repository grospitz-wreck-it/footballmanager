import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("URL:", SUPABASE_URL);
console.log("KEY:", SUPABASE_KEY);
console.log("CLIENT:", supabase);
console.log("🔥 Supabase Client erstellt");

