import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, BUCKET_VARIATIONS } from '@/lib/supabase';
import { generateShortcode } from '@/lib/shortcode';
import { getClientIp } from '@/lib/get-client-ip';
import {
  sendClientVariationEmail,
  getViewLink,
  type Urgency,
} from '@/lib/emails';

const URGENCY_VALUES: Urgency[] = ['low', 'medium', 'high', 'cannot_proceed'];
const MIN_IMAGES = 1;
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const formData = await request.formData();

    const supervisorName = formData.get('supervisor_name') as string;
    const siteName = formData.get('site_name') as string;
    const siteAddress = formData.get('site_address') as string;
    const clientEmail = formData.get('client_email') as string;
    const description = formData.get('description') as string;
    const urgencyRaw = formData.get('urgency') as string;

    if (
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

    const files = formData.getAll('photos') as File[];
    const validFiles = files.filter(
      (f) =>
        f &&
        f.size > 0 &&
        f.size <= MAX_FILE_SIZE &&
        ALLOWED_TYPES.includes(f.type)
    );
    if (validFiles.length < MIN_IMAGES || validFiles.length > MAX_IMAGES) {
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

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]!;
      const ext = file.name.split('.').pop() || 'jpg';
      const safeName = `${Date.now()}-${i}.${ext}`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${prefix}/${safeName}`;
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
          { error: 'Failed to upload one or more images' },
          { status: 500 }
        );
      }
      imagePaths.push(path);
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
