import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, UserPlus, Calendar, CheckCircle, Clock, ShieldCheck, ArrowRight, Phone, Mail, UserCheck, X } from 'lucide-react';

export default function FrontDeskDashboard({ onNavigatePublic }) {
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);

  // New member form
  const [newMemberForm, setNewMemberForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    plan_id: 1,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  // Walk-in booking form
  const [walkinForm, setWalkinForm] = useState({
    court_id: 1,
    guest_name: '',
    guest_phone: '',
    start_time: '14:00',
    end_time: '15:00',
    payment_method: 'cash'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      const [bkgRes, courtsRes] = await Promise.all([
        fetch(`/api/bookings?date=${todayStr}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/public/courts')
      ]);
      if (bkgRes.ok) setTodayBookings(await bkgRes.json());
      if (courtsRes.ok) {
        const cData = await courtsRes.json();
        setCourts(cData);
        if (cData.length > 0) setWalkinForm(prev => ({ ...prev, court_id: cData[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Universal Member Search
  const handleSearch = async (query) => {
    setSearchTerm(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open full member profile
  const handleOpenMember = async (memberId) => {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedMember(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check in a booking
  const handleCheckIn = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Member successfully checked in!');
        loadData();
      }
    } catch (err) {
      alert(`Check-in failed: ${err.message}`);
    }
  };

  // Create Walk-in Booking
  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          court_id: walkinForm.court_id,
          date: todayStr,
          start_time: walkinForm.start_time,
          end_time: walkinForm.end_time,
          booking_type: 'walk-in',
          guest_name: walkinForm.guest_name,
          guest_phone: walkinForm.guest_phone,
          payment_method: walkinForm.payment_method
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Walk-in booking failed');

      alert(`Walk-in booked! Code: ${data.booking.booking_code}, Rate: $${data.booking.price.toFixed(2)}`);
      setShowWalkinModal(false);
      loadData();
    } catch (err) {
      alert(`Walk-in error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create New Member
  const handleCreateMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMemberForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Member creation failed');

      alert(`Member created successfully! Member Code: ${data.member_code}`);
      setShowRegModal(false);
      setNewMemberForm({ full_name: '', email: '', phone: '', plan_id: 1, emergency_contact_name: '', emergency_contact_phone: '', notes: '' });
      handleSearch(data.member_code);
    } catch (err) {
      alert(`Error creating member: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Front Desk Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase">
              Front Desk Concierge
            </span>
            <span className="text-xs text-slate-400">Date: {todayStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Reception & Member Operations</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWalkinModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Walk-in Booking</span>
          </button>

          <button
            onClick={() => setShowRegModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* UNIVERSAL FAST MEMBER SEARCH */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Fast Universal Member Search</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type Member ID (e.g. MEM-1001), Full Name, Phone, or Email..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Search Results Dropdown/List */}
        {searchResults.length > 0 && (
          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-900/90 animate-in fade-in">
            {searchResults.map(m => (
              <div
                key={m.id}
                onClick={() => handleOpenMember(m.id)}
                className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{m.full_name}</span>
                    <span className="font-mono text-emerald-400 text-[10px]">({m.member_code})</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                      m.status === 'Active' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {m.email} • {m.phone || 'No phone'} • Plan: {m.plan_name}
                  </div>
                </div>

                <button className="px-3 py-1 text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <span>Open Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODAY'S SCHEDULE & CHECK-INS */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-base text-white">Today's Court Bookings & Check-ins</h3>
          </div>
          <span className="text-xs text-slate-400">{todayBookings.length} booking(s) scheduled today</span>
        </div>

        {todayBookings.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No bookings scheduled for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Court</th>
                  <th className="p-3">Player / Guest</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {todayBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-white">{b.start_time} - {b.end_time}</td>
                    <td className="p-3">{b.court_name}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{b.member_name || b.guest_name}</div>
                      <div className="text-[10px] text-slate-400">{b.member_phone || b.guest_phone || b.member_email}</div>
                    </td>
                    <td className="p-3 capitalize">{b.booking_type}</td>
                    <td className="p-3 font-mono">${Number(b.price).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'Checked In' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        b.status === 'Confirmed' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCheckIn(b.id)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MEMBER PROFILE MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-lg text-white">{selectedMember.member.full_name}</h3>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-emerald-400 font-bold">{selectedMember.member.member_code}</span>
                  <span>•</span>
                  <span>Plan: {selectedMember.member.plan_name}</span>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-300">
              {/* Member details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Status</div>
                  <div className="font-bold text-emerald-400">{selectedMember.member.status}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Expiry Date</div>
                  <div className="font-mono font-semibold text-white">{selectedMember.member.expiry_date}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Phone</div>
                  <div className="font-semibold text-white">{selectedMember.member.phone || 'N/A'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Points</div>
                  <div className="font-mono font-bold text-sky-400">{selectedMember.member.loyalty_points || 0} pts</div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="space-y-2">
                <div className="font-bold text-white text-sm">Recent Member Bookings</div>
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                  {selectedMember.recentBookings.length === 0 ? (
                    <div className="p-3 text-slate-500">No recent bookings</div>
                  ) : (
                    selectedMember.recentBookings.map(b => (
                      <div key={b.id} className="p-2.5 flex items-center justify-between">
                        <span>{b.court_name} • {b.date} ({b.start_time}-{b.end_time})</span>
                        <span className="font-mono font-bold text-emerald-400">${b.price.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Invoices */}
              <div className="space-y-2">
                <div className="font-bold text-white text-sm">Member Invoices</div>
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                  {selectedMember.invoices.length === 0 ? (
                    <div className="p-3 text-slate-500">No invoices</div>
                  ) : (
                    selectedMember.invoices.map(inv => (
                      <div key={inv.id} className="p-2.5 flex items-center justify-between">
                        <span>{inv.invoice_number} ({inv.invoice_type}) - {inv.issue_date}</span>
                        <span className="font-mono font-bold text-white">${inv.total_amount.toFixed(2)} ({inv.status})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALKIN BOOKING MODAL */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Create Walk-in Reservation</h3>
              <button onClick={() => setShowWalkinModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Court</label>
                <select
                  value={walkinForm.court_id}
                  onChange={(e) => setWalkinForm({ ...walkinForm, court_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - Walk-in: ${c.hourly_rate_walkin}/hr
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  value={walkinForm.guest_name}
                  onChange={(e) => setWalkinForm({ ...walkinForm, guest_name: e.target.value })}
                  placeholder="e.g. Robert Smith"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Guest Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={walkinForm.guest_phone}
                  onChange={(e) => setWalkinForm({ ...walkinForm, guest_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={walkinForm.start_time}
                    onChange={(e) => setWalkinForm({ ...walkinForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={walkinForm.end_time}
                    onChange={(e) => setWalkinForm({ ...walkinForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={walkinForm.payment_method}
                  onChange={(e) => setWalkinForm({ ...walkinForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="cash">Cash Received</option>
                  <option value="card">Card Terminal</option>
                  <option value="upi">UPI / Instant QR</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Confirm Walk-in & Collect Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW MEMBER REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Register New Club Member</h3>
              <button onClick={() => setShowRegModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.full_name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })}
                  placeholder="e.g. Claire Wright"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  placeholder="claire@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Membership Tier</label>
                <select
                  value={newMemberForm.plan_id}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, plan_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>Gold Championship ($149/mo)</option>
                  <option value={2}>Silver Club ($89/mo)</option>
                  <option value={3}>Junior Stars ($49/mo)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Emergency Contact (Name & Phone)</label>
                <input
                  type="text"
                  value={newMemberForm.emergency_contact_name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, emergency_contact_name: e.target.value })}
                  placeholder="e.g. David Wright (+1 555-9988)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md"
              >
                Register & Issue Member ID
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
