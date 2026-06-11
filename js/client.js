import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

if (import.meta.env.DEV) {
  console.log("🔥 Supabase Client erstellt");
}