import React, { useState } from 'react';
import { LayoutDashboard, FileText, Activity, BarChart3, Settings, ShieldCheck } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen w-full font-sans text-gray-900 bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="sm:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-30 relative">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-lg font-semibold text-gray-800">SmartInvoice</span>
          </div>
          <div className="flex gap-1">
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

          {activeTab !== 'dashboard' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in">
              <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-6">
                {activeTab === 'invoices' && <FileText className="w-10 h-10 text-indigo-400" />}
                {activeTab === 'audit' && <Activity className="w-10 h-10 text-indigo-400" />}
                {activeTab === 'metrics' && <BarChart3 className="w-10 h-10 text-indigo-400" />}
                {activeTab === 'settings' && <Settings className="w-10 h-10 text-indigo-400" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 capitalize">{activeTab} Module</h2>
              <p className="text-gray-500 max-w-md">
                This module connects directly to your Promise-to-Pay recovery engine. Return to the dashboard for live management.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-8 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
              >
                Return to Dashboard Overview
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
