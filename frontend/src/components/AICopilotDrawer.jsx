import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, ShieldAlert, TrendingUp, Mail, HelpCircle, Loader2 } from 'lucide-react';
import { askRAGAssistant } from '../api/client';

export default function AICopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I am your AI Revenue Recovery Copilot. How can I help you optimize collections, assess invoice default risk, or draft customer follow-ups today?'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: '📊 Analyze recovery velocity', query: 'What is our current revenue recovery rate and average days to payment?' },
    { label: '⚠️ Assess default risk', query: 'Which overdue invoices have the highest risk of non-payment?' },
    { label: '✉️ Draft friendly reminder', query: 'Draft a professional payment reminder email for an overdue invoice with Razorpay link.' },
    { label: '🛡️ Explain safety guardrails', query: 'Explain how SmartInvoice enforces touch caps, cooldowns, and unverified claim pauses.' }
  ];

  const handleSend = async (queryToSend = null) => {
    const q = queryToSend || inputQuery;
    if (!q || !q.trim() || isLoading) return;

    const userMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askRAGAssistant(q);
      const assistantMsg = {
        role: 'assistant',
        text: response.ai_answer || response.answer || 'Query processed against database records.'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'I ran into an issue connecting to the RAG service. Please ensure the backend is running with Gemini API configured.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  SmartInvoice Copilot
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold uppercase">
                    RAG Live
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/70">Google Gemini 2.5 + Grounded DB Engine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 text-xs shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 text-xs shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Analyzing ledger context with Gemini AI...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Chips & Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 space-y-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.query)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-[11px] font-medium bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-gray-200 px-2.5 py-1.5 rounded-lg text-gray-600 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask anything about invoices, cash flow, or debtors..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
