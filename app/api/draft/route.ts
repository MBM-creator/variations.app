import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    const { data: draft, error } = await getSupabaseAdmin()
      .from('variation_drafts')
      .insert({})
      .select('id')
      .single();

    if (error || !draft) {
      console.error(error);
      return NextResponse.json(
        { error: 'Failed to create draft' },
        { status: 500 }
      );
    }

    return NextResponse.json({ draftId: draft.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
