import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User, Sparkles, ChevronDown, Check } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Owner / Super Admin', email: 'owner@championsclub.demo', badge: 'Full Control', color: 'bg-purple-900/60 text-purple-300 border-purple-700/50' },
  { role: 'frontdesk', label: 'Front Desk / Concierge', email: 'frontdesk@championsclub.demo', badge: 'Reception', color: 'bg-blue-900/60 text-blue-300 border-blue-700/50' },
  { role: 'coach', label: 'Head Coach', email: 'coach@championsclub.demo', badge: 'Clinics', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' },
  { role: 'shop', label: 'Pro Shop Lead', email: 'shop@championsclub.demo', badge: 'POS & Inventory', color: 'bg-amber-900/60 text-amber-300 border-amber-700/50' },
  { role: 'bar', label: 'Clubhouse Bar & Cafe', email: 'bar@championsclub.demo', badge: 'Tables & KDS', color: 'bg-rose-900/60 text-rose-300 border-rose-700/50' },
  { role: 'finance', label: 'Finance Controller', email: 'finance@championsclub.demo', badge: 'P&L & Invoices', color: 'bg-teal-900/60 text-teal-300 border-teal-700/50' },
  { role: 'hr', label: 'HR & Roster Lead', email: 'hr@championsclub.demo', badge: 'Staff & Shifts', color: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50' },
  { role: 'member', label: 'Gold Member (Alexander)', email: 'member@championsclub.demo', badge: 'Gold VIP', color: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50' },
  { role: 'member', label: 'Silver Member (Elena)', email: 'silver.member@championsclub.demo', badge: 'Silver', color: 'bg-slate-700/60 text-slate-200 border-slate-600/50' },
  { role: 'member', label: 'Expired Member (Arthur)', email: 'expired.member@championsclub.demo', badge: 'Expired Test', color: 'bg-red-950/60 text-red-300 border-red-800/50' },
];

export default function DemoSwitcher({ onRoleSwitch }) {
  const { user, login } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSelect = async (account) => {
    try {
      setSwitching(true);
      await login(account.email, 'Champion#2026');
      setOpen(false);
      if (onRoleSwitch) onRoleSwitch(account.role);
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Demo Switcher</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-panel rounded-xl shadow-2xl z-50 p-2 border border-slate-700/80 animate-in fade-in slide-in-from-top-2">
          <div className="px-2 py-1.5 border-b border-slate-800 flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dev Role Switcher (1-Click)</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">Pass: Champion#2026</span>
          </div>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((acc, idx) => {
              const isActive = user?.email === acc.email;
              return (
                <button
                  key={idx}
                  disabled={switching}
                  onClick={() => handleSelect(acc)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                    isActive ? 'bg-slate-800/90 text-white font-medium' : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold flex items-center gap-1.5">
                      {acc.label}
                      {isActive && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.email}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${acc.color} whitespace-nowrap`}>
                    {acc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
