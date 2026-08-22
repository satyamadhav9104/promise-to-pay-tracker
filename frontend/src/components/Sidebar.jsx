import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Activity,
  BarChart3,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenAddInvoice }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'audit', label: 'Audit Trail & Rules', icon: Activity },
    { id: 'metrics', label: 'Recovery Metrics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Clerk hook to access user metadata safely
  let user = null;
  try {
    const clerkUserObj = useUser();
    user = clerkUserObj?.user;
  } catch (e) {
    // Graceful fallback if ClerkProvider is not present
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden sm:flex z-20 shadow-sm relative">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
          S
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold tracking-tight text-gray-800">SmartInvoice</span>
          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Promise-to-Pay</span>
        </div>
      </div>

      {/* Primary Action Button in Sidebar */}
      <div className="px-4 pt-4">
        <button
          onClick={onOpenAddInvoice}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-xs"
        >
          <span className="text-base font-bold">+</span> Add New Invoice
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Track & User Profile Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
        <div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100/80 text-xs text-indigo-800 space-y-1">
          <div className="flex items-center gap-1 font-semibold text-indigo-900">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Razorpay Track 03
          </div>
          <p className="text-[11px] text-indigo-700 leading-tight">AI Revenue Recovery Agent v1.0.0</p>
        </div>

        {/* User Account / Profile Section */}
        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-gray-800 truncate">
                {user ? user.fullName || user.primaryEmailAddress?.emailAddress || 'User' : 'Collections Admin'}
              </span>
              <span className="text-[10px] text-gray-500 truncate">
                {user ? user.primaryEmailAddress?.emailAddress : 'Authenticated'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

