import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = config
  ? createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return supabase;
}
