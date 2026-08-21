import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { fetchInvoices, simulatePayment } from '../api/client';
import InvoiceList from '../components/InvoiceList';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices(statusFilter);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSimulatePayment = async (invoiceId) => {
    try {
      const res = await simulatePayment(invoiceId);
      setNotification(`Payment simulated for ${invoiceId}. Invoice status updated to PAID.`);
      await loadInvoices();
    } catch (err) {
      alert('Error simulating payment: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoices & Promises</h1>
          <p className="text-gray-500 mt-1">Manage and track all B2B receivables across the recovery lifecycle.</p>
        </div>

        <button
          onClick={loadInvoices}
          className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex justify-between items-center shadow-sm">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { label: 'All', value: '' },
            { label: 'Overdue', value: 'overdue' },
            { label: 'Promise Made', value: 'promise_made' },
            { label: 'Pending Verification', value: 'pending_verification' },
            { label: 'Paid', value: 'paid' },
            { label: 'Escalated', value: 'escalated' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <InvoiceList invoices={filteredInvoices} onRefresh={loadInvoices} />
        )}
      </div>
    </div>
  );
}
