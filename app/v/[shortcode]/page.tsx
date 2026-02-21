import { notFound } from 'next/navigation';
import { getSupabaseAdmin, BUCKET_VARIATIONS } from '@/lib/supabase';
import { ClientView } from './ClientView';
import type { Variation, VariationImage, Urgency } from '@/lib/types';

const URGENCY_LABELS: Record<Urgency, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  cannot_proceed: 'Cannot proceed until approved',
};

async function getVariationAndImages(
  shortcode: string
): Promise<{ variation: Variation; images: VariationImage[]; signedUrls: { path: string; url: string }[] } | null> {
  const { data: variation, error: vErr } = await getSupabaseAdmin()
    .from('variations')
    .select('*')
    .eq('shortcode', shortcode)
    .single();

  if (vErr || !variation) return null;

  const { data: images } = await getSupabaseAdmin()
    .from('variation_images')
    .select('*')
    .eq('variation_id', variation.id)
    .order('created_at');

  const paths = (images ?? []).map((img: VariationImage) => img.image_path);
  const signedUrls: { path: string; url: string }[] = [];
  for (const path of paths) {
    const { data: signed } = await getSupabaseAdmin().storage
      .from(BUCKET_VARIATIONS)
      .createSignedUrl(path, 3600);
    if (signed?.signedUrl) signedUrls.push({ path, url: signed.signedUrl });
  }

  return {
    variation: variation as Variation,
    images: (images ?? []) as VariationImage[],
    signedUrls,
  };
}

export default async function VariationViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ shortcode: string }>;
  searchParams: Promise<{ edited?: string }>;
}) {
  const { shortcode } = await params;
  const { edited } = await searchParams;
  const data = await getVariationAndImages(shortcode);
  if (!data) notFound();

  const { variation, signedUrls } = data;
  const submittedAt = new Date(variation.submitted_at).toLocaleString(
    'en-AU',
    { dateStyle: 'medium', timeStyle: 'short' }
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {edited === '1' && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Your edit request has been sent. Steve has been notified and will review.
        </div>
      )}
      <h1 className="text-2xl font-semibold text-green-800">
        Variation request – {variation.site_name}
      </h1>
      <p className="mt-1 text-slate-600">
        Submitted by {variation.supervisor_name} on {submittedAt}
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <span className="text-sm font-medium text-slate-500">Description</span>
          <p className="mt-1 whitespace-pre-wrap text-slate-800">
            {variation.description}
          </p>
        </div>
        <div>
          <span className="text-sm font-medium text-slate-500">Urgency</span>
          <p className="mt-1">
            {URGENCY_LABELS[variation.urgency as Urgency] ?? variation.urgency}
          </p>
        </div>
      </div>

      {signedUrls.length > 0 && (
        <div className="mt-6">
          <span className="text-sm font-medium text-slate-500">Photos</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {signedUrls.map(({ path, url }) => (
              <a
                key={path}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-slate-200"
              >
                <img
                  src={url}
                  alt="Variation"
                  className="h-32 w-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {variation.status === 'pending' && (
        <ClientView shortcode={shortcode} />
      )}

      {variation.status !== 'pending' && (
        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-600">
          This variation has been{' '}
          <span className="font-medium capitalize">{variation.status}</span>.
        </div>
      )}
    </div>
  );
}
