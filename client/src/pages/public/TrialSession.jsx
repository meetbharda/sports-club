import React, { useState } from 'react';
import { Trophy, CheckCircle, Calendar, Clock, Sparkles, Send } from 'lucide-react';

export default function TrialSession() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interested_sport: 'Tennis',
    membership_interest: 'Gold Championship',
    preferred_date: '',
    preferred_time: '10:00 AM',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'Website Trial'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit enquiry');

      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Complimentary Experience</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Book a VIP Trial Session</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Step onto our tournament clay or sprung wooden courts. Experience personal coaching guidance and tour the club.
        </p>
      </div>

      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {success ? (
          <div className="text-center py-12 space-y-5 animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Trial Request Received!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              {success.message}
            </p>
            <div className="inline-block px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400">
              Reference Code: <span className="font-bold text-white">{success.enquiry_code}</span>
            </div>
            <p className="text-xs text-slate-400">
              Our front desk concierge will confirm your allocated court and coach time via phone and email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marcus Sterling"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="marcus@example.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interested Sport *</label>
                <select
                  value={formData.interested_sport}
                  onChange={(e) => setFormData({ ...formData, interested_sport: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Tennis">Championship Tennis (Clay & Hard)</option>
                  <option value="Badminton">Badminton (BWF Tournament Mat)</option>
                  <option value="Cricket">Cricket (Pace Lane & Bowling Machine)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Time Window</label>
                <select
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="08:00 AM">Morning (08:00 AM - 11:00 AM)</option>
                  <option value="11:00 AM">Midday (11:00 AM - 02:00 PM)</option>
                  <option value="04:00 PM">Afternoon (04:00 PM - 07:00 PM)</option>
                  <option value="07:00 PM">Prime Evening (07:00 PM - 10:00 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Athletic Goals or Questions</label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your playing experience, coaching goals, or equipment needs..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting Request...' : 'Confirm Trial Reservation'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
