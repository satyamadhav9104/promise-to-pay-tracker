import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuditTrail({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-sm text-gray-500 italic py-2">No activity recorded yet.</p>;
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-4 pt-2">
      {sortedLogs.map((log, index) => {
        const isBlocked = Boolean(log.rule_that_blocked);
        const formattedTime = new Date(log.timestamp).toLocaleString();

        return (
          <div key={log.id || index} className="flex gap-4 relative">
            {index !== sortedLogs.length - 1 && (
              <div className="absolute top-6 left-[11px] bottom-[-16px] w-[2px] bg-gray-200"></div>
            )}
            
            <div className="flex-shrink-0 mt-1">
              <div className={`w-6 h-6 rounded-full bg-white border-2 ${isBlocked ? 'border-amber-200' : 'border-indigo-100'} flex items-center justify-center z-10 relative`}>
                <div className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 p-3.5 rounded-xl shadow-sm flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isBlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      BLOCKED: {log.rule_that_blocked}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {log.action_taken}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">
                    [Rule: {log.rule_applied}]
                  </span>
                </div>
                
                <span className="text-[11px] font-mono text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  {log.actor} • {log.trigger}
                </span>
              </div>

              <div className="flex items-center text-xs text-gray-500 pt-1">
                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                <span>{formattedTime}</span>
              </div>

              {log.detail && (
                <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-sans">
                  {log.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
