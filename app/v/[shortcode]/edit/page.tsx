import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import { EditForm } from './EditForm';
import type { Variation } from '@/lib/types';

async function getVariation(shortcode: string): Promise<Variation | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('variations')
    .select('*')
    .eq('shortcode', shortcode)
    .single();
  if (error || !data) return null;
  return data as Variation;
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ shortcode: string }>;
}) {
  const { shortcode } = await params;
  const variation = await getVariation(shortcode);
  if (!variation) notFound();
  if (variation.status !== 'pending') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-600">
          This variation has already been responded to and cannot be edited.
        </p>
        <a
          href={`/v/${shortcode}`}
          className="mt-4 inline-block text-green-600 hover:underline"
        >
          Back to view
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-green-800">
        Request edit – {variation.site_name}
      </h1>
      <p className="mt-1 text-slate-600">
        Update the description and/or add photos. Edit notes are required.
      </p>
      <EditForm
        shortcode={shortcode}
        currentDescription={variation.description}
      />
    </div>
  );
}
