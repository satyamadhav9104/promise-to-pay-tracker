import React, { useState } from 'react';
import { LayoutDashboard, FileText, Activity, BarChart3, Settings, ShieldCheck, Key, Lock } from 'lucide-react';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import InvoicesPage from './pages/InvoicesPage';
import AuditPage from './pages/AuditPage';
import MetricsPage from './pages/MetricsPage';
import SettingsPage from './pages/SettingsPage';

export default function App({ missingKey = false }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const mainDashboardUI = (
    <div className="flex h-screen w-full font-sans text-gray-900 bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Missing Key Warning Banner if VITE_CLERK_PUBLISHABLE_KEY is not set */}
        {missingKey && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 z-40">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Clerk Auth Setup:</strong> Please add your <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">frontend/.env</code> from the Clerk Dashboard.
              </span>
            </div>
            <span className="bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-medium text-[11px]">Preview Mode</span>
          </div>
        )}

        {/* Mobile Header */}
        <header className="sm:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-30 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-lg font-semibold text-gray-800">SmartInvoice</span>
          </div>
          <div className="flex gap-1 items-center">
            {!missingKey && <UserButton afterSignOutUrl="/" />}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`p-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`p-2 rounded-lg ${activeTab === 'invoices' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 relative">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'invoices' && <InvoicesPage />}
          {activeTab === 'audit' && <AuditPage />}
          {activeTab === 'metrics' && <MetricsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );


  // If missing key, render dashboard preview mode directly
  if (missingKey) {
    return mainDashboardUI;
  }

  // With ClerkProvider active: split into SignedIn and SignedOut views
  return (
    <>
      <SignedIn>
        {mainDashboardUI}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md text-center mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Razorpay Track 03 • AI Revenue Recovery
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SmartInvoice Collections</h1>
            <p className="text-sm text-gray-600">Promise-to-Pay Closed Loop Recovery System</p>
          </div>

          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex justify-center items-center">
            <SignIn routing="virtual" />
          </div>

          <footer className="mt-8 text-center text-xs text-gray-400">
            Powered by Clerk Authentication & Razorpay AI Recovery Engine
          </footer>
        </div>
      </SignedOut>
    </>
  );
}

