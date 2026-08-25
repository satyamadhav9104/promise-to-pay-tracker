import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { verifyRazorpayPayment } from '../api/client';

const defaultVpa = (invoice) =>
  `${invoice?.customer_name?.toLowerCase().replace(/\s+/g, '') || 'customer'}@oksbi`;

export default function RazorpayModal({ isOpen, onClose, invoice, onSuccess }) {
  // Every hook must run on every render, so the "nothing to show" check lives
  // below them — an early return above these calls changes the hook order.
  const [activeTab, setActiveTab] = useState('upi');
  const [upiId, setUpiId] = useState(() => defaultVpa(invoice));
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [payError, setPayError] = useState(null);

  // Reset the sheet whenever it is opened for a different invoice.
  useEffect(() => {
    if (!isOpen || !invoice) return;
    setActiveTab('upi');
    setUpiId(defaultVpa(invoice));
    setIsProcessing(false);
    setPaymentSuccess(false);
    setPaymentId('');
    setPayError(null);
  }, [isOpen, invoice?.id]);

  const formatAmount = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    setPayError(null);
    const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    try {
      // Brief pause so the test-mode sheet reads like a real gateway.
      await new Promise((r) => setTimeout(r, 800));

      const res = await verifyRazorpayPayment({
        invoice_id: invoice.id,
        razorpay_order_id: `order_${String(invoice.id).replace('-', '').toLowerCase()}_${Date.now()}`,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: 'sig_verified_razorpay_hmac'
      });

      setPaymentId(res.payment_id || mockPaymentId);
      setPaymentSuccess(true);

      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1600);
    } catch (err) {
      // Do not pretend a failed payment succeeded — the invoice is still open.
      setPayError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="font-extrabold text-blue-300 text-base">₹</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base tracking-tight">Razorpay Checkout</h3>
                  <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                    Test Mode
                  </span>
                </div>
                <p className="text-xs text-blue-200/80">SMARTINVOICE Revenue Recovery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
            <div>
              <span className="text-[11px] text-blue-200 block uppercase font-medium">Invoice Reference</span>
              <span className="font-mono text-xs font-bold text-white">{invoice.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-blue-200 block uppercase font-medium">Amount to Settle</span>
              <span className="text-xl font-extrabold text-white">{formatAmount(invoice.amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Completed Screen */}
        {paymentSuccess ? (
          <div className="p-8 text-center space-y-4 animate-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-slate-900">Payment captured</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Razorpay test mode captured this payment and the invoice is now marked{' '}
                <strong className="text-emerald-600">paid</strong>. The agent will stop chasing it,
                and the decision is written to the audit trail.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700">
              Payment ID: <strong className="text-indigo-600">{paymentId}</strong>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {payError && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-900">Payment was not recorded</p>
                  <p className="text-[11px] text-rose-800/90 mt-0.5 break-words">{payError}</p>
                  <p className="text-[11px] text-rose-700/80 mt-1">
                    The invoice is still open. Check the backend is running, then try again.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upi'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'card'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`py-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'netbanking'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>NetBanking</span>
              </button>
            </div>

            {/* Tab: UPI / QR */}
            {activeTab === 'upi' && (
              <div className="space-y-4 animate-in">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-indigo-600 shadow-sm">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Instant Razorpay UPI QR</span>
                    <span className="text-[11px] text-slate-500">Scan using Google Pay, PhonePe, Paytm, or CRED</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Or Enter UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    placeholder="user@okhdfcbank"
                  />
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleExecutePayment('UPI')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>Verifying with Razorpay...</span>
                  ) : (
                    <>
                      <span>Pay {formatAmount(invoice.amount)} via UPI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab: Card */}
            {activeTab === 'card' && (
              <div className="space-y-3 animate-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleExecutePayment('Card')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isProcessing ? (
                    <span>Verifying Card Payment...</span>
                  ) : (
                    <>
                      <span>Authorize {formatAmount(invoice.amount)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Tab: NetBanking */}
            {activeTab === 'netbanking' && (
              <div className="space-y-3 animate-in">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Select Popular Banks
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => handleExecutePayment(bank)}
                      disabled={isProcessing}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-colors text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>{bank}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Footer */}
            {/* Accurate footer chrome. The previous "256-bit SSL Encrypted / Razorpay
                Verified" badges asserted guarantees this test-mode sheet does not
                provide — no card data is transmitted and no signature is checked. */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                No card data is sent anywhere
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Razorpay test mode
              </span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

