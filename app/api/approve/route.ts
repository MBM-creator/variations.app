import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getClientIp } from '@/lib/get-client-ip';
import {
  sendSteveApprovedEmail,
  getAdminLink,
  type Urgency,
} from '@/lib/emails';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const shortcode = body?.shortcode?.trim();
    if (!shortcode) {
      return NextResponse.json({ error: 'Missing shortcode' }, { status: 400 });
    }

    const { data: row, error: fetchError } = await getSupabaseAdmin()
      .from('variations')
      .select('id, site_name, supervisor_name, description, urgency, status')
      .eq('shortcode', shortcode)
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

    if (row.urgency === 'same_day') {
      if (body?.acknowledgedSameDayFee !== true) {
        return NextResponse.json(
          { error: 'You must acknowledge the same day variation fee before approving.' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await getSupabaseAdmin()
      .from('variations')
      .update({
        status: 'approved',
        approval_timestamp: now,
        approval_ip: ip,
      })
      .eq('id', row.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json(
        { error: 'Failed to update variation' },
        { status: 500 }
      );
    }

    const { count } = await getSupabaseAdmin()
      .from('variation_images')
      .select('*', { count: 'exact', head: true })
      .eq('variation_id', row.id);
    const imageCount = count ?? 0;

    await sendSteveApprovedEmail({
      siteName: row.site_name,
      shortcode,
      description: row.description,
      urgency: row.urgency as Urgency,
      supervisorName: row.supervisor_name,
      approvalTimestamp: now,
      approvalIp: ip,
      adminLink: getAdminLink(shortcode),
      imageCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Variation approved. Steve has been notified.',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
