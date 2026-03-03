import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, BUCKET_VARIATIONS } from '@/lib/supabase';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return ext;
  return 'jpg';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    if (!draftId) {
      return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
    }

    const { data: draft, error: draftError } = await getSupabaseAdmin()
      .from('variation_drafts')
      .select('id')
      .eq('id', draftId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const { count, error: countError } = await getSupabaseAdmin()
      .from('variation_draft_files')
      .select('*', { count: 'exact', head: true })
      .eq('draft_id', draftId);

    if (countError || (count ?? 0) >= MAX_IMAGES) {
      return NextResponse.json(
        { error: 'Maximum 10 photos allowed.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = (formData.get('file') ?? formData.get('photo')) as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `drafts/${draftId}/${filename}`;

    const buf = await file.arrayBuffer();
    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(BUCKET_VARIATIONS)
      .upload(path, buf, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    const { error: insertError } = await getSupabaseAdmin()
      .from('variation_draft_files')
      .insert({ draft_id: draftId, path });

    if (insertError) {
      console.error(insertError);
      await getSupabaseAdmin().storage.from(BUCKET_VARIATIONS).remove([path]);
      return NextResponse.json(
        { error: 'Failed to save image record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ path });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { draftId } = await params;
    if (!draftId) {
      return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
    }

    const { data: draft, error: draftError } = await getSupabaseAdmin()
      .from('variation_drafts')
      .select('id')
      .eq('id', draftId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === 'string' ? body.path.trim() : '';
    const expectedPrefix = `drafts/${draftId}/`;
    if (!path || !path.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Invalid path for this draft' },
        { status: 400 }
      );
    }

    const { error: deleteFileError } = await getSupabaseAdmin()
      .from('variation_draft_files')
      .delete()
      .eq('draft_id', draftId)
      .eq('path', path);

    if (deleteFileError) {
      console.error(deleteFileError);
      return NextResponse.json(
        { error: 'Failed to remove image record' },
        { status: 500 }
      );
    }

    await getSupabaseAdmin().storage.from(BUCKET_VARIATIONS).remove([path]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
