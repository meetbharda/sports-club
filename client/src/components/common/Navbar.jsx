import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DemoSwitcher from './DemoSwitcher';
import { Trophy, User, LogOut, LayoutDashboard, Menu, X, Bell } from 'lucide-react';

export default function Navbar({ currentRoute, onNavigate, onOpenAuth }) {
  const { user, activeRole, logout, getDashboardRoute } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNavLinks = [
    { id: 'home', label: 'Home' },
    { id: 'sports', label: 'Sports' },
    { id: 'facilities', label: 'Courts & Facilities' },
    { id: 'membership', label: 'Membership' },
    { id: 'shop', label: 'Pro Shop' },
    { id: 'bar', label: 'Bar & Cafe' },
    { id: 'trial', label: 'Book Trial' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              THE CHAMPIONS CLUB
            </span>
            <span className="block text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">
              Premier Sports Enclave
            </span>
          </div>
        </div>

        {/* Desktop Public Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {publicNavLinks.map(link => {
            const isActive = currentRoute === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <DemoSwitcher onRoleSwitch={(role) => onNavigate(getDashboardRoute(role).replace('/', ''))} />

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate(getDashboardRoute().replace('/', ''))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/10"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="capitalize">{activeRole} Portal</span>
              </button>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors border border-slate-700/60"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors border border-slate-700/60"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('trial')}
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20"
              >
                Free Trial
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-4 bg-slate-900 border-b border-slate-800 space-y-1">
          {publicNavLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
