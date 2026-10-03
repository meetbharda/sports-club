import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/public/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'Website Contact'
        })
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Connect With Concierge</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Contact The Champions Club</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Our front desk and athletic operations staff are on-site daily to assist with membership inquiries, tournaments, and court bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-white">Grand Sports Enclave</h3>
            
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>450 Champions Way, Grand Sports Enclave, CA 90210</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+1 (555) 242-6746 (Reception Concierge)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>concierge@championsclub.demo</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Operating Facility Hours:</div>
                  <div className="text-slate-400">Monday - Sunday: 06:00 AM - 11:00 PM</div>
                  <div className="text-slate-400">Bar & Kitchen: 07:00 AM - 10:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Club Pavilion Location</div>
            <div className="h-64 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80"
                alt="Map Background"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-[#0b0f19]/70" />
              <div className="relative text-center p-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <MapPin className="w-6 h-6 animate-pulse" />
                </div>
                <div className="font-bold text-sm text-white">The Champions Club Campus</div>
                <div className="text-xs text-slate-400 mt-0.5">North Courts • East Badminton Dome • West Turf Nets</div>
                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                  Valet & EV Charging On Site
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800">
          {submitted ? (
            <div className="text-center py-16 space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Message Delivered</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Thank you for reaching out. Our front desk manager will review your note and respond promptly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-bold text-xl text-white">Direct Concierge Message</h3>
              <p className="text-xs text-slate-400">
                Inquire about private clinic reservations, corporate tournament packages, or locker memberships.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jonathan Davis"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jonathan@example.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our concierge team assist you today?"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
