'use client';

import { useState } from 'react';

export function ClientView({ shortcode }: { shortcode: string }) {
  const [action, setAction] = useState<'idle' | 'approve' | 'edit' | 'decline'>(
    'idle'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleApprove() {
    setAction('approve');
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'ok', text: data.message ?? 'Approved.' });
        window.location.reload();
      } else {
        setMessage({ type: 'err', text: data.error ?? 'Failed' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this variation?')) return;
    setAction('decline');
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'ok', text: data.message ?? 'Declined.' });
        window.location.reload();
      } else {
        setMessage({ type: 'err', text: data.error ?? 'Failed' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <p className="text-sm font-medium text-slate-700">
        Please approve, request edits, or decline:
      </p>
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading && action === 'approve' ? 'Approving…' : 'Approve variation'}
        </button>
        <a
          href={loading ? '#' : `/v/${shortcode}/edit`}
          className={`rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 ${
            loading ? 'pointer-events-none opacity-60' : 'hover:bg-slate-50'
          }`}
          aria-disabled={loading}
          onClick={loading ? (e) => e.preventDefault() : undefined}
        >
          Request edit
        </a>
        <button
          type="button"
          onClick={handleDecline}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {loading && action === 'decline' ? 'Declining…' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
