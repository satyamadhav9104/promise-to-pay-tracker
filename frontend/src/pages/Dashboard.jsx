import React, { useState, useEffect } from 'react';
import { fetchInvoices, fetchMetrics, triggerSchedulerTick } from '../api/client';
import InvoiceList from '../components/InvoiceList';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickLoading, setTickLoading] = useState(false);
  const [tickMessage, setTickMessage] = useState(null);

  const loadData = async () => {
    try {
      const [invData, metData] = await Promise.all([fetchInvoices(), fetchMetrics()]);
      setInvoices(invData);
      setMetrics(metData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunTick = async () => {
    setTickLoading(true);
    setTickMessage(null);
    try {
      const res = await triggerSchedulerTick();
      setTickMessage(`Scheduler cycle complete: ${res.processed_count} invoices evaluated.`);
      await loadData();
    } catch (err) {
      alert('Error triggering scheduler tick: ' + err.message);
    } finally {
      setTickLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Control Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-gray-800 via-gray-800 to-indigo-950 p-6 rounded-2xl border border-gray-700 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/80 text-indigo-300 border border-indigo-700 uppercase tracking-wide">
              Razorpay Buildathon — Track 03
            </span>
            <span className="text-xs text-gray-400 font-mono">v1.0.0</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            Promise-to-Pay Revenue Recovery
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Closed-loop B2B agent extracting payment promises, enforcing stopping rules, and verifying recovery against Razorpay webhooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTick}
            disabled={tickLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {tickLoading ? (
              <span>Running Tick Engine...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Scheduler Tick
              </>
            )}
          </button>
        </div>
      </div>

      {tickMessage && (
        <div className="bg-indigo-950/80 border border-indigo-800 text-indigo-200 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
          <span>{tickMessage}</span>
          <button onClick={() => setTickMessage(null)} className="text-indigo-400 hover:text-white font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Metrics Section (FR30) */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Recovered</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              ${metrics.total_recovered_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-gray-400 block">
              Out of ${metrics.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} batch total
            </span>
          </div>

          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Recovery Rate</span>
            <div className="text-2xl font-extrabold text-indigo-400 font-mono">
              {metrics.recovery_rate_percentage}%
            </div>
            <span className="text-xs text-gray-400 block">
              Avg Days to Recovery: {metrics.avg_days_to_recovery}d
            </span>
          </div>

          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Promises Kept vs Broken</span>
            <div className="text-2xl font-extrabold text-purple-400 font-mono">
              {metrics.promises_kept_count} / {metrics.promises_broken_count}
            </div>
            <span className="text-xs text-gray-400 block">
              Tracked payment commitments
            </span>
          </div>

          <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Human Escalations</span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {metrics.human_escalations_count}
            </div>
            <span className="text-xs text-gray-400 block">
              Max touch cap / human review queue
            </span>
          </div>
        </div>
      )}

      {/* Main Invoice List Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading invoices & audit logs...</div>
      ) : (
        <InvoiceList invoices={invoices} onRefresh={loadData} />
      )}
    </div>
  );
}
