import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Users,
  Sparkles,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenAddInvoice,
  onOpenBulkImport,
  onOpenAICopilot
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices & PTP', icon: FileText },
    { id: 'metrics', label: 'Recovery Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
    { id: 'settings', label: 'Settings & Rules', icon: Settings },
  ];

  let user = null;
  try {
    const clerkUserObj = useUser();
    user = clerkUserObj?.user;
  } catch (e) {
    // Fallback if ClerkProvider is not present
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'Admin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden sm:flex z-20 shadow-xs relative">
      {/* Sidebar Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-200">
            ⚡
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-gray-900 block leading-tight">SmartInvoice</span>
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">AI Recovery SaaS</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pt-5 pb-2 space-y-2">
        <button
          onClick={onOpenAddInvoice}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>

        <button
          onClick={onOpenAICopilot}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm shadow-violet-200 transition active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Copilot Assistant
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">Workspace</div>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}

        <div className="pt-3">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">Quick Tools</div>
          <button
            onClick={onOpenBulkImport}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-gray-400" />
            Bulk CSV Import
          </button>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/70">
        <div className="flex items-center gap-3">
          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center text-indigo-700 font-bold text-xs">
              {initials}
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-gray-800 truncate">
              {user ? user.fullName || user.primaryEmailAddress?.emailAddress : 'Collections Admin'}
            </span>
            <span className="text-[10px] text-gray-400">Enterprise Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}


