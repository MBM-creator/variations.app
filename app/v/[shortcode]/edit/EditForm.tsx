'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function EditForm({
  shortcode,
  currentDescription,
}: {
  shortcode: string;
  currentDescription: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('shortcode', shortcode);
    files.forEach((f) => formData.append('photos', f));

    setSubmitting(true);
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Submission failed');
        return;
      }
      router.push(`/v/${shortcode}?edited=1`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 10));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          Description (editable) *
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={currentDescription}
          rows={4}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label
          htmlFor="edit_notes"
          className="block text-sm font-medium text-slate-700"
        >
          Edit notes (required) *
        </label>
        <textarea
          id="edit_notes"
          name="edit_notes"
          placeholder="Explain what changes you need..."
          rows={3}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Additional photos (optional)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onFileChange}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-medium file:text-green-700"
        />
        {files.length > 0 && (
          <p className="mt-1 text-sm text-slate-500">
            {files.length} file(s) selected
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit edit request'}
        </button>
        <a
          href={`/v/${shortcode}`}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
