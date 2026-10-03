import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Check, Shield, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function MemberMembership() {
  const { user } = useAuth();
  const member = user?.member;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Your Membership Subscription</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your enrolled tier, expiry countdown, booking limits, and club discounts.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Current Tier</div>
              <h2 className="text-2xl font-black text-white">{member?.plan_name || 'Gold Championship Plan'}</h2>
              <div className="text-xs text-slate-400">Member ID: <span className="font-mono font-bold text-white">{member?.member_code}</span></div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              member?.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
            }`}>
              ● {member?.status || 'Active'}
            </span>
            <div className="text-[11px] text-slate-400 mt-2">
              Valid through: <strong className="text-white font-mono">{member?.expiry_date}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Daily Booking Limit</div>
            <div className="text-2xl font-black font-mono text-emerald-400">{member?.daily_booking_limit || 2} court(s) / day</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Shop Retail Discount</div>
            <div className="text-2xl font-black font-mono text-amber-400">{member?.shop_discount_pct || 10}% off</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Bar & Cafe Discount</div>
            <div className="text-2xl font-black font-mono text-sky-400">{member?.bar_discount_pct || 15}% off</div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Included Benefits</h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Priority 14-day advance booking window on all tournament clay & hard courts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Full locker, sauna, and shower facility access in the North Pavilion</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Complimentary access to Friday evening Sunset Doubles social mix-ins</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Digital member bar tab privileges with automatic discount deduction</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
