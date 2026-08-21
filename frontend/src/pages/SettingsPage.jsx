import React, { useState } from 'react';
import { Settings, ShieldCheck, Lock, Sliders, Mail, CheckCircle2, Key } from 'lucide-react';

export default function SettingsPage() {
  const [maxTouches, setMaxTouches] = useState(3);
  const [cooldownDays, setCooldownDays] = useState(4);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings & Rules</h1>
        <p className="text-gray-500 mt-1">Configure business guardrails, integrations, and stopping thresholds.</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Guardrail Rules Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Escalation & Safety Guardrails
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Hard constraints to protect customer relationships and prevent email spamming.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Maximum Touches per Invoice (Hard Cap)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxTouches}
                onChange={(e) => setMaxTouches(parseInt(e.target.value) || 3)}
                className="w-full max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-xs text-gray-400 mt-1">
                Invoices reaching this limit automatically transition to ESCALATED for human review.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Minimum Cooldown Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={cooldownDays}
                onChange={(e) => setCooldownDays(parseInt(e.target.value) || 4)}
                className="w-full max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum mandatory days between automated nudges to prevent customer harassment.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Promise Extraction Confidence Threshold
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="0.95"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0.7)}
                className="w-full max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="text-xs text-gray-400 mt-1">
                Extraction intent below {confidenceThreshold} triggers human verification.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-sm shadow-indigo-200 transition-colors"
            >
              Save Configuration
            </button>
          </form>
        </div>

        {/* Integration Status Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Integrations & Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <span className="font-semibold text-gray-700">Clerk Authentication</span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <span className="font-semibold text-gray-700">Razorpay Webhooks</span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Verified HMAC
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <span className="font-semibold text-gray-700">Email Outbound (Resend / SMTP)</span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
