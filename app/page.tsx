'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const URGENCIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'cannot_proceed', label: 'Cannot proceed until approved' },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function SubmitPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    files.forEach((f) => formData.append('photos', f));

    if (files.length < 1 || files.length > 10) {
      setError('Please upload between 1 and 10 photos.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const tooBig = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setError(`"${tooBig.name}" is over 5MB. Please choose a smaller file.`);
      return;
    }
    if (selected.length + files.length > 10) {
      setError('Maximum 10 photos allowed.');
      return;
    }
    setFiles((prev) => [...prev, ...selected].slice(0, 10));
    setError(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-green-800">
        Submit a variation request
      </h1>
      <p className="mt-1 text-slate-600">
        Complete the form below. The client will receive an email with a secure
        link to approve, request edits, or decline.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6"
      >
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
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:font-medium file:text-green-700 file:outline-none"
          />
          {files.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG, WebP or GIF. Max 5MB per file.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || files.length < 1}
          className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit variation request'}
        </button>
      </form>
    </div>
  );
}
