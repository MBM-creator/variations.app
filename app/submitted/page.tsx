import Link from 'next/link';

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ shortcode?: string }>;
}) {
  const { shortcode } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-xl border border-green-200 bg-green-50 p-8">
        <h1 className="text-xl font-semibold text-green-800">
          Variation request submitted
        </h1>
        <p className="mt-2 text-slate-600">
          The client will receive an email with a secure link to approve,
          request edits, or decline.
        </p>
        {shortcode && (
          <p className="mt-4 text-sm text-slate-500">
            Reference: <code className="font-mono">{shortcode}</code>
          </p>
        )}
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
        >
          Submit another
        </Link>
      </div>
    </div>
  );
}
