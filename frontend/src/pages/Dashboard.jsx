import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Handshake,
  ShieldCheck,
  Inbox,
  Zap,
  Plus,
  Bell,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  Radio
} from 'lucide-react';
import { fetchInvoices, fetchMetrics, fetchSettings, triggerSchedulerTick } from '../api/client';
import InvoiceList from '../components/InvoiceList';
import CreateInvoiceModal from '../components/CreateInvoiceModal';

/** Plain words for the reasons the engine gives for not acting. */
const BLOCK_REASON_WORDS = {
  cooldown_active: 'still in cooldown',
  max_touches_reached: 'hit the touch cap',
  pending_verification_pause: 'awaiting payment verification',
  active_promise_pause: 'promise date not reached',
  no_promise_detected: 'no promise in the reply'
};

const describeBlockReason = (key) =>
  BLOCK_REASON_WORDS[key] || String(key || '').replace(/_/g, ' ');

/** "34 held back: 20 still in cooldown, 8 hit the touch cap" */
function topBlockReasons(breakdown, limit = 2) {
  const entries = Object.entries(breakdown || {}).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => `${count} ${describeBlockReason(key)}`)
    .join(' · ');
}

export default function Dashboard({ onOpenAddInvoice, onOpenBulkImport, onOpenAICopilot, onNotify, maxTouches = 3 }) {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickLoading, setTickLoading] = useState(false);
  const [liveEvent, setLiveEvent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Only the very first load shows a spinner; the 30s poll refreshes silently.
  const hasLoadedOnce = useRef(false);
  // Lets the poll notice an invoice that flipped to paid between two passes.
  const paidIdsRef = useRef(null);

  const currencyCode = localStorage.getItem('smartinvoice_currency') || 'INR';
  const currencySymbol =
    currencyCode === 'INR' ? '₹' : currencyCode === 'EUR' ? '€' : currencyCode === 'GBP' ? '£' : '$';

  const formatMoney = (value) =>
    `${currencySymbol}${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const noticeNewlyPaid = (nextInvoices) => {
    const nextPaid = new Set(
      nextInvoices.filter((inv) => inv.status === 'paid').map((inv) => inv.id)
    );
    const previousPaid = paidIdsRef.current;
    paidIdsRef.current = nextPaid;
    if (!previousPaid) return; // first pass: nothing to compare against

    const fresh = [...nextPaid].filter((id) => !previousPaid.has(id));
    if (fresh.length === 0) return;

    setLiveEvent({
      kind: 'payment',
      headline:
        fresh.length === 1
          ? `Razorpay payment confirmed · ${fresh[0]} is now paid`
          : `Razorpay payments confirmed · ${fresh.length} invoices are now paid`,
      detail:
        fresh.length === 1
          ? 'The webhook was verified and the invoice moved to paid. All outbound touches for it stop here.'
          : `Now paid: ${fresh.join(', ')}. All outbound touches for these invoices stop here.`
    });
  };

  const loadData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [invData, metData] = await Promise.all([fetchInvoices(), fetchMetrics()]);
      setInvoices(invData);
      setMetrics(metData);
      setError(null);
      noticeNewlyPaid(invData);
    } catch (err) {
      setError(err);
    } finally {
      hasLoadedOnce.current = true;
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // The sweep description quotes the configured guardrails, so the copy can
    // never disagree with what the engine enforces.
    fetchSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
    const interval = setInterval(() => {
      loadData({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRunSweep = async () => {
    setTickLoading(true);
    setLiveEvent(null);
    try {
      const res = await triggerSchedulerTick();
      const results = Array.isArray(res.results) ? res.results : [];
      const evaluated = res.processed_count ?? results.length;
      const heldBack = results.filter((r) => r.action === 'no_op').length;
      const sent = results.length - heldBack;

      const reasonCounts = results
        .filter((r) => r.action === 'no_op' && r.reason)
        .reduce((acc, r) => {
          acc[r.reason] = (acc[r.reason] || 0) + 1;
          return acc;
        }, {});
      const reasons = topBlockReasons(reasonCounts, 3);

      setLiveEvent({
        kind: 'sweep',
        headline: results.length
          ? `Sweep evaluated ${evaluated} invoices: ${sent} touches sent, ${heldBack} held back by guardrails`
          : `Sweep evaluated ${evaluated} invoices: nothing was due for a touch`,
        detail: reasons ? `Held back because: ${reasons}.` : null
      });
      await loadData({ silent: true });
    } catch (err) {
      setLiveEvent({
        kind: 'error',
        headline: 'The recovery sweep could not run',
        detail: `${err.message} Check that the backend is running, then try again.`
      });
    } finally {
      setTickLoading(false);
    }
  };

  if (loading && !hasLoadedOnce.current) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !invoices.length) {
    return (
      <div className="m-8 bg-rose-50 text-rose-800 p-5 rounded-2xl border border-rose-200 space-y-2">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          Could not reach the backend
        </div>
        <p className="text-sm text-rose-700">{error.message}</p>
        <p className="text-sm text-rose-700">
          Start the API on port 8000, then choose Retry.
        </p>
        <button
          onClick={() => loadData()}
          className="mt-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const blocked = metrics?.blocked_breakdown || {};
  const blockedTotal = metrics?.actions_blocked_count ?? 0;
  const blockedReasons = topBlockReasons(blocked);
  const kept = metrics?.promises_kept_count ?? 0;
  const broken = metrics?.promises_broken_count ?? 0;
  const promiseTotal = kept + broken;
  const keptRate = promiseTotal > 0 ? Math.round((kept / promiseTotal) * 100) : null;
  const awaitingReview = metrics?.awaiting_review_count ?? 0;
  const paidCount = metrics?.paid_invoices_count ?? 0;
  const avgDays = metrics?.avg_days_to_recovery ?? 0;
  const openInvoices = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'written_off'
  ).length;

  return (
    <div className="space-y-8 animate-in p-4 sm:p-8 max-w-7xl mx-auto pb-24">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            What the collections agent recovered, and every time it chose to hold back.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunSweep}
            disabled={tickLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-xs shadow-indigo-200 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Zap className={`w-4 h-4 ${tickLoading ? 'animate-bounce' : ''}`} />
            {tickLoading ? 'Evaluating…' : 'Run recovery sweep'}
          </button>

          {onOpenAICopilot && (
            <button
              onClick={onOpenAICopilot}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Copilot
            </button>
          )}

          <button
            onClick={onOpenAddInvoice || (() => setIsCreateModalOpen(true))}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            New invoice
          </button>
        </div>
      </div>

      {/* Live event strip — narrates the sweep and the webhook leg */}
      {liveEvent && (
        <div
          role="status"
          className={`px-5 py-3.5 rounded-2xl text-sm flex justify-between items-start gap-4 shadow-sm animate-in border ${
            liveEvent.kind === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : liveEvent.kind === 'payment'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {liveEvent.kind === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Radio
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  liveEvent.kind === 'payment' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              />
            )}
            <div>
              <p className="font-semibold">{liveEvent.headline}</p>
              {liveEvent.detail && (
                <p
                  className={`text-xs mt-0.5 ${
                    liveEvent.kind === 'error'
                      ? 'text-rose-700'
                      : liveEvent.kind === 'payment'
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}
                >
                  {liveEvent.detail}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setLiveEvent(null)}
            aria-label="Dismiss"
            className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Four metric cards, all read from GET /api/invoices/metrics/summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Recovered */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">Recovered</p>
              <h3 className="text-3xl font-bold text-gray-900 truncate">
                {metrics ? formatMoney(metrics.total_recovered_amount) : '—'}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 shrink-0">
              <Wallet className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {!metrics
              ? 'Loading…'
              : paidCount === 0
              ? 'Nothing collected yet'
              : `${paidCount} invoice${paidCount === 1 ? '' : 's'} · avg ${avgDays} days to pay`}
          </p>
        </div>

        {/* Promises kept */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">Promises kept</p>
              <h3 className="text-3xl font-bold text-gray-900">
                {metrics ? `${kept} kept` : '—'}
                {metrics && (
                  <span className="text-xl font-semibold text-gray-400"> · {broken} broken</span>
                )}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 shrink-0">
              <Handshake className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {!metrics
              ? 'Loading…'
              : keptRate === null
              ? 'No promises recorded yet'
              : `${keptRate}% of promises were kept`}
          </p>
        </div>

        {/* Actions blocked by guardrails — the restraint card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-amber-200 ring-1 ring-amber-100 hover:shadow-lg transition-shadow relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-amber-400" aria-hidden="true"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Actions blocked by guardrails
              </p>
              <h3 className="text-3xl font-bold text-gray-900">
                {metrics ? blockedTotal : '—'}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-amber-800">
            {!metrics
              ? 'Loading…'
              : blockedReasons
              ? blockedReasons
              : 'No touches have been held back yet'}
          </p>
        </div>

        {/* Awaiting your review */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">Awaiting your review</p>
              <h3 className="text-3xl font-bold text-gray-900">{metrics ? awaitingReview : '—'}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 shrink-0">
              <Inbox className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {!metrics
              ? 'Loading…'
              : awaitingReview === 0
              ? 'Nothing needs a human right now'
              : 'Low-confidence promises need a human'}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Invoices (2 Cols) + Quick Actions / Automate (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Recent invoices</h2>
              <button
                onClick={() => loadData()}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-1"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="p-0">
              <InvoiceList
                invoices={invoices}
                onRefresh={() => loadData({ silent: true })}
                onNotify={onNotify}
                onSeeded={(count) =>
                  setLiveEvent({
                    kind: 'sweep',
                    headline: `Loaded ${count} demo invoices`,
                    detail: 'Run a recovery sweep to see the agent decide which ones to chase.'
                  })
                }
                onCreateInvoice={onOpenAddInvoice || (() => setIsCreateModalOpen(true))}
                maxTouches={maxTouches}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleRunSweep}
                disabled={tickLoading}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Run recovery sweep
                </span>
                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-lg text-xs font-semibold">
                  {openInvoices} open
                </span>
              </button>

              <button
                onClick={onOpenAddInvoice || (() => setIsCreateModalOpen(true))}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  New invoice
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={() => loadData()}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Refresh
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
              </button>
            </div>
          </div>

          {/* How the sweep works */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Zap className="w-24 h-24" />
            </div>
            <h3 className="text-lg font-semibold mb-2 relative z-10">How the sweep works</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">
              Each sweep checks every open invoice against the stopping rules —{' '}
              {settings
                ? `a ${settings.max_touches_per_invoice}-touch cap, a ${settings.cooldown_days_between_touches}-day cooldown`
                : 'a touch cap, a cooldown between touches'}
              , and a pause whenever a customer claims they have paid — then sends a reminder only
              where all three allow it. Every skip is logged with its reason.
            </p>
            <button
              onClick={handleRunSweep}
              disabled={tickLoading}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm w-full hover:bg-indigo-50 transition-colors shadow-sm relative z-10 cursor-pointer disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {tickLoading ? 'Evaluating…' : 'Run recovery sweep'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
