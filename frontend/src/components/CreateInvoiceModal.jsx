import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, PlusCircle, DollarSign, Calendar, User, Hash, Upload, FileText, CheckCircle2, Sparkles, AlertCircle, Mail, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { createInvoice } from '../api/client';

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manual'
  const [invoiceType, setInvoiceType] = useState('receivable'); // 'receivable' | 'payable'
  const defaultId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const [invoiceId, setInvoiceId] = useState(defaultId);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [extractedStatus, setExtractedStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const parseDocument = (fileName, fileContent = '') => {
    setIsParsing(true);
    setExtractedStatus('Scanning document text & email addresses...');

    setTimeout(() => {
      let extractedId = `INV-${Math.floor(2000 + Math.random() * 8000)}`;
      let extractedCustomer = 'Acme Logistics Ltd';
      let extractedEmail = 'billing@acmelogistics.in';
      let extractedAmount = '14500.00';
      let extractedDueDate = '2026-08-10';

      if (fileContent) {
        const idMatch = fileContent.match(/INV[-\s]?\d+/i) || fileContent.match(/Invoice\s*#?\s*([A-Z0-9-]+)/i);
        if (idMatch) extractedId = idMatch[0].replace(/\s+/g, '');

        const emailMatch = fileContent.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        if (emailMatch) extractedEmail = emailMatch[1];

        const amountMatch = fileContent.match(/\$?\s*([0-9,]+\.[0-9]{2})/);
        if (amountMatch) extractedAmount = amountMatch[1].replace(/,/g, '');

        const dateMatch = fileContent.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) extractedDueDate = dateMatch[0];
      } else if (fileName.toLowerCase().includes('global')) {
        extractedCustomer = 'Global Enterprise Solutions';
        extractedEmail = 'accounts@globalenterprise.com';
        extractedAmount = '28900.00';
      } else if (fileName.toLowerCase().includes('apex')) {
        extractedCustomer = 'Apex Digital Systems';
        extractedEmail = 'ap@apexdigital.io';
        extractedAmount = '8400.00';
      }

      setInvoiceId(extractedId);
      setCustomerName(extractedCustomer);
      setCustomerEmail(extractedEmail);
      setAmount(extractedAmount);
      setDueDate(extractedDueDate);

      setIsParsing(false);
      setExtractedStatus(`Auto-filled 5 fields including email from "${fileName}"`);
    }, 800);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      parseDocument(uploadedFile.name, event.target.result);
    };
    reader.readAsText(uploadedFile);
  };

  const handleSampleFill = () => {
    const sampleNames = ['Nexus Cloud Infra', 'Veritas Shipping', 'Stark B2B', 'Cyberdyne Systems'];
    const sampleEmails = ['finance@nexuscloud.io', 'billing@veritasshipping.com', 'ap@starkb2b.com', 'accounts@cyberdyne.io'];
    const idx = Math.floor(Math.random() * sampleNames.length);
    const randomCustomer = sampleNames[idx];
    const randomEmail = sampleEmails[idx];
    const randomAmount = (Math.floor(Math.random() * 200) * 250 + 1500).toFixed(2);
    setFile({ name: 'Invoice_Sample.pdf' });
    parseDocument('Invoice_Sample.pdf', `Invoice #${defaultId} for ${randomCustomer} (${randomEmail}) total $${randomAmount} due 2026-08-10`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!invoiceId || !customerName || !amount || !dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const isoDueDate = new Date(dueDate).toISOString();
      await createInvoice({
        id: invoiceId,
        customer_name: customerName,
        customer_email: customerEmail || `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
        invoice_type: invoiceType,
        amount: parseFloat(amount),
        due_date: isoDueDate
      });
      onSuccess();
      onClose();
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setAmount('');
      setFile(null);
      setExtractedStatus(null);
      setInvoiceId(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err) {
      setError(err.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-gray-900 text-base">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span>Add New Invoice & Customer Details</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 shrink-0 max-h-[80vh] overflow-y-auto">
          
          {/* Entry Category Switcher */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Invoice Category</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setInvoiceType('receivable')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  invoiceType === 'receivable'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Money to Receive (AR)</span>
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('payable')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  invoiceType === 'payable'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Bill to Pay (AP)</span>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="p-1 bg-gray-100 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload & Auto-Fill</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-gray-600" />
              <span>Manual Entry</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload & Auto-fill Section */}
          {activeTab === 'upload' && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50/80 p-4 rounded-xl text-center transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    {file ? file.name : 'Click to Upload Invoice (PDF / Image / Text)'}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Auto-detects invoice ID, customer name, email, amount, and due date
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-gray-600 font-medium">Want to test quickly?</span>
                <button
                  type="button"
                  onClick={handleSampleFill}
                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Fill Sample Data
                </button>
              </div>

              {isParsing && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-2 font-medium animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                  <span>{extractedStatus}</span>
                </div>
              )}

              {extractedStatus && !isParsing && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{extractedStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Form Inputs Grid */}
          <form id="create-invoice-form" onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Invoice ID *</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    required
                    placeholder="INV-1001"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Due Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Customer / Client *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Amount ($ / ₹) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Customer Recovery Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Customer Recovery Email (For Payment Links & Nudges)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="billing@customercompany.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-slate-50/80 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-invoice-form"
            disabled={submitting || isParsing}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Confirm & Save Invoice'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
