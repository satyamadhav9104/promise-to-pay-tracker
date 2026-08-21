import React from 'react';

const STATUS_CONFIG = {
  created: { label: 'Created', color: 'bg-gray-800 text-gray-300 border-gray-700' },
  due_soon: { label: 'Due Soon', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  overdue: { label: 'Overdue', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  promise_made: { label: 'Promise Made', color: 'bg-purple-950 text-purple-300 border-purple-800' },
  promise_due: { label: 'Promise Due', color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
  pending_verification: { label: 'Pending Verification', color: 'bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse' },
  escalated: { label: 'Escalated (Human)', color: 'bg-red-950 text-red-300 border-red-800' },
  paid: { label: 'Paid', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  written_off: { label: 'Written Off', color: 'bg-gray-900 text-gray-500 border-gray-800' }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-800 text-gray-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
      {config.label}
    </span>
  );
}
