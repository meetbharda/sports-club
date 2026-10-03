import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wine, Coffee, Utensils, CheckCircle, Clock } from 'lucide-react';

export default function MemberBarTabs() {
  const { user, token } = useAuth();
  const [memberTabs, setMemberTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTabs() {
      if (!user?.member?.id) return;
      try {
        const res = await fetch(`/api/members/${user.member.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMemberTabs(data.barTabs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTabs();
  }, [user, token]);

  const discountPct = user?.member?.bar_discount_pct || 15;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Clubhouse Bar & Lounge Tabs</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review food, beverage, and nutrition orders billed to your member account at table service.
          Your tier automatically receives <strong>{discountPct}% discount</strong>.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Wine className="w-4 h-4 text-amber-400" />
          <span>Your Bar Tabs & Table Receipts</span>
        </h3>

        {memberTabs.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No active or past bar tabs found. Open a tab at the Clubhouse Cafeteria or Lounge anytime!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Tab Number</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Member Discount</th>
                  <th className="p-3">Final Total</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {memberTabs.map(tab => (
                  <tr key={tab.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-amber-400">{tab.order_number}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tab.status === 'Open' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {tab.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono">${tab.subtotal.toFixed(2)}</td>
                    <td className="p-3 font-mono text-emerald-400">-${tab.discount_amount.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-white">${tab.total_amount.toFixed(2)}</td>
                    <td className="p-3">{tab.payment_status}</td>
                    <td className="p-3 text-slate-400">{tab.created_at.slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
