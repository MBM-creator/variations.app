import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, BUCKET_VARIATIONS } from '@/lib/supabase';

const EXPIRES_IN = 3600; // 1 hour

/** POST body: { paths: string[] } – returns { urls: { path: string, url: string }[] } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paths = body?.paths;
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'paths array required' }, { status: 400 });
    }
    if (paths.length > 50) {
      return NextResponse.json({ error: 'Too many paths' }, { status: 400 });
    }

    const results: { path: string; url: string }[] = [];
    for (const path of paths) {
      if (typeof path !== 'string' || !path.startsWith('variations/')) {
        continue;
      }
      const { data, error } = await getSupabaseAdmin().storage
        .from(BUCKET_VARIATIONS)
        .createSignedUrl(path, EXPIRES_IN);
      if (!error && data?.signedUrl) {
        results.push({ path, url: data.signedUrl });
      }
    }
    return NextResponse.json({ urls: results });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
