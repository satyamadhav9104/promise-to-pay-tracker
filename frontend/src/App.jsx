import React, { useState } from 'react';
import { LayoutDashboard, FileText, Activity, BarChart3, Settings, ShieldCheck, Key, ArrowLeft, Sparkles, FileSpreadsheet, Bot } from 'lucide-react';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import Dashboard from './pages/Dashboard';
import InvoicesPage from './pages/InvoicesPage';
import AuditPage from './pages/AuditPage';
import MetricsPage from './pages/MetricsPage';
import SettingsPage from './pages/SettingsPage';
import CreateInvoiceModal from './components/CreateInvoiceModal';
import BulkImportModal from './components/BulkImportModal';
import AICopilotDrawer from './components/AICopilotDrawer';
import ToastNotification from './components/ToastNotification';
import { setUseMockFallback } from './api/client';

export default function App({ missingKey = false }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authModalMode, setAuthModalMode] = useState(null); // 'sign-in' | 'sign-up' | null
  const [isGlobalCreateModalOpen, setIsGlobalCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  React.useEffect(() => {
    setUseMockFallback(isDemoMode);
  }, [isDemoMode]);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const mainDashboardUI = (
    <div className="flex h-screen w-full font-sans text-gray-900 bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar with persistent + Add New Invoice button */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddInvoice={() => setIsGlobalCreateModalOpen(true)}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
      />

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

        {/* Demo Mode Top Banner */}
        {isDemoMode && !missingKey && (
          <div className="bg-indigo-900 text-indigo-100 px-4 py-2 flex items-center justify-between text-xs border-b border-indigo-800 z-40 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase text-[10px] tracking-wider border border-indigo-400/30">
                Demo Mode
              </span>
              <span>
                Exploring SmartInvoice with rich mock invoices. Click <strong>Sign In</strong> to connect your live backend API.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDemoMode(false)}
                className="text-indigo-300 hover:text-white flex items-center gap-1 font-medium underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
              </button>
              <button
                onClick={() => setAuthModalMode('sign-in')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg font-semibold transition"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <header className="sm:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-30 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              ⚡
            </div>
            <span className="text-lg font-semibold text-gray-800">SmartInvoice</span>
          </div>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setIsAICopilotOpen(true)}
              className="text-xs bg-indigo-50 text-indigo-600 p-2 rounded-lg font-bold flex items-center shadow-xs"
              title="AI Copilot"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsGlobalCreateModalOpen(true)}
              className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm"
            >
              + Add
            </button>
            {!missingKey && !isDemoMode && <UserButton afterSignOutUrl="/" />}
            {isDemoMode && (
              <button
                onClick={() => setAuthModalMode('sign-in')}
                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-lg font-medium"
              >
                Sign In
              </button>
            )}
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
          {activeTab === 'dashboard' && (
            <Dashboard
              key={refreshKey}
              onOpenAddInvoice={() => setIsGlobalCreateModalOpen(true)}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
              onOpenAICopilot={() => setIsAICopilotOpen(true)}
            />
          )}
          {activeTab === 'invoices' && (
            <InvoicesPage
              key={refreshKey}
              onOpenAddInvoice={() => setIsGlobalCreateModalOpen(true)}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
            />
          )}
          {activeTab === 'audit' && <AuditPage key={refreshKey} />}
          {activeTab === 'metrics' && <MetricsPage key={refreshKey} />}
          {activeTab === 'settings' && <SettingsPage key={refreshKey} onNotify={showToast} />}
        </div>

        {/* Floating Quick Action Button for AI Copilot */}
        <button
          onClick={() => setIsAICopilotOpen(true)}
          className="fixed bottom-6 right-6 z-30 hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-3 rounded-full shadow-lg shadow-indigo-300 hover:shadow-indigo-400 transition-all transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4 animate-spin text-amber-300" style={{ animationDuration: '4s' }} />
          <span>Ask AI Copilot</span>
        </button>
      </main>

      {/* Global Add Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isGlobalCreateModalOpen}
        onClose={() => setIsGlobalCreateModalOpen(false)}
        onSuccess={() => {
          setIsGlobalCreateModalOpen(false);
          showToast('Invoice created successfully!');
          triggerRefresh();
        }}
      />

      {/* Global Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={(count) => {
          setIsBulkImportOpen(false);
          showToast(`Successfully imported ${count} invoices!`);
          triggerRefresh();
        }}
      />

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
      />

      {/* Toast Notification Provider */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );

  // If missing key, render dashboard preview mode directly
  if (missingKey) {
    return mainDashboardUI;
  }


  // Auth modal overlay when user clicks Sign In or Sign Up
  const authModalOverlay = authModalMode && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 max-w-md w-full relative space-y-4">
        <button
          onClick={() => setAuthModalMode(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
        >
          ✕
        </button>
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> SmartInvoice Authentication
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {authModalMode === 'sign-in' ? 'Sign In to SmartInvoice' : 'Create Your Free Account'}
          </h3>
        </div>
        <div className="flex justify-center pt-2">
          {authModalMode === 'sign-in' ? (
            <SignIn routing="virtual" />
          ) : (
            <SignUp routing="virtual" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SignedIn>
        {mainDashboardUI}
      </SignedIn>
      <SignedOut>
        {isDemoMode ? (
          <>
            {mainDashboardUI}
            {authModalOverlay}
          </>
        ) : (
          <>
            <LandingPage
              onTryDemo={() => setIsDemoMode(true)}
              onOpenAuth={(mode) => setAuthModalMode(mode || 'sign-in')}
            />
            {authModalOverlay}
          </>
        )}
      </SignedOut>
    </>
  );
}
