import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, BUCKET_VARIATIONS } from '@/lib/supabase';
import { getClientIp } from '@/lib/get-client-ip';
import {
  sendSteveEditedEmail,
  getAdminLink,
} from '@/lib/emails';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const formData = await request.formData();
    const shortcode = formData.get('shortcode') as string;
    const editNotes = formData.get('edit_notes') as string;

    if (!shortcode?.trim() || !editNotes?.trim()) {
      return NextResponse.json(
        { error: 'Missing shortcode or client description' },
        { status: 400 }
      );
    }

    const { data: row, error: fetchError } = await getSupabaseAdmin()
      .from('variations')
      .select('id, site_name, shortcode, description, status')
      .eq('shortcode', shortcode.trim())
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Variation not found' }, { status: 404 });
    }
    if (row.status !== 'pending') {
      return NextResponse.json(
        { error: 'This variation has already been responded to' },
        { status: 400 }
      );
    }

    const files = formData.getAll('photos') as File[];
    const validFiles = files.filter(
      (f) =>
        f &&
        f.size > 0 &&
        f.size <= MAX_FILE_SIZE &&
        ALLOWED_TYPES.includes(f.type)
    );

    const prefix = `variations/${row.shortcode}`;
    let addedCount = 0;
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]!;
      const ext = file.name.split('.').pop() || 'jpg';
      const safeName = `edit-${Date.now()}-${i}.${ext}`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${prefix}/${safeName}`;
      const buf = await file.arrayBuffer();
      const { error: uploadError } = await getSupabaseAdmin().storage
        .from(BUCKET_VARIATIONS)
        .upload(path, buf, { contentType: file.type, upsert: false });
      if (!uploadError) {
        await getSupabaseAdmin().from('variation_images').insert({
          variation_id: row.id,
          image_path: path,
        });
        addedCount++;
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await getSupabaseAdmin()
      .from('variations')
      .update({
        status: 'edited',
        edit_timestamp: now,
        edit_ip: ip,
        edit_notes: editNotes.trim(),
      })
      .eq('id', row.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { error: 'Failed to update variation' },
        { status: 500 }
      );
    }

    await sendSteveEditedEmail({
      siteName: row.site_name,
      shortcode: row.shortcode,
      supervisorDescription: row.description,
      editNotes: editNotes.trim(),
      editTimestamp: now,
      editIp: ip,
      adminLink: getAdminLink(row.shortcode),
      addedImageCount: addedCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Edit submitted. Steve has been notified.',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
