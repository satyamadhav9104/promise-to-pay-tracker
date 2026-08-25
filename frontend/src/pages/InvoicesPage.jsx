import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, PlusCircle, Download, FileSpreadsheet } from 'lucide-react';
import { fetchInvoices } from '../api/client';
import InvoiceList from '../components/InvoiceList';
import CreateInvoiceModal from '../components/CreateInvoiceModal';

export default function InvoicesPage({ onOpenAddInvoice, onOpenBulkImport, onNotify, maxTouches = 3 }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [isLocalCreateModalOpen, setIsLocalCreateModalOpen] = useState(false);

  // The table refreshes every 3s so webhook-driven changes appear on their own.
  // Only the very first load is allowed to show a spinner — otherwise the
  // spinner would strobe over the table forever.
  const hasLoadedOnce = useRef(false);

  const loadInvoices = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchInvoices(statusFilter);
      setInvoices(data || []);
      setError(null);
      hasLoadedOnce.current = true;
    } catch (err) {
      // A background refresh failing should not blank out data already on screen.
      if (!hasLoadedOnce.current) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    const interval = setInterval(() => {
      loadInvoices({ silent: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const openCreateInvoice = onOpenAddInvoice || (() => setIsLocalCreateModalOpen(true));

  const filteredInvoices = invoices.filter(inv => {
    const name = inv.customer_name || inv.client_name || '';
    const idStr = inv.id || inv.invoice_number || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          idStr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return;
    const headers = ['Invoice ID', 'Customer Name', 'Customer Email', 'Amount (INR)', 'Due Date', 'Status', 'Touches'];
    const rows = filteredInvoices.map(i => [
      i.id || i.invoice_number,
      `"${(i.customer_name || i.client_name || '').replace(/"/g, '""')}"`,
      i.customer_email || '',
      i.amount || 0,
      i.due_date ? i.due_date.split('T')[0] : '',
      i.status || 'created',
      i.touch_count || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smartinvoice_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSeeded = (count) => {
    setNotification(
      count > 0
        ? `Loaded ${count} sample invoices. Run a recovery sweep from the dashboard to watch the agent decide.`
        : 'Demo data was already loaded.'
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto pb-24 animate-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoices & Promises</h1>
          <p className="text-gray-500 mt-1">Manage and track all B2B receivables across the recovery lifecycle.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={filteredInvoices.length === 0}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 text-xs shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export CSV
          </button>

          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-1.5 text-xs shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Import CSV
            </button>
          )}

          <button
            onClick={openCreateInvoice}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm shadow-indigo-200 transition-colors flex items-center gap-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <PlusCircle className="w-4 h-4" />
            New invoice
          </button>
        </div>
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
        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 mt-3">Could not load invoices</p>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">{error}</p>
            <p className="text-xs text-gray-400 mt-2">
              Check that the backend is running on port 8000, then try again.
            </p>
            <button
              onClick={() => loadInvoices()}
              className="mt-4 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <InvoiceList
            invoices={filteredInvoices}
            onRefresh={() => loadInvoices({ silent: true })}
            onNotify={onNotify}
            onSeeded={handleSeeded}
            onCreateInvoice={openCreateInvoice}
            maxTouches={maxTouches}
          />
        )}
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isLocalCreateModalOpen}
        onClose={() => setIsLocalCreateModalOpen(false)}
        onSuccess={() => loadInvoices()}
      />
    </div>
  );
}


