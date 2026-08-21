import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import AuditTrail from './AuditTrail';
import { fetchAuditLogs, submitCustomerReply, simulatePayment } from '../api/client';

export default function InvoiceList({ invoices = [], onRefresh }) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [auditLogs, setAuditLogs] = useState({});
  const [activeModal, setActiveModal] = useState(null); // { type: 'reply' | 'payment', invoice }
  const [replyText, setReplyText] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const filtered = selectedStatus
    ? invoices.filter((i) => i.status === selectedStatus)
    : invoices;

  const toggleExpand = async (invoiceId) => {
    if (expandedId === invoiceId) {
      setExpandedId(null);
    } else {
      setExpandedId(invoiceId);
      if (!auditLogs[invoiceId]) {
        try {
          const logs = await fetchAuditLogs(invoiceId);
          setAuditLogs((prev) => ({ ...prev, [invoiceId]: logs }));
        } catch (err) {
          console.error(err);
        }
      }
    }
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
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300">Filter Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses ({invoices.length})</option>
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

        <div className="text-xs text-gray-400">
          Showing <span className="text-white font-semibold">{filtered.length}</span> of {invoices.length} invoices
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900/80 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Touches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {filtered.map((inv) => {
                const isExpanded = expandedId === inv.id;

                return (
                  <React.Fragment key={inv.id}>
                    <tr className="hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">{inv.id}</td>
                      <td className="py-3 px-4 font-medium text-gray-200">{inv.customer_name}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                        {inv.touch_count} / 3
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {inv.status !== 'paid' && inv.status !== 'written_off' && (
                          <>
                            <button
                              onClick={() => {
                                setReplyText('');
                                setActiveModal({ type: 'reply', invoice: inv });
                              }}
                              className="px-2.5 py-1 text-xs bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800 rounded border border-indigo-700 font-medium transition"
                            >
                              Simulate Reply
                            </button>
                            <button
                              onClick={() => handlePaymentSubmit(inv.id)}
                              className="px-2.5 py-1 text-xs bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800 rounded border border-emerald-700 font-medium transition"
                            >
                              Pay Webhook
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toggleExpand(inv.id)}
                          className="px-2.5 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 rounded font-medium transition"
                        >
                          {isExpanded ? 'Hide Audit' : 'Audit Trail'}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Audit Log & Details */}
                    {isExpanded && (
                      <tr className="bg-gray-900/90">
                        <td colSpan={7} className="p-4 border-t border-b border-gray-700">
                          <div className="space-y-4">
                            {/* Promises Section */}
                            {inv.promises && inv.promises.length > 0 && (
                              <div>
                                <h4 className="text-xs uppercase tracking-wider font-semibold text-purple-400 mb-2">
                                  Logged Payment Promises
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {inv.promises.map((p) => (
                                    <div key={p.id} className="bg-gray-800 p-3 rounded border border-purple-900/50 text-xs">
                                      <div className="flex justify-between font-mono text-gray-300 mb-1">
                                        <span>Status: <strong className="uppercase text-purple-300">{p.status}</strong></span>
                                        <span>Confidence: {(p.confidence_score * 100).toFixed(0)}%</span>
                                      </div>
                                      <div className="text-gray-400 mb-1">
                                        Promised Date: {p.promised_date ? new Date(p.promised_date).toLocaleDateString() : 'N/A'}
                                      </div>
                                      <p className="text-gray-300 italic">"{p.source_text}"</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Audit Trail */}
                            <AuditTrail logs={auditLogs[inv.id] || []} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Reply Modal */}
      {activeModal && activeModal.type === 'reply' && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-white">
              Simulate Customer Reply — {activeModal.invoice.id}
            </h3>
            <p className="text-xs text-gray-400">
              Customer: <span className="text-gray-200 font-medium">{activeModal.invoice.customer_name}</span>
            </p>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Customer Email/Chat Text:
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="e.g. 'We will transfer payment by next Friday' OR 'I already paid yesterday via UPI'"
                  className="w-full bg-gray-900 text-gray-100 p-3 rounded-lg border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Sample quick presets */}
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 block font-medium">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReplyText('We will process payment for this invoice by 2026-09-01.')}
                    className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-gray-200"
                  >
                    Explicit Date Promise
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('I already paid this invoice yesterday via UPI. Ref #192837.')}
                    className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-gray-200"
                  >
                    Unverified Payment Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Working on it, will clear the dues soon.')}
                    className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-gray-200"
                  >
                    Vague Promise (Low Conf)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {loadingAction ? 'Analyzing...' : 'Extract & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
