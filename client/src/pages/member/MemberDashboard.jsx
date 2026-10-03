import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, ShoppingBag, Wine, Trophy, Clock, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function MemberDashboard({ onSelectTab }) {
  const { user, token } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bkgRes, ordRes] = await Promise.all([
          fetch('/api/bookings/my', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/shop/orders', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (bkgRes.ok) setMyBookings(await bkgRes.json());
        if (ordRes.ok) setMyOrders(await ordRes.json());
      } catch (err) {
        console.error('Failed to load member dashboard info:', err);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadData();
  }, [token]);

  const member = user?.member;
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingBookings = myBookings.filter(b => b.date >= todayStr && b.status !== 'Cancelled');
  const nextBooking = upcomingBookings[0] || null;

  // Calculate daily allowance remaining
  const bookingsToday = myBookings.filter(b => b.date === todayStr && b.status !== 'Cancelled').length;
  const dailyLimit = member?.daily_booking_limit || 2;
  const allowanceRemaining = Math.max(0, dailyLimit - bookingsToday);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Greeting & Membership Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{member?.plan_name || 'Gold Championship Member'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-xs text-slate-400">
            Member Code: <span className="font-mono text-emerald-400 font-bold">{member?.member_code}</span> • Status: <span className="text-emerald-400 font-bold">{member?.status}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onSelectTab('bookings')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Court Now</span>
          </button>
          <button
            onClick={() => onSelectTab('shop')}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
          >
            Pro Shop
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Remaining Bookings</div>
          <div className="text-3xl font-black font-mono text-emerald-400">{allowanceRemaining} <span className="text-xs text-slate-400 font-normal">/ {dailyLimit} daily</span></div>
          <div className="text-[10px] text-slate-500">Resets every midnight</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Membership Expiry</div>
          <div className="text-xl font-bold font-mono text-white">{member?.expiry_date || '2027-10-01'}</div>
          <div className="text-[10px] text-emerald-400 font-semibold">Active & in good standing</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tier Privileges</div>
          <div className="text-lg font-bold text-amber-400">{member?.court_discount_pct || 20}% Court Off</div>
          <div className="text-[10px] text-slate-400">10% Shop • 15% Clubhouse Bar</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Loyalty Points</div>
          <div className="text-3xl font-black font-mono text-sky-400">{member?.loyalty_points || 340} pts</div>
          <div className="text-[10px] text-slate-400">Redeemable for clinic vouchers</div>
        </div>
      </div>

      {/* Next Upcoming Booking & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Booking Card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Next Upcoming Court Reservation</span>
            </h3>
            <button
              onClick={() => onSelectTab('bookings')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              View All ({upcomingBookings.length})
            </button>
          </div>

          {nextBooking ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {nextBooking.sport_name || 'Tennis'}
                  </span>
                  <span className="font-bold text-white text-sm">{nextBooking.court_name}</span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-3">
                  <span>📅 Date: <strong>{nextBooking.date}</strong></span>
                  <span>⏰ Time: <strong>{nextBooking.start_time} - {nextBooking.end_time}</strong></span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Ref: <span className="font-mono text-emerald-400">{nextBooking.booking_code}</span> • Paid: ${Number(nextBooking.price).toFixed(2)}
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Confirmed
              </span>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-slate-400">You have no upcoming court bookings reserved.</p>
              <button
                onClick={() => onSelectTab('bookings')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md"
              >
                Reserve a Slot Today
              </button>
            </div>
          )}
        </div>

        {/* Pro Shop Orders Snapshot */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Recent Shop Purchases</span>
            </h3>
            <button onClick={() => onSelectTab('shop')} className="text-xs text-emerald-400 hover:underline">
              Shop Now
            </button>
          </div>

          {myOrders.length > 0 ? (
            <div className="space-y-2">
              {myOrders.slice(0, 3).map(order => (
                <div key={order.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-white">{order.order_number}</div>
                    <div className="text-[10px] text-slate-400">{order.order_type} • {order.created_at.slice(0, 10)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">${order.total_amount.toFixed(2)}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No recent purchases. Check out racquets and club gear in the Pro Shop!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
