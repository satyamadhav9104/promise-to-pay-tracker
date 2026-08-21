import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Filter, RefreshCw, CheckCircle2, ShieldAlert, Clock, Search } from 'lucide-react';
import { fetchAuditLogs } from '../api/client';
import AuditTrail from '../components/AuditTrail';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState('');
  const [searchInvoice, setSearchInvoice] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesActor = !actorFilter || log.actor === actorFilter;
    const matchesInvoice = !searchInvoice || log.invoice_id.toLowerCase().includes(searchInvoice.toLowerCase());
    return matchesActor && matchesInvoice;
  });

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Trail & Rules</h1>
          <p className="text-gray-500 mt-1">
            Complete, explainable decision log proving why actions were taken or blocked.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Log
        </button>
      </div>

      {/* Rules Governance Banner */}
      <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800 space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          Active Guardrails & Governance Policies
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60 text-xs">
            <span className="font-semibold text-white block mb-1">Max Touch Cap (3 Touches)</span>
            <p className="text-indigo-200 text-[11px]">Enforces hard limit of 3 outbound nudges before human handoff.</p>
          </div>
          <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60 text-xs">
            <span className="font-semibold text-white block mb-1">4-Day Cooldown</span>
            <p className="text-indigo-200 text-[11px]">Blocks automated reminders until 4 days elapse after last touch.</p>
          </div>
          <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60 text-xs">
            <span className="font-semibold text-white block mb-1">Razorpay Webhook Stopping Rule</span>
            <p className="text-indigo-200 text-[11px]">Instantly halts all reminders upon receiving verified payment event.</p>
          </div>
        </div>
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Actor Filter:</span>
          {['', 'ai', 'system'].map((actor) => (
            <button
              key={actor}
              onClick={() => setActorFilter(actor)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                actorFilter === actor
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {actor === '' ? 'All Actors' : actor}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <AuditTrail logs={filteredLogs} />
        )}
      </div>
    </div>
  );
}
