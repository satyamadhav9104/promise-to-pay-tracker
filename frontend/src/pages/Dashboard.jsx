import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Play,
  RefreshCw,
  Bell,
  PlusCircle
} from 'lucide-react';
import { fetchInvoices, fetchMetrics, triggerSchedulerTick } from '../api/client';
import InvoiceList from '../components/InvoiceList';
import CreateInvoiceModal from '../components/CreateInvoiceModal';

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickLoading, setTickLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


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
      setNotification(`Scheduler Tick Executed: Evaluated ${res.processed_count} invoices.`);
      await loadData();
    } catch (err) {
      alert('Error triggering scheduler tick: ' + err.message);
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

  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((i) => i.status === 'paid').length;
  const pendingCount = invoices.filter((i) => ['due_soon', 'created', 'promise_made', 'pending_verification'].includes(i.status)).length;
  const overdueCount = invoices.filter((i) => ['overdue', 'promise_due', 'escalated'].includes(i.status)).length;
  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount);

  return (
    <div className="space-y-8 animate-in p-4 sm:p-8 max-w-7xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your B2B invoice revenue recovery today.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm shadow-emerald-200 transition-colors flex items-center gap-2 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Invoice
          </button>
          <button
            onClick={handleRunTick}
            disabled={tickLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-indigo-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {tickLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Run Scheduler Tick Engine
          </button>
        </div>


      </div>

      {notification && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl text-sm flex justify-between items-center shadow-sm">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue Receivables</p>
              <h3 className="text-3xl font-bold text-gray-900">{formattedTotal}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-600 font-medium mr-2">
              {metrics?.recovery_rate_percentage || 0}%
            </span>
            <span className="text-gray-400">recovery rate ({metrics?.total_recovered_amount ? `$${metrics.total_recovered_amount.toLocaleString()}` : '$0'})</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Paid Invoices</p>
              <h3 className="text-3xl font-bold text-gray-900">{paidCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Promises Kept: {metrics?.promises_kept_count || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending / Promised</p>
              <h3 className="text-3xl font-bold text-gray-900">{pendingCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Active payment promises</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Overdue / Escalated</p>
              <h3 className="text-3xl font-bold text-gray-900">{overdueCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Human Escalations: {metrics?.human_escalations_count || 0}</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices & Promise Tracking</h2>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {totalInvoices} Total
              </span>
            </div>
            <div className="p-0">
              <InvoiceList invoices={invoices} onRefresh={loadData} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleRunTick}
                disabled={tickLoading}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Run Scheduler Tick
                </span>
                <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-lg text-xs font-semibold">
                  {overdueCount} Overdue
                </span>
              </button>

              <button
                onClick={loadData}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Refresh Recovery Metrics
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  {metrics?.recovery_rate_percentage || 0}%
                </span>
              </button>
            </div>
          </div>

          {/* Workflow Banner */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Zap className="w-24 h-24" />
            </div>
            <h3 className="text-lg font-semibold mb-2 relative z-10">Automate your B2B recovery</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">
              Structured promise extraction, stopping rules, and closed-loop Razorpay verification.
            </p>
            <button
              onClick={handleRunTick}
              className="bg-white text-indigo-600 px-4 py-2.5 rounded-xl font-semibold text-sm w-full hover:bg-indigo-50 transition-colors shadow-sm relative z-10"
            >
              Run Scheduler Cycle
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

