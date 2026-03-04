'use client';

import { useState } from 'react';
import type { Urgency } from '@/lib/types';

const SAME_DAY_ACK_TEXT =
  'I acknowledge this variation requires additional or different materials to allow work to proceed and will incur a same day variation fee of $500. This fee will be in addition to any additional materials or labour required to complete the variation.';

export function ClientView({
  shortcode,
  urgency,
}: {
  shortcode: string;
  urgency: Urgency;
}) {
  const [action, setAction] = useState<'idle' | 'approve' | 'edit' | 'decline'>(
    'idle'
  );
  const [loading, setLoading] = useState(false);
  const [acknowledgedSameDayFee, setAcknowledgedSameDayFee] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const isSameDay = urgency === 'same_day';
  const canApprove = !isSameDay || acknowledgedSameDayFee;
  const canRequestEdit = !isSameDay || acknowledgedSameDayFee;

  async function handleApprove() {
    setAction('approve');
    setLoading(true);
    setMessage(null);
    try {
      const body: { shortcode: string; acknowledgedSameDayFee?: boolean } = {
        shortcode,
      };
      if (isSameDay) body.acknowledgedSameDayFee = true;
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      {isSameDay && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <label className="flex cursor-pointer gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={acknowledgedSameDayFee}
              onChange={(e) => setAcknowledgedSameDayFee(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <span>{SAME_DAY_ACK_TEXT}</span>
          </label>
          {!acknowledgedSameDayFee && (
            <p className="mt-2 text-xs text-amber-800">
              Please acknowledge the same day fee above to approve or request edits.
            </p>
          )}
        </div>
      )}
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
          disabled={loading || !canApprove}
          className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading && action === 'approve' ? 'Approving…' : 'Approve variation'}
        </button>
        <a
          href={loading || !canRequestEdit ? '#' : `/v/${shortcode}/edit`}
          className={`rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 ${
            loading || !canRequestEdit ? 'pointer-events-none opacity-60' : 'hover:bg-slate-50'
          }`}
          aria-disabled={loading || !canRequestEdit}
          onClick={loading || !canRequestEdit ? (e) => e.preventDefault() : undefined}
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
