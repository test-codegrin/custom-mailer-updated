// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =  import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Helpful runtime message during dev if envs are missing
  console.warn('Supabase URL or anon key is not set. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
