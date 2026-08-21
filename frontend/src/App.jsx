import React from 'react';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              P
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              Promise-to-Pay Tracker
            </span>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Closed-Loop Revenue Recovery Agent
          </div>
        </div>
      </header>

      <main>
        <Dashboard />
      </main>
    </div>
  );
}
