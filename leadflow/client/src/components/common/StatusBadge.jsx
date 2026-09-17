import React from 'react';

const LEAD_STATUS_CONFIG = {
  NEW: { label: 'New Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONTACTED: { label: 'Contacted', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  REPLIED: { label: 'Replied', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INTERESTED: { label: 'Interested', bg: 'bg-green-50 text-green-700 border-green-200 font-semibold' },
  NOT_INTERESTED: { label: 'Not Interested', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  CONVERTED: { label: 'Converted', bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' },
  ARCHIVED: { label: 'Archived', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const EMAIL_STATUS_CONFIG = {
  NOT_SENT: { label: 'Not Sent', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  SENT: { label: 'Sent', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  FAILED: { label: 'Failed', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  FOLLOW_UP_DUE: { label: 'Follow-up Due', bg: 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse' },
  FOLLOW_UP_SENT: { label: 'Follow-up Sent', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export default function StatusBadge({ type = 'lead', value }) {
  if (!value) return null;

  const config =
    type === 'email'
      ? EMAIL_STATUS_CONFIG[value] || { label: value, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
      : LEAD_STATUS_CONFIG[value] || { label: value, bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      {config.label}
    </span>
  );
}

