import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Zap,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
  MessageSquare,
  CreditCard,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { fetchInvoices, fetchMetrics, triggerSchedulerTick, submitCustomerReply, simulatePayment } from '../api/client';
import InvoiceList from '../components/InvoiceList';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import StatusBadge from '../components/StatusBadge';

// Helper function to format INR currency cleanly (e.g. ₹12.4L, ₹42.5K, ₹14,500)
function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Helper to calculate days overdue
function getDaysOverdue(dueDateStr) {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickLoading, setTickLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lastRunTime, setLastRunTime] = useState('2 minutes ago');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invData, metData] = await Promise.all([fetchInvoices(), fetchMetrics()]);
      setInvoices(invData);
      setMetrics(metData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunTick = async () => {
    setTickLoading(true);
    setNotification(null);
    try {
      const res = await triggerSchedulerTick();
      setLastRunTime('Just now');
      setNotification(`AI Recovery Agent Executed: Evaluated ${res.processed_count} invoices successfully.`);
      await loadData();
    } catch (err) {
      alert('Error triggering AI recovery tick: ' + err.message);
    } finally {
      setTickLoading(false);
    }
  };

  if (loading && !invoices.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center m-8">
        <AlertCircle className="w-5 h-5 mr-2" /> Error loading data: {error.message}
      </div>
    );
  }

  // Calculate metrics for At Risk invoices (overdue, promise_due, escalated)
  const atRiskInvoices = invoices.filter((i) =>
    ['overdue', 'promise_due', 'escalated', 'pending_verification'].includes(i.status)
  );
  const atRiskAmount = atRiskInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  const recoveredAmount = metrics?.total_recovered_amount ?? invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  const recoveryRate = metrics?.recovery_rate_percentage ?? (
    invoices.length > 0
      ? ((invoices.filter((i) => i.status === 'paid').length / invoices.length) * 100).toFixed(1)
      : 0
  );

  // Invoices requiring attention (Top priority: escalated, overdue, promise_due, pending_verification)
  const attentionInvoices = [...invoices]
    .filter((i) => ['escalated', 'overdue', 'promise_due', 'pending_verification'].includes(i.status))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in p-4 sm:p-8 max-w-7xl mx-auto pb-24">
      {/* Header Banner with SMARTINVOICE Branding & Agent Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Track 03 • Razorpay AI Buildathon
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              SMARTINVOICE
            </h1>
            <p className="text-indigo-200/80 text-sm sm:text-base mt-1 font-medium">
              AI-Powered Revenue Recovery & Closed-Loop Promise Verification
            </p>

            {/* AI Agent Status Pill */}
            <div className="mt-4 inline-flex items-center gap-3 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 shadow-inner text-xs sm:text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-emerald-400">AI Recovery Agent ACTIVE</span>
              <span className="text-slate-400 border-l border-slate-700 pl-3">Last run: {lastRunTime}</span>
            </div>
          </div>

          {/* Primary Action Button [ Run AI Recovery ] */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRunTick}
              disabled={tickLoading}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base disabled:opacity-50 cursor-pointer group"
            >
              <Zap className={`w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform ${tickLoading ? 'animate-bounce' : ''}`} />
              {tickLoading ? 'Running Agent...' : 'Run AI Recovery'}
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-3.5 rounded-2xl border border-white/10 backdrop-blur-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <PlusCircle className="w-4 h-4 text-indigo-300" />
              Add Invoice
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-5 py-3.5 rounded-2xl text-sm flex justify-between items-center shadow-sm animate-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-indigo-100/80 px-2.5 py-1 rounded-lg">
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Main Highlight Metric Cards (ASCII Match: Recovered, Recovery Rate, At Risk) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Recovered */}
        <div className="bg-gradient-to-br from-emerald-50/60 to-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-semibold text-emerald-800 uppercase tracking-wider">Recovered</span>
            <div className="p-3 rounded-2xl bg-emerald-100/80 text-emerald-700">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {formatINR(recoveredAmount)}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Total revenue successfully recovered
          </p>
        </div>

        {/* Card 2: Recovery Rate */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-white rounded-3xl p-6 shadow-sm border border-indigo-100/80 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-semibold text-indigo-800 uppercase tracking-wider">Recovery Rate</span>
            <div className="p-3 rounded-2xl bg-indigo-100/80 text-indigo-700">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {typeof recoveryRate === 'number' ? recoveryRate.toFixed(1) : recoveryRate}%
          </h3>
          <p className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> High efficiency automated recovery
          </p>
        </div>

        {/* Card 3: At Risk */}
        <div className="bg-gradient-to-br from-rose-50/60 to-white rounded-3xl p-6 shadow-sm border border-rose-100/80 hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-semibold text-rose-800 uppercase tracking-wider">At Risk</span>
            <div className="p-3 rounded-2xl bg-rose-100/80 text-rose-700">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {formatINR(atRiskAmount)}
          </h3>
          <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Requires agent nudge or verification
          </p>
        </div>
      </div>

      {/* Invoices Requiring Attention Widget Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
            <h2 className="text-lg font-bold text-gray-900">Invoices requiring attention</h2>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            {attentionInvoices.length} Priority Action{attentionInvoices.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="p-6">
          {attentionInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500 space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
              <p className="text-sm font-medium">All invoices are up to date! No immediate interventions required.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attentionInvoices.map((inv) => {
                const daysOver = getDaysOverdue(inv.due_date);
                const isHighUrgency = inv.status === 'escalated' || daysOver >= 10;
                const isPromise = ['promise_made', 'promise_due'].includes(inv.status);

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/30 hover:bg-slate-50 hover:border-indigo-200 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {inv.id}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">{inv.customer_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {isPromise ? (
                            <span className="text-purple-700 font-medium">Promise Due / Tracked</span>
                          ) : daysOver > 0 ? (
                            <span className="text-rose-600 font-medium">{daysOver} days overdue</span>
                          ) : (
                            <span>Due soon</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-gray-900">{formatINR(inv.amount)}</span>
                        <div className="mt-1">
                          {isHighUrgency ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                              🔴 High Urgency
                            </span>
                          ) : isPromise ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                              🟣 Promise Active
                            </span>
                          ) : (
                            <StatusBadge status={inv.status} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <StatusBadge status={inv.status} />
                      <button
                        onClick={handleRunTick}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Process Nudge <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Invoice Table & Action Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-gray-900">All Invoices & Promise Records</h2>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {invoices.length} Total Records
              </span>
            </div>
            <div className="p-0">
              <InvoiceList invoices={invoices} onRefresh={loadData} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">AI Controls & Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleRunTick}
                disabled={tickLoading}
                className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/60 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-gray-800 font-semibold group-hover:text-indigo-700 flex items-center gap-2.5 text-sm">
                  <Zap className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  Run AI Scheduler Tick
                </span>
                <span className="bg-indigo-100 text-indigo-800 py-1 px-2.5 rounded-lg text-xs font-bold">
                  {atRiskInvoices.length} Pending
                </span>
              </button>

              <button
                onClick={loadData}
                className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/60 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-gray-800 font-semibold group-hover:text-indigo-700 flex items-center gap-2.5 text-sm">
                  <RefreshCw className="w-4 h-4 text-emerald-600 group-hover:rotate-180 transition-transform duration-500" />
                  Sync Recovery Metrics
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {typeof recoveryRate === 'number' ? recoveryRate.toFixed(1) : recoveryRate}%
                </span>
              </button>
            </div>
          </div>

          {/* AI Workflow Banner */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
              <Sparkles className="w-28 h-28" />
            </div>
            <h3 className="text-lg font-bold mb-2 relative z-10">Razorpay AI Revenue Recovery</h3>
            <p className="text-indigo-100/90 text-sm mb-4 relative z-10 leading-relaxed">
              Structured promise extraction with Pydantic JSON schemas, touch-cap stopping rules, and webhook payment verification.
            </p>
            <button
              onClick={handleRunTick}
              disabled={tickLoading}
              className="bg-white text-indigo-700 font-bold px-5 py-3 rounded-2xl text-sm w-full hover:bg-indigo-50 transition-colors shadow-md relative z-10 cursor-pointer"
            >
              Trigger Full Recovery Cycle
            </button>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
