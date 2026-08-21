import React from 'react';

const STATUS_CONFIG = {
  created: { label: 'Created', color: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500' },
  due_soon: { label: 'Due Soon', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  overdue: { label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  promise_made: { label: 'Promise Made', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  promise_due: { label: 'Promise Due', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  pending_verification: { label: 'Pending Verification', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse' },
  escalated: { label: 'Escalated (Human)', color: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-600' },
  paid: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  written_off: { label: 'Written Off', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
