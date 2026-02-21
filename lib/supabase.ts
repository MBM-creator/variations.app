import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

/** Server-side only. Lazy init so build works without env. Throws if env missing at runtime. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

export const BUCKET_VARIATIONS = 'variations';
