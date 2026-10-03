import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Calendar, ShoppingBag, Wine, Trophy, Receipt, Bell, User, LogOut, ArrowLeft } from 'lucide-react';

export default function MemberLayout({ currentTab, onSelectTab, onNavigatePublic, children }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Court Bookings', icon: Calendar },
    { id: 'shop', label: 'Pro Shop & Orders', icon: ShoppingBag },
    { id: 'bar', label: 'Bar & Lounge Tabs', icon: Wine },
    { id: 'membership', label: 'Membership Plan', icon: Trophy },
    { id: 'invoices', label: 'Invoices & Receipts', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Club Header & Return to Website */}
          <div className="space-y-2">
            <button
              onClick={() => onNavigatePublic('home')}
              className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </button>
            <div className="flex items-center gap-2.5 pt-1">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">MEMBER PORTAL</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{user?.member?.plan_name || 'Athletic Member'}</div>
              </div>
            </div>
          </div>

          {/* Member Card Snapshot */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member ID</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">{user?.member?.member_code || 'MEM-0000'}</span>
            </div>
            <div className="font-bold text-xs text-white truncate">{user?.full_name}</div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Status:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                user?.member?.status === 'Active' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
              }`}>
                {user?.member?.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 rounded-xl bg-slate-950/60 flex items-center justify-between text-xs">
            <div className="truncate mr-2">
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
