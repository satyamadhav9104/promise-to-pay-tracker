import React from 'react';

export default function AuditTrail({ logs = [] }) {
  if (!logs.length) {
    return <div className="text-gray-500 italic text-sm py-2">No audit logs recorded yet.</div>;
  }

  return (
    <div className="space-y-3 py-2">
      <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">
        Audit Trail & Decision Evidence
      </h4>
      <div className="border-l-2 border-gray-700 pl-4 space-y-3">
        {logs.map((log) => {
          const isBlocked = Boolean(log.rule_that_blocked);
          const formattedTime = new Date(log.timestamp).toLocaleString();

          return (
            <div key={log.id} className="bg-gray-800/60 p-3 rounded-lg text-sm border border-gray-700/50">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="font-mono text-gray-300">{formattedTime}</span>
                <span className="capitalize px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-mono text-[10px]">
                  {log.actor} • {log.trigger}
                </span>
              </div>

              <div className="flex items-start gap-2 mt-1">
                {isBlocked ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                    BLOCKED: {log.rule_that_blocked}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    ACTION: {log.action_taken}
                  </span>
                )}
                <span className="text-xs text-gray-400 font-mono self-center">
                  [Rule: {log.rule_applied}]
                </span>
              </div>

              {log.detail && (
                <p className="mt-2 text-xs text-gray-300 bg-gray-900/50 p-2 rounded border border-gray-800 font-sans">
                  {log.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
