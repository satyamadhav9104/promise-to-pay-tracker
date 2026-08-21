import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, CheckCircle2, AlertTriangle, RefreshCw, UserX } from 'lucide-react';
import { fetchMetrics } from '../api/client';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recovery Metrics</h1>
          <p className="text-gray-500 mt-1">
            Batch performance analytics for Buildathon evaluation and revenue tracking.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Recovery Rate</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{metrics?.recovery_rate_percentage || 0}%</h2>
          <p className="text-xs text-gray-400">Total batch recovery efficiency</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Total Revenue Recovered</span>
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-emerald-600">
            {formatCurrency(metrics?.total_recovered_amount)}
          </h2>
          <p className="text-xs text-gray-400">Out of {formatCurrency(metrics?.total_amount)} total</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Avg Days to Recovery</span>
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{metrics?.avg_days_to_recovery || 0} Days</h2>
          <p className="text-xs text-gray-400">From invoice creation to payment</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-500">Human Escalations</span>
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <UserX className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{metrics?.human_escalations_count || 0}</h2>
          <p className="text-xs text-gray-400">Invoices exceeding 3 touch limits</p>
        </div>
      </div>

      {/* Promises Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Promises Kept Performance
          </h3>
          <div className="flex items-center justify-between p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div>
              <span className="text-2xl font-bold text-emerald-900">{metrics?.promises_kept_count || 0}</span>
              <p className="text-xs text-emerald-700 font-medium">Promises Verified & Kept</p>
            </div>
            <span className="text-xs bg-emerald-200/80 text-emerald-900 px-3 py-1 rounded-full font-semibold">
              Verified via Razorpay
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Promises Broken & Escalations
          </h3>
          <div className="flex items-center justify-between p-4 bg-rose-50/60 rounded-xl border border-rose-100">
            <div>
              <span className="text-2xl font-bold text-rose-900">{metrics?.promises_broken_count || 0}</span>
              <p className="text-xs text-rose-700 font-medium">Promises Expired / Broken</p>
            </div>
            <span className="text-xs bg-rose-200/80 text-rose-900 px-3 py-1 rounded-full font-semibold">
              Re-entered Recovery
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
