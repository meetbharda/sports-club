import React, { useState, useEffect } from 'react';
import { Check, Shield, Trophy, Sparkles, ArrowRight } from 'lucide-react';

export default function Membership({ onNavigate, onOpenAuth }) {
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch('/api/public/membership-plans');
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (err) {
        console.error('Failed to load membership plans:', err);
      }
    }
    loadPlans();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Official Club Memberships</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Elevate Your Athletic Standard</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          All memberships include verified access to tournament courts, pro retail discounts, locker facilities, and clubhouse privileges.
        </p>

        {/* Billing cycle switch */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'monthly' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              billingCycle === 'annual' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Annual (Save 15%)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map(plan => {
          const isGold = plan.code === 'GOLD';
          const price = billingCycle === 'annual' ? (plan.annual_price / 12).toFixed(0) : plan.monthly_price;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                isGold
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 scale-105 z-10'
                  : 'glass-panel border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isGold && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md">
                  Premier Champion Choice
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1.5 text-white">
                  <span className="text-5xl font-black font-mono tracking-tight">${price}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tier Privileges</div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.daily_booking_limit} court booking(s)</strong> per day</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.priority_days_advance}-day advance</strong> court reservations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.court_discount_pct}% discount</strong> on court bookings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.shop_discount_pct}% discount</strong> at Pro Gear Shop</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>{plan.bar_discount_pct}% discount</strong> at Bar & Cafeteria</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Invitations to Friday social mixers & ladders</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onOpenAuth('register')}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isGold
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <span>Join {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
