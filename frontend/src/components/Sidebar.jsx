import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Users,
  User
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenAddInvoice }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
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
    : 'JD';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden sm:flex z-20 shadow-sm relative">
      {/* Sidebar Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-inner">
          S
        </div>
        <span className="text-xl font-semibold tracking-tight text-gray-800">SmartInvoice</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center text-indigo-700 font-bold">
              {initials}
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-gray-800 truncate">
              {user ? user.fullName || user.primaryEmailAddress?.emailAddress : 'Jane Doe'}
            </span>
            <span className="text-xs text-gray-500">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

