import React from 'react';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied({ targetRole, onNavigateDashboard }) {
  const { user, activeRole, getDashboardRoute } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-red-500/40 text-center max-w-lg space-y-6 shadow-2xl bg-gradient-to-b from-slate-900 to-red-950/20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest bg-red-950/80 px-2.5 py-1 rounded-full border border-red-800">
            HTTP 403 Forbidden • Access Denied
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Restricted Area
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your current account role (<strong className="capitalize text-emerald-400">{activeRole || 'Visitor'}</strong>) does not have authorization to view the <strong className="capitalize text-red-300">{targetRole}</strong> portal.
          </p>
          <p className="text-xs text-slate-500">
            All data access is verified at the database and application layer. Unpermitted requests are rejected.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigateDashboard(getDashboardRoute().replace('/', ''))}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to My {activeRole ? activeRole.toUpperCase() : 'PORTAL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
