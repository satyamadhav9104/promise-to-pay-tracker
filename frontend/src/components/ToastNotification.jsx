import React from 'react';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, X } from 'lucide-react';

/**
 * Four outcomes, not two. A collections agent that *declines* to act is doing its
 * job, so "withheld by a guardrail" gets its own amber treatment rather than being
 * reported as either a success or an error.
 *
 * toast: { message: string, type: 'success' | 'warning' | 'error' | 'info' }
 */
const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    shell: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-50',
    icon: 'text-emerald-400'
  },
  warning: {
    Icon: ShieldCheck,
    shell: 'bg-amber-950/90 border-amber-500/40 text-amber-50',
    icon: 'text-amber-400'
  },
  error: {
    Icon: AlertCircle,
    shell: 'bg-rose-950/90 border-rose-500/30 text-rose-50',
    icon: 'text-rose-400'
  },
  info: {
    Icon: Info,
    shell: 'bg-slate-900/90 border-slate-700 text-slate-100',
    icon: 'text-indigo-400'
  }
};

export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const { Icon, shell, icon } = VARIANTS[toast.type] || VARIANTS.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md max-w-md ${shell}`}>
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${icon}`} />

        <div className="text-sm font-medium pr-2 leading-relaxed">
          {toast.message}
        </div>

        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
