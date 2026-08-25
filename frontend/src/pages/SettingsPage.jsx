import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Webhook,
  Copy,
  Check
} from 'lucide-react';
import { fetchSettings, updateSettings } from '../api/client';

export default function SettingsPage({ onNotify }) {
  // Company Profile
  const [companyName, setCompanyName] = useState(
    () => localStorage.getItem('smartinvoice_company_name') || 'Acme Enterprises'
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('smartinvoice_currency') || 'INR'
  );
  const [supportEmail, setSupportEmail] = useState(
    () => localStorage.getItem('smartinvoice_support_email') || 'billing@acme.com'
  );
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    () => localStorage.getItem('smartinvoice_payment_terms') || 'net30'
  );

  // Safety guardrails — these live on the backend, because the recovery engine
  // is what enforces them. Sliders start empty until the real values arrive.
  const [maxTouches, setMaxTouches] = useState(null);
  const [cooldownDays, setCooldownDays] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [saved, setSaved] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const applySettings = (data) => {
    setMaxTouches(data.max_touches_per_invoice);
    setCooldownDays(data.cooldown_days_between_touches);
    setConfidenceThreshold(data.promise_confidence_threshold);
  };

  const loadGuardrails = async () => {
    setLoadingSettings(true);
    try {
      applySettings(await fetchSettings());
      setSettingsError(null);
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadGuardrails();
  }, []);

  const webhookUrl = `${window.location.origin}/api/webhooks/razorpay`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Branding stays on this device — the backend has no concept of it.
    localStorage.setItem('smartinvoice_company_name', companyName);
    localStorage.setItem('smartinvoice_currency', currency);
    localStorage.setItem('smartinvoice_support_email', supportEmail);
    localStorage.setItem('smartinvoice_payment_terms', defaultPaymentTerms);

    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      if (maxTouches === null) {
        // Guardrails never loaded, so there is nothing safe to send back.
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
        return;
      }
      const updated = await updateSettings({
        max_touches_per_invoice: maxTouches,
        cooldown_days_between_touches: cooldownDays,
        promise_confidence_threshold: confidenceThreshold
      });
      applySettings(updated);
      setSaved(true);
      if (onNotify) {
        onNotify(
          `Guardrails saved: stop after ${updated.max_touches_per_invoice} touches, ` +
            `wait ${updated.cooldown_days_between_touches} days between touches, ` +
            `ask a human below ${Math.round(updated.promise_confidence_threshold * 100)}% confidence.`
        );
      }
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const guardrailsReady = !loadingSettings && !settingsError && maxTouches !== null;

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organization & System Settings</h1>
        <p className="text-gray-500 mt-1">Configure your B2B workspace profile, currencies, business guardrails, and integrations.</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {guardrailsReady
            ? 'Saved. The recovery engine will use these guardrails on the next sweep.'
            : 'Company details saved on this device.'}
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-sm flex items-start gap-2 shadow-xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold">Guardrails were not saved.</strong> {saveError} Your
            company details were still saved on this device.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Organization & Guardrails */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                Company & Billing Profile
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Branding information included in automated customer emails and payment links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Primary Operating Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="INR">INR (₹) - Indian Rupee (Razorpay Standard)</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Billing & Collections Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Default Payment Terms
                </label>
                <select
                  value={defaultPaymentTerms}
                  onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="net15">Net 15 Days</option>
                  <option value="net30">Net 30 Days (Standard)</option>
                  <option value="net60">Net 60 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guardrail Rules Settings Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                Escalation & Safety Guardrails
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                These are the limits the recovery agent will not cross. They are stored on the
                server and applied on every sweep.
              </p>
            </div>

            {loadingSettings && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Loading the current guardrails…
              </div>
            )}

            {settingsError && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-rose-900">
                    Could not load the guardrails
                  </p>
                  <p className="text-xs text-rose-800/90 mt-0.5">{settingsError}</p>
                  <p className="text-xs text-rose-700/80 mt-1">
                    Check that the backend is running on port 8000, then try again.
                  </p>
                  <button
                    type="button"
                    onClick={loadGuardrails}
                    className="mt-3 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {guardrailsReady && (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Stop after this many touches
                  </label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {maxTouches} touches
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={maxTouches}
                  onChange={(e) => setMaxTouches(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Once an invoice has had {maxTouches} touches the agent stops chasing it and hands
                  it to a human.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Quiet days between touches
                  </label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {cooldownDays} days
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={cooldownDays}
                  onChange={(e) => setCooldownDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  The agent waits at least {cooldownDays} days after a touch before sending another
                  one, so a customer never gets chased twice in a row.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Ask a human below this confidence
                  </label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {Math.round(confidenceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  step="0.05"
                  min="0.5"
                  max="0.95"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0.5)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  A promise read from a customer reply is only accepted on its own above{' '}
                  {Math.round(confidenceThreshold * 100)}% confidence. Anything less waits for your
                  approval.
                </p>
              </div>
            </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || loadingSettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save settings'}
              </button>
              {!guardrailsReady && !loadingSettings && (
                <p className="text-xs text-gray-400 mt-2">
                  Saving now stores your company details on this device only — the guardrails could
                  not be reached.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Webhook & Integration Status */}
        <div className="space-y-6">
          {/* Webhook Configuration Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Webhook className="w-5 h-5 text-indigo-600" />
              Razorpay Webhook Endpoint
            </h3>
            <p className="text-xs text-gray-500">
              Configure this endpoint in your Razorpay Dashboard for instantaneous payment capture.
            </p>

            <div className="space-y-2">
              <div className="p-2.5 bg-slate-900 text-indigo-300 rounded-xl text-xs font-mono break-all flex items-center justify-between gap-2 border border-slate-800">
                <span>{webhookUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition"
                  title="Copy Webhook URL"
                >
                  {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Events: <code>payment.captured</code>, <code>payment.authorized</code></span>
              </div>
            </div>
          </div>

          {/* Integration Status Panel */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              SaaS Integrations Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <div className="font-bold text-gray-800">Clerk Authentication</div>
                  <div className="text-[10px] text-gray-400">JWT & JWKS Protected</div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <div className="font-bold text-gray-800">Razorpay Payments</div>
                  <div className="text-[10px] text-gray-400">HMAC-SHA256 Idempotent</div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <div className="font-bold text-gray-800">Email Delivery</div>
                  <div className="text-[10px] text-gray-400">Resend & SMTP Ready</div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  Enabled
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <div className="font-bold text-gray-800">Google Gemini LLM</div>
                  <div className="text-[10px] text-gray-400">Flash 2.5 + Fallback Parser</div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

