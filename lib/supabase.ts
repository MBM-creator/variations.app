import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

/** Server-side only. Lazy init so build works without env. Throws if env missing at runtime. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    if (url.includes('xxxx') || key.includes('your_service_role')) {
      throw new Error(
        'Supabase is still using placeholder values. In .env.local set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API.'
      );
    }
    _admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return _admin;
}

export const BUCKET_VARIATIONS = 'variations';
