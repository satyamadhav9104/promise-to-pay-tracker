import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  FileSignature,
  Activity,
  MessageSquare,
  CreditCard,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Check,
  Brain,
  ArrowDownLeft,
  ArrowUpRight,
  Bot
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import AuditTrail from './AuditTrail';
import RazorpayModal from './RazorpayModal';
import { fetchAuditLogs, submitCustomerReply, simulatePayment, deleteInvoice, sendInvoiceEmail, approvePromise, rejectPromise, fetchVendorRAGAdvice } from '../api/client';

export default function InvoiceList({ invoices = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [auditLogs, setAuditLogs] = useState({});
  const [vendorAdvice, setVendorAdvice] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [razorpayModalInvoice, setRazorpayModalInvoice] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [processedPromiseIds, setProcessedPromiseIds] = useState([]);

  const filteredInvoices = (invoices || []).filter((invoice) => {
    if (!invoice) return false;
    const name = (invoice.customer_name || invoice.client_name || '').toLowerCase();
    const idStr = (invoice.id || invoice.invoice_number || '').toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      idStr.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    const matchesCategory =
      filterCategory === 'All' ||
      (filterCategory === 'receivable' && (invoice.invoice_type || 'receivable') === 'receivable') ||
      (filterCategory === 'payable' && invoice.invoice_type === 'payable');
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleGetVendorAdvice = async (invoiceId) => {
    setLoadingAction(true);
    try {
      const res = await fetchVendorRAGAdvice(invoiceId);
      setVendorAdvice((prev) => ({ ...prev, [invoiceId]: res.rag_advice }));
    } catch (err) {
      alert('Error fetching RAG advice: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

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
    const currencyCode = localStorage.getItem('smartinvoice_currency') || 'INR';
    const currencySymbol = currencyCode === 'INR' ? '₹' : currencyCode === 'EUR' ? '€' : currencyCode === 'GBP' ? '£' : '$';
    return `${currencySymbol}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };


  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!activeModal || !replyText.trim()) return;

    setLoadingAction(true);
    try {
      const targetInvoiceId = activeModal.invoice.id;
      await submitCustomerReply(targetInvoiceId, replyText);
      setActiveModal(null);
      setReplyText('');
      setExpandedInvoiceId(targetInvoiceId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error submitting reply: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePaymentSubmit = (invoice) => {
    if (invoice.invoice_type === 'payable') {
      // Vendor bill direct settlement
      simulatePayment(invoice.id).then(() => {
        alert(`Bill for ${invoice.customer_name} marked as PAID.`);
        if (onRefresh) onRefresh();
      });
    } else {
      // Open interactive Razorpay checkout modal
      setRazorpayModalInvoice(invoice);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoiceId}?`)) return;
    try {
      await deleteInvoice(invoiceId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error deleting invoice: ' + err.message);
    }
  };

  const handleSendEmail = async (invoiceId) => {
    setLoadingAction(true);
    try {
      const res = await sendInvoiceEmail(invoiceId);
      alert(res.message || `Automated recovery email dispatched to customer!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error sending email: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprovePromise = async (promiseId, invoiceId) => {
    const targetId = (promiseId && promiseId !== 'demo_promise') ? promiseId : invoiceId;
    setProcessedPromiseIds((prev) => [...prev, promiseId, invoiceId, targetId].filter(Boolean));
    setLoadingAction(true);
    try {
      const res = await approvePromise(targetId);
      alert(res.message || 'Payment promise approved! Due date updated to committed date.');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error approving promise: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectPromise = async (promiseId, invoiceId) => {
    const targetId = (promiseId && promiseId !== 'demo_promise') ? promiseId : invoiceId;
    setProcessedPromiseIds((prev) => [...prev, promiseId, invoiceId, targetId].filter(Boolean));
    setLoadingAction(true);
    try {
      const res = await rejectPromise(targetId);
      alert(res.message || 'Payment promise rejected. Payment reminder email dispatched with Razorpay link.');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error rejecting promise: ' + err.message);
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
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="promise_made">Promise Made</option>
            <option value="escalated">Escalated</option>
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
              <th className="px-6 py-4 font-semibold">Due Date</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold hidden md:table-cell">Touches</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileSignature className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold text-gray-900">No Invoices Created Yet</p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Click <strong className="text-indigo-600">+ Add New Invoice</strong> in the sidebar or header to create your first B2B invoice.
                    </p>
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
                            <p className="font-semibold text-gray-900">{invoice.id || invoice.invoice_number || 'INV-000'}</p>
                            <p className="text-xs text-gray-500 sm:hidden mt-0.5">{invoice.customer_name || invoice.client_name || 'Client'}</p>

                            {/* Category Pill */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {invoice.invoice_type === 'payable' ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                  <ArrowUpRight className="w-3 h-3 text-amber-600" /> Vendor Bill (To Pay)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Receivable (To Receive)
                                </span>
                              )}
                            </div>

                            {/* AI Cashflow Advice Banner */}
                            {vendorAdvice[invoice.id] && (
                              <div className="mt-2 p-2.5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-xl text-xs space-y-1 shadow-md border border-purple-700/80 max-w-xs" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 font-bold text-purple-200 text-[11px]">
                                  <Brain className="w-3.5 h-3.5 text-purple-300 animate-pulse shrink-0" />
                                  <span>AI Cashflow Advisor:</span>
                                </div>
                                <p className="text-[11px] text-purple-100 leading-relaxed font-medium">
                                  {vendorAdvice[invoice.id]}
                                </p>
                              </div>
                            )}

                            {/* Inbound Customer Reply Indicator Card (Hides automatically after Approval or Rejection!) */}
                            {invoice.status !== 'paid' &&
                             invoice.status !== 'written_off' &&
                             !processedPromiseIds.includes(invoice.id) &&
                             (
                               (invoice.promises && invoice.promises.length > 0 &&
                                !invoice.promises.some(p => processedPromiseIds.includes(p.id) || p.status === 'active' || p.status === 'broken')) ||
                               (invoice.extracted_text && (!invoice.promises || invoice.promises.length === 0))
                             ) && (
                              <div className="mt-2 p-3 bg-purple-50/90 border border-purple-200 rounded-xl text-xs space-y-2 max-w-sm shadow-sm animate-in" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between font-bold text-purple-900 text-xs">
                                  <span className="flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
                                    Mail Reply Received:
                                  </span>
                                  {invoice.promises?.[0]?.confidence_score && (
                                    <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                                      {(invoice.promises[0].confidence_score * 100).toFixed(0)}% Conf
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-800 italic bg-white p-2 rounded-lg border border-purple-100/80 font-medium">
                                  "{invoice.extracted_text || invoice.promises?.[0]?.source_text || invoice.promises?.[invoice.promises.length - 1]?.source_text || 'Customer proposed payment promise.'}"
                                </p>
                                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-purple-100">
                                  <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                    Proposed: {invoice.promises?.[0]?.promised_date ? new Date(invoice.promises[0].promised_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 30, 2026'}
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const pId = invoice.promises?.[0]?.id || invoice.id;
                                        handleApprovePromise(pId, invoice.id);
                                      }}
                                      disabled={loadingAction}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                                      title="Approve Proposed Payment Date"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const pId = invoice.promises?.[0]?.id || invoice.id;
                                        handleRejectPromise(pId, invoice.id);
                                      }}
                                      disabled={loadingAction}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-rose-200 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                                      title="Reject Date & Send Reminder Email"
                                    >
                                      <X className="w-3.5 h-3.5 text-rose-600" /> Reject
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="font-medium text-gray-700">{invoice.customer_name || invoice.client_name || 'Client'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800 bg-gray-100/90 px-2.5 py-1 rounded-lg w-fit border border-gray-200/80">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                        </div>
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
                              {invoice.invoice_type === 'payable' && (
                                <button
                                  onClick={() => handleGetVendorAdvice(invoice.id)}
                                  disabled={loadingAction}
                                  className="px-2.5 py-1.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Get AI Cashflow & Payment Timing Advice"
                                >
                                  <Brain className="w-3.5 h-3.5 text-purple-600" />
                                  AI Advice
                                </button>
                              )}
                              {invoice.invoice_type !== 'payable' && (
                                <button
                                  onClick={() => {
                                    const amtStr = invoice.amount ? Number(invoice.amount).toLocaleString('en-US') : '12,500';
                                    setReplyText(`Hi team, we acknowledge invoice ${invoice.id} for $${amtStr}. We will complete the payment transfer by August 30, 2026.`);
                                    setActiveModal({ type: 'reply', invoice });
                                  }}
                                  className="px-2.5 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium border border-indigo-200 transition-colors flex items-center gap-1"
                                  title="Simulate Customer Reply"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Reply
                                </button>
                              )}
                              <button
                                onClick={() => handlePaymentSubmit(invoice)}
                                className="px-2.5 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Open Live Razorpay Standard Checkout Popup"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                {invoice.invoice_type === 'payable' ? 'Mark Paid' : 'Pay via Razorpay'}
                              </button>
                              <button
                                onClick={() => handleSendEmail(invoice.id)}
                                disabled={loadingAction}
                                className="px-2.5 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Send Automated Email with Razorpay Payment Link"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Send Link Email
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                        <td colSpan="7" className="px-6 py-6 border-l-4 border-indigo-500">
                          <div className="pl-2 sm:pl-8 max-w-4xl space-y-4">
                            {/* Promises Section */}
                            {invoice.promises && invoice.promises.length > 0 && (
                              <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <FileSignature className="w-4 h-4 text-purple-600" />
                                  Extracted Payment Promises
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {invoice.promises.map((p) => {
                                    const isApproved = p.status === 'active' || processedPromiseIds.includes(p.id) || processedPromiseIds.includes(invoice.id);
                                    const isRejected = p.status === 'broken';

                                    return (
                                      <div key={p.id} className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-xs space-y-2">
                                        <div className="flex justify-between font-medium text-purple-900">
                                          <span>Status: <strong className="uppercase">{isApproved ? 'ACTIVE (APPROVED)' : p.status}</strong></span>
                                          <span>Confidence: {(p.confidence_score * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="text-gray-800 font-bold flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-purple-100">
                                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                          Promised Date: {p.promised_date ? new Date(p.promised_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                        </div>
                                        <p className="text-gray-700 italic bg-white p-2 rounded-lg border border-purple-100/60">
                                          "{p.source_text}"
                                        </p>
                                        <div className="flex gap-2 pt-1">
                                          {isApproved ? (
                                            <div className="w-full bg-emerald-100/80 text-emerald-800 font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 border border-emerald-200">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                              ✓ Promise Approved (Active)
                                            </div>
                                          ) : isRejected ? (
                                            <div className="w-full bg-rose-100/80 text-rose-800 font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 border border-rose-200">
                                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                              ✕ Promise Rejected
                                            </div>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => handleApprovePromise(p.id, invoice.id)}
                                                disabled={loadingAction}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                                              >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Approve Date
                                              </button>
                                              <button
                                                onClick={() => handleRejectPromise(p.id, invoice.id)}
                                                disabled={loadingAction}
                                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-1.5 px-2 rounded-lg text-[11px] flex items-center justify-center gap-1 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                                              >
                                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                                Reject Date
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
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
      {activeModal && activeModal.type === 'reply' && createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Simulate Customer Reply</h3>
                <p className="text-xs text-gray-500">Invoice: <span className="font-mono font-semibold text-indigo-600">{activeModal.invoice.id}</span> ({activeModal.invoice.customer_name})</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
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
                    className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors font-medium cursor-pointer"
                  >
                    Explicit Date Promise
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText(`I already paid invoice ${activeModal.invoice.id} yesterday via Razorpay UPI. Ref #RP192837.`)}
                    className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors font-medium cursor-pointer"
                  >
                    Unverified Payment Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Working on cash flow, will try to clear the dues soon.')}
                    className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors font-medium cursor-pointer"
                  >
                    Vague Promise (Low Conf)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loadingAction ? 'Analyzing Intent...' : 'Extract Promise'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Razorpay Interactive Checkout Modal */}
      <RazorpayModal
        isOpen={!!razorpayModalInvoice}
        onClose={() => setRazorpayModalInvoice(null)}
        invoice={razorpayModalInvoice}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
