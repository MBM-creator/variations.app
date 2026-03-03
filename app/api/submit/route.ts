import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, BUCKET_VARIATIONS } from '@/lib/supabase';
import { generateShortcode } from '@/lib/shortcode';
import { getClientIp } from '@/lib/get-client-ip';
import {
  sendClientVariationEmail,
  getViewLink,
  type Urgency,
} from '@/lib/emails';

const URGENCY_VALUES: Urgency[] = ['same_day', 'low', 'medium', 'high', 'cannot_proceed'];
const MIN_IMAGES = 1;
const MAX_IMAGES = 10;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json().catch(() => ({}));

    const draftId = body.draftId as string | undefined;
    const supervisorName = body.supervisor_name as string | undefined;
    const siteName = body.site_name as string | undefined;
    const siteAddress = body.site_address as string | undefined;
    const clientEmail = body.client_email as string | undefined;
    const description = body.description as string | undefined;
    const urgencyRaw = body.urgency as string | undefined;

    if (
      !draftId ||
      !supervisorName?.trim() ||
      !siteName?.trim() ||
      !siteAddress?.trim() ||
      !clientEmail?.trim() ||
      !description?.trim() ||
      !urgencyRaw
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const urgency = URGENCY_VALUES.includes(urgencyRaw as Urgency)
      ? (urgencyRaw as Urgency)
      : 'medium';

    const { data: draft, error: draftError } = await getSupabaseAdmin()
      .from('variation_drafts')
      .select('id')
      .eq('id', draftId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 400 }
      );
    }

    const { data: draftFiles, error: filesError } = await getSupabaseAdmin()
      .from('variation_draft_files')
      .select('path')
      .eq('draft_id', draftId)
      .order('created_at');

    if (filesError || !draftFiles?.length) {
      return NextResponse.json(
        { error: 'No photos found for this draft' },
        { status: 400 }
      );
    }

    if (draftFiles.length < MIN_IMAGES || draftFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Please upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.` },
        { status: 400 }
      );
    }

    let shortcode = generateShortcode(8);
    let exists = await getSupabaseAdmin()
      .from('variations')
      .select('id')
      .eq('shortcode', shortcode)
      .single();
    while (exists.data) {
      shortcode = generateShortcode(8);
      exists = await getSupabaseAdmin()
        .from('variations')
        .select('id')
        .eq('shortcode', shortcode)
        .single();
    }

    const { data: variation, error: insertError } = await getSupabaseAdmin()
      .from('variations')
      .insert({
        shortcode,
        supervisor_name: supervisorName.trim(),
        site_name: siteName.trim(),
        site_address: siteAddress.trim(),
        client_email: clientEmail.trim().toLowerCase(),
        description: description.trim(),
        urgency,
        status: 'pending',
        submitted_ip: ip,
      })
      .select('id')
      .single();

    if (insertError || !variation) {
      console.error(insertError);
      return NextResponse.json(
        { error: 'Failed to create variation record' },
        { status: 500 }
      );
    }

    const prefix = `variations/${shortcode}`;
    const imagePaths: string[] = [];

    for (let i = 0; i < draftFiles.length; i++) {
      const draftPath = draftFiles[i]!.path;
      const ext = draftPath.split('.').pop() || 'jpg';
      const finalName = `${Date.now()}-${i}.${ext}`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalPath = `${prefix}/${finalName}`;

      const { data: blob, error: downloadError } = await getSupabaseAdmin()
        .storage
        .from(BUCKET_VARIATIONS)
        .download(draftPath);

      if (downloadError || !blob) {
        console.error(downloadError);
        return NextResponse.json(
          { error: 'Failed to copy draft images' },
          { status: 500 }
        );
      }

      const { error: uploadError } = await getSupabaseAdmin().storage
        .from(BUCKET_VARIATIONS)
        .upload(finalPath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        return NextResponse.json(
          { error: 'Failed to save images' },
          { status: 500 }
        );
      }
      imagePaths.push(finalPath);
    }

    const { error: imgInsertError } = await getSupabaseAdmin()
      .from('variation_images')
      .insert(
        imagePaths.map((image_path) => ({
          variation_id: variation.id,
          image_path,
        }))
      );
    if (imgInsertError) {
      console.error(imgInsertError);
      return NextResponse.json(
        { error: 'Failed to save image records' },
        { status: 500 }
      );
    }

    const pathsToRemove = draftFiles.map((f) => f.path);
    await getSupabaseAdmin().storage.from(BUCKET_VARIATIONS).remove(pathsToRemove);
    await getSupabaseAdmin().from('variation_draft_files').delete().eq('draft_id', draftId);
    await getSupabaseAdmin().from('variation_drafts').delete().eq('id', draftId);

    const viewLink = getViewLink(shortcode);
    await sendClientVariationEmail({
      clientEmail: clientEmail.trim().toLowerCase(),
      siteName: siteName.trim(),
      shortcode,
      description: description.trim(),
      urgency,
      viewLink,
    });

    return NextResponse.json({
      success: true,
      shortcode,
      redirect: `/submitted?shortcode=${shortcode}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
