import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileSignature,
  Activity,
  MessageSquare,
  CreditCard,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import AuditTrail from './AuditTrail';
import { fetchAuditLogs, submitCustomerReply, simulatePayment } from '../api/client';

export default function InvoiceList({ invoices = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [auditLogs, setAuditLogs] = useState({});
  const [activeModal, setActiveModal] = useState(null); // { type: 'reply' | 'payment', invoice }
  const [replyText, setReplyText] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleAuditTrail = async (invoiceId) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null);
    } else {
      setExpandedInvoiceId(invoiceId);
      if (!auditLogs[invoiceId]) {
        try {
          const logs = await fetchAuditLogs(invoiceId);
          setAuditLogs((prev) => ({ ...prev, [invoiceId]: logs }));
        } catch (err) {
          console.error('Error fetching audit logs:', err);
        }
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!activeModal || !replyText.trim()) return;

    setLoadingAction(true);
    try {
      await submitCustomerReply(activeModal.invoice.id, replyText);
      setActiveModal(null);
      setReplyText('');
      onRefresh();
    } catch (err) {
      alert('Error submitting reply: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePaymentSubmit = async (invoiceId) => {
    setLoadingAction(true);
    try {
      await simulatePayment(invoiceId);
      setActiveModal(null);
      onRefresh();
    } catch (err) {
      alert('Error simulating payment: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="w-full">
      {/* Search & Filter Bar */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50 border-b border-gray-100">
        <div className="relative flex-1 max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700 cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses ({invoices.length})</option>
            <option value="created">Created</option>
            <option value="due_soon">Due Soon</option>
            <option value="overdue">Overdue</option>
            <option value="promise_made">Promise Made</option>
            <option value="promise_due">Promise Due</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="escalated">Escalated</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Invoice Details</th>
              <th className="px-6 py-4 font-semibold hidden sm:table-cell">Client</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold hidden md:table-cell">Touches</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-base font-medium text-gray-900">No invoices found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const isExpanded = expandedInvoiceId === invoice.id;

                return (
                  <React.Fragment key={invoice.id}>
                    <tr
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                      onClick={() => toggleAuditTrail(invoice.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <FileSignature className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{invoice.id}</p>
                            <p className="text-xs text-gray-500 sm:hidden mt-0.5">{invoice.customer_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="font-medium text-gray-700">{invoice.customer_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500 hidden md:table-cell">
                        {invoice.touch_count} / 3
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status !== 'paid' && invoice.status !== 'written_off' && (
                            <>
                              <button
                                onClick={() => {
                                  setReplyText('');
                                  setActiveModal({ type: 'reply', invoice });
                                }}
                                className="px-2.5 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium border border-indigo-200 transition-colors flex items-center gap-1"
                                title="Simulate Customer Reply"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Reply
                              </button>
                              <button
                                onClick={() => handlePaymentSubmit(invoice.id)}
                                className="px-2.5 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium border border-emerald-200 transition-colors flex items-center gap-1"
                                title="Simulate Razorpay Webhook"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pay
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleAuditTrail(invoice.id)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Audit Log Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan="6" className="px-6 py-6 border-l-4 border-indigo-500">
                          <div className="pl-2 sm:pl-8 max-w-4xl space-y-4">
                            {/* Promises Section */}
                            {invoice.promises && invoice.promises.length > 0 && (
                              <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <FileSignature className="w-4 h-4 text-purple-600" />
                                  Extracted Payment Promises
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {invoice.promises.map((p) => (
                                    <div key={p.id} className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 text-xs space-y-1">
                                      <div className="flex justify-between font-medium text-purple-900">
                                        <span>Status: <strong className="uppercase">{p.status}</strong></span>
                                        <span>Confidence: {(p.confidence_score * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="text-gray-600">
                                        Promised Date: {p.promised_date ? new Date(p.promised_date).toLocaleDateString() : 'N/A'}
                                      </div>
                                      <p className="text-gray-700 italic bg-white p-2 rounded border border-purple-100/60 mt-1">
                                        "{p.source_text}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Audit History Timeline */}
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Invoice History & Audit Evidence
                              </h4>
                              <AuditTrail logs={auditLogs[invoice.id] || []} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-white rounded-b-2xl">
        <span>Showing {filteredInvoices.length} invoices</span>
        <div className="flex gap-1">
          <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 text-xs font-medium" disabled>
            Prev
          </button>
          <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-xs font-medium">
            Next
          </button>
        </div>
      </div>

      {/* Customer Reply Modal */}
      {activeModal && activeModal.type === 'reply' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Simulate Customer Reply</h3>
                <p className="text-xs text-gray-500">Invoice: <span className="font-mono font-semibold text-indigo-600">{activeModal.invoice.id}</span> ({activeModal.invoice.customer_name})</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Reply Text (Email / Chat):
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g. 'We will transfer payment for this invoice by 2026-09-01' OR 'I already paid yesterday via UPI'"
                  className="w-full bg-gray-50 text-gray-900 p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-gray-400 block font-medium">Quick Test Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReplyText(`We will process payment for invoice ${activeModal.invoice.id} by 2026-09-01.`)}
                    className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors font-medium"
                  >
                    Explicit Date Promise
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText(`I already paid invoice ${activeModal.invoice.id} yesterday via Razorpay UPI. Ref #RP192837.`)}
                    className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors font-medium"
                  >
                    Unverified Payment Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Working on cash flow, will try to clear the dues soon.')}
                    className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors font-medium"
                  >
                    Vague Promise (Low Conf)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {loadingAction ? 'Analyzing Intent...' : 'Extract Promise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
