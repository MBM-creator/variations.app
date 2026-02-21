import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-800">Page not found</h1>
      <p className="mt-2 text-slate-600">
        This variation link may be invalid or expired.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
      >
        Submit a variation
      </Link>
    </div>
  );
}
