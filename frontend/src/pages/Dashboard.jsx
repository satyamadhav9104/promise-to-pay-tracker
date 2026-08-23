import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Zap,
  Plus,
  Bell,
  FileBarChart,
  ArrowRight,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { fetchInvoices, fetchMetrics, triggerSchedulerTick } from '../api/client';
import InvoiceList from '../components/InvoiceList';
import CreateInvoiceModal from '../components/CreateInvoiceModal';

export default function Dashboard({ onOpenAddInvoice }) {
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
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRunTick = async () => {
    setTickLoading(true);
    setNotification(null);
    try {
      const res = await triggerSchedulerTick();
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

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid' || inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => ['Pending', 'pending', 'created', 'due_soon', 'promise_made'].includes(inv.status)).length;
  const overdueInvoices = invoices.filter(inv => ['Overdue', 'overdue', 'escalated', 'promise_due', 'pending_verification'].includes(inv.status)).length;
  
  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAmount);

  return (
    <div className="space-y-8 animate-in p-4 sm:p-8 max-w-7xl mx-auto pb-24">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your invoices today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTick}
            disabled={tickLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-indigo-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${tickLoading ? 'animate-bounce' : ''}`} />
            {tickLoading ? 'Evaluating...' : 'Run AI Recovery'}
          </button>
          <button
            onClick={onOpenAddInvoice || (() => setIsCreateModalOpen(true))}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-gray-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-5 py-3.5 rounded-2xl text-sm flex justify-between items-center shadow-sm animate-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="font-medium">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-indigo-600 hover:text-indigo-900 font-bold text-xs bg-indigo-100/80 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900">{formattedTotal}</h3>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
            <span className="text-emerald-600 font-medium mr-2">+12.5%</span>
            <span className="text-gray-400">vs last month</span>
          </div>
        </div>

        {/* Card 2: Paid Invoices */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Paid Invoices</p>
              <h3 className="text-3xl font-bold text-gray-900">{paidInvoices}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center text-sm text-emerald-600 font-medium">
            <span>{totalInvoices > 0 ? ((paidInvoices / totalInvoices) * 100).toFixed(0) : 0}% recovery rate</span>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
              <h3 className="text-3xl font-bold text-gray-900">{pendingInvoices}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-50">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center text-sm text-amber-600 font-medium">
            <span>Awaiting payment promise</span>
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Overdue</p>
              <h3 className="text-3xl font-bold text-gray-900">{overdueInvoices}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div className="flex items-center text-sm text-rose-600 font-medium">
            <span>Active recovery nudges</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Invoices (2 Cols) + Quick Actions / Automate (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <button
                onClick={loadData}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                View All
              </button>
            </div>
            <div className="p-0">
              <InvoiceList invoices={invoices} onRefresh={loadData} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleRunTick}
                disabled={tickLoading}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Send Reminders
                </span>
                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-lg text-xs font-semibold">
                  {overdueInvoices}
                </span>
              </button>

              <button
                onClick={onOpenAddInvoice || (() => setIsCreateModalOpen(true))}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2">
                  <FileBarChart className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Generate Report
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
              </button>

              <button
                onClick={loadData}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="text-gray-700 font-medium group-hover:text-indigo-700 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  Sync Metrics
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
              </button>
            </div>
          </div>

          {/* Automate your workflow Gradient Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Zap className="w-24 h-24" />
            </div>
            <h3 className="text-lg font-semibold mb-2 relative z-10">Automate your workflow</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">
              Set up recurring invoices and automated payment reminders with closed-loop Razorpay Webhooks.
            </p>
            <button
              onClick={handleRunTick}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium text-sm w-full hover:bg-indigo-50 transition-colors shadow-sm relative z-10 cursor-pointer font-semibold"
            >
              Setup Now
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
