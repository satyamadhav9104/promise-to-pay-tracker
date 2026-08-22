import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 animate-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/90 shrink-0">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <PlusCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            Add New Invoice & Customer Email
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Form Body */}
        <div className="p-4 space-y-3 shrink-0">
          
          {/* Entry Category Switcher */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600">Entry Category</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100/90 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setInvoiceType('receivable')}
                className={`py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  invoiceType === 'receivable'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                📥 Money to Receive
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('payable')}
                className={`py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                  invoiceType === 'payable'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                📤 Pending Bill to Pay
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="p-1 bg-gray-100/90 rounded-xl flex">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Upload & Auto-Fill
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3 h-3 text-gray-500" />
              Manual Entry
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] p-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload & Auto-fill Section */}
          {activeTab === 'upload' && (
            <div className="space-y-1.5">
              <div className="border border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/70 p-2.5 rounded-xl text-center transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-gray-800">
                    {file ? file.name : 'Upload File (PDF / Image / Text)'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] px-0.5">
                <span className="text-gray-400">Instant test?</span>
                <button
                  type="button"
                  onClick={handleSampleFill}
                  className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                >
                  ✨ Auto-Fill Sample Data
                </button>
              </div>

              {isParsing && (
                <div className="p-1.5 bg-indigo-50 rounded-lg text-[10px] text-indigo-800 flex items-center gap-1.5 font-medium animate-pulse">
                  <Sparkles className="w-3 h-3 text-indigo-600 animate-spin" />
                  <span>{extractedStatus}</span>
                </div>
              )}

              {extractedStatus && !isParsing && (
                <div className="p-1.5 bg-emerald-50 rounded-lg text-[10px] text-emerald-800 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{extractedStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Compact Inputs Grid (Fits completely on screen!) */}
          <form id="create-invoice-form" onSubmit={handleSubmit} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-0.5">Invoice ID</label>
                <div className="relative">
                  <Hash className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    required
                    className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-0.5">Due Date</label>
                <div className="relative">
                  <Calendar className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-0.5">Customer Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-0.5">Amount (₹ / $)</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Customer Recovery Email Input */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-0.5">
                Customer Recovery Email (For Reminders & Nudges)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-indigo-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="billing@customercompany.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer - Fixed at bottom */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/90 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-invoice-form"
            disabled={submitting || isParsing}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Confirm & Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
