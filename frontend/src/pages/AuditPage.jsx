import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { fetchAuditLogs, fetchSettings } from '../api/client';
import AuditTrail from '../components/AuditTrail';

const ACTOR_FILTERS = [
  { value: '', label: 'All actors' },
  { value: 'ai', label: 'AI agent' },
  { value: 'system', label: 'System' },
  { value: 'user', label: 'Human' }
];

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [actorFilter, setActorFilter] = useState('');
  const [searchInvoice, setSearchInvoice] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // The banner quotes the guardrails that are actually configured, so it can
    // never drift from what the engine enforces.
    fetchSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesActor = !actorFilter || log.actor === actorFilter;
    const invoiceId = log.invoice_id || '';
    const matchesInvoice =
      !searchInvoice || invoiceId.toLowerCase().includes(searchInvoice.toLowerCase());
    return matchesActor && matchesInvoice;
  });

  const blockedCount = filteredLogs.filter((log) => log.rule_that_blocked).length;
  const maxTouches = settings?.max_touches_per_invoice;
  const cooldownDays = settings?.cooldown_days_between_touches;

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Trail & Rules</h1>
          <p className="text-gray-500 mt-1">
            Every decision the agent made, including every decision not to act.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Rules Governance Banner */}
      <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800 space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Active guardrails
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60 text-xs">
            <span className="font-semibold text-white block mb-1">
              {maxTouches ? `Stops after ${maxTouches} touches` : 'Touch cap'}
            </span>
            <p className="text-indigo-200 text-[11px]">
              {maxTouches
                ? `After ${maxTouches} outbound touches the agent stops and hands the invoice to a human.`
                : 'The agent stops chasing after a fixed number of touches and hands the invoice to a human.'}
            </p>
          </div>
          <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60 text-xs">
            <span className="font-semibold text-white block mb-1">
              {cooldownDays ? `${cooldownDays}-day cooldown` : 'Cooldown between touches'}
            </span>
            <p className="text-indigo-200 text-[11px]">
              {cooldownDays
                ? `No reminder goes out until ${cooldownDays} days have passed since the last one.`
                : 'No reminder goes out until the quiet window since the last one has passed.'}
            </p>
          </div>
          <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60 text-xs">
            <span className="font-semibold text-white block mb-1">Stops on verified payment</span>
            <p className="text-indigo-200 text-[11px]">
              A Razorpay payment event closes the invoice and ends all chasing immediately.
            </p>
          </div>
        </div>
        {!settings && (
          <p className="text-[11px] text-indigo-300/80 pt-1">
            Showing the rules in general terms — the exact values could not be read from the server.
          </p>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by invoice ID..."
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Actor:</span>
          {ACTOR_FILTERS.map((actor) => (
            <button
              key={actor.value || 'all'}
              onClick={() => setActorFilter(actor.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                actorFilter === actor.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {actor.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {error ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-3">Could not load the audit trail</p>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{error}</p>
            <p className="text-xs text-gray-400 mt-2">
              Check that the backend is running on port 8000, then try again.
            </p>
            <button
              onClick={loadLogs}
              className="mt-4 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {filteredLogs.length > 0 && (
              <p className="text-xs text-gray-500 pb-3 border-b border-gray-100 mb-2">
                {filteredLogs.length} decisions · {blockedCount} where the agent held back
              </p>
            )}
            <AuditTrail logs={filteredLogs} showInvoiceId />
          </>
        )}
      </div>
    </div>
  );
}
