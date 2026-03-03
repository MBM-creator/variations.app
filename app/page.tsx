'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

const URGENCIES = [
  { value: 'same_day', label: 'Same day' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'cannot_proceed', label: 'Cannot proceed until approved' },
] as const;

const MAX_PHOTOS = 10;
const COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.82,
} as const;

const SAFARI_ERROR_PATTERNS = [
  'expected pattern',
  'did not match',
  'pattern',
  'match',
  'InvalidStateError',
  'EncodingError',
];

function isSafariStyleError(message: string): boolean {
  const lower = message.toLowerCase();
  return SAFARI_ERROR_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export default function SubmitPage() {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { path: string; preview: string }[]
  >([]);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftIdRef = useRef<string | null>(null);

  const ensureDraft = useCallback(async (): Promise<string> => {
    if (draftIdRef.current) return draftIdRef.current;
    if (draftId) {
      draftIdRef.current = draftId;
      return draftId;
    }
    const res = await fetch('/api/draft', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to create draft');
    const id = data.draftId as string;
    draftIdRef.current = id;
    setDraftId(id);
    return id;
  }, [draftId]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = '';

    if (selected.length + uploadedPhotos.length > MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    setUploadError(null);
    setError(null);

    const total = uploadedPhotos.length + selected.length;
    let done = 0;

    for (let i = 0; i < selected.length; i++) {
      setUploadProgress({ current: done + 1, total });
      const file = selected[i]!;
      let compressed: File;
      try {
        compressed = await imageCompression(file, COMPRESS_OPTIONS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setUploadError(
          isSafariStyleError(msg)
            ? 'Could not process photos. Try fewer or different images, or refresh.'
            : msg
        );
        setUploadProgress(null);
        return;
      }

      let id: string;
      try {
        id = await ensureDraft();
      } catch {
        setUploadError('Failed to create draft. Please try again.');
        setUploadProgress(null);
        return;
      }

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch(`/api/draft/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error ??
          (isSafariStyleError(String(data)) ? 'Could not process photos. Try fewer or different images, or refresh.' : 'Upload failed.');
        setUploadError(msg);
        setUploadProgress(null);
        return;
      }

      const path = data.path as string;
      const preview = URL.createObjectURL(compressed);
      setUploadedPhotos((prev) => [...prev, { path, preview }]);
      done++;
    }

    setUploadProgress(null);
  }

  async function removePhoto(photo: { path: string; preview: string }) {
    if (!draftId) return;
    const res = await fetch(`/api/draft/${draftId}/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: photo.path }),
    });
    if (!res.ok) return;
    URL.revokeObjectURL(photo.preview);
    setUploadedPhotos((prev) => prev.filter((p) => p.path !== photo.path));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (uploadedPhotos.length < 1) {
      setError('Please upload between 1 and 10 photos.');
      return;
    }
    if (!draftId) {
      setError('Missing draft. Please add photos again.');
      return;
    }

    const form = e.currentTarget;
    const supervisor_name = (form.elements.namedItem('supervisor_name') as HTMLInputElement).value.trim();
    const site_name = (form.elements.namedItem('site_name') as HTMLInputElement).value.trim();
    const site_address = (form.elements.namedItem('site_address') as HTMLInputElement).value.trim();
    const client_email = (form.elements.namedItem('client_email') as HTMLInputElement).value.trim().toLowerCase();
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim();
    const urgency = (form.elements.namedItem('urgency') as HTMLSelectElement).value;

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          supervisor_name,
          site_name,
          site_address,
          client_email,
          description,
          urgency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Submission failed');
        return;
      }
      router.push(data.redirect ?? `/submitted?shortcode=${data.shortcode}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = uploadedPhotos.length >= 1 && !uploadProgress && !submitting;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-green-800">
        Submit a variation request
      </h1>
      <p className="mt-1 text-slate-600">
        Complete the form below. The client will receive an email with a secure
        link to approve, request edits, or decline.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {(error || uploadError) && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error ?? uploadError}
          </div>
        )}

        <div>
          <label
            htmlFor="supervisor_name"
            className="block text-sm font-medium text-slate-700"
          >
            Supervisor name *
          </label>
          <input
            id="supervisor_name"
            name="supervisor_name"
            type="text"
            autoComplete="name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="site_name"
            className="block text-sm font-medium text-slate-700"
          >
            Site name *
          </label>
          <input
            id="site_name"
            name="site_name"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="site_address"
            className="block text-sm font-medium text-slate-700"
          >
            Site address *
          </label>
          <input
            id="site_address"
            name="site_address"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="client_email"
            className="block text-sm font-medium text-slate-700"
          >
            Client email *
          </label>
          <input
            id="client_email"
            name="client_email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700"
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="urgency"
            className="block text-sm font-medium text-slate-700"
          >
            Urgency *
          </label>
          <select
            id="urgency"
            name="urgency"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            {URGENCIES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Upload photos (1–10 required) *
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={onFileChange}
            disabled={!!uploadProgress || uploadedPhotos.length >= MAX_PHOTOS}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-medium file:text-green-700 file:outline-none disabled:opacity-50"
          />
          {uploadProgress && (
            <p className="mt-2 text-sm text-slate-600">
              Uploading {uploadProgress.current} of {uploadProgress.total}
            </p>
          )}
          {uploadedPhotos.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {uploadedPhotos.map((photo) => (
                <div
                  key={photo.path}
                  className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                >
                  <img
                    src={photo.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo)}
                    className="absolute right-1 top-1 rounded bg-red-600 px-2 py-0.5 text-xs text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG, WebP or GIF. Photos are compressed and uploaded one at a
            time (max 10).
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit variation request'}
        </button>
      </form>
    </div>
  );
}
