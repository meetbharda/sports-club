import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, Shield, ArrowRight } from 'lucide-react';

export default function Facilities({ onNavigate, onOpenAuth }) {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');

  useEffect(() => {
    async function loadCourts() {
      try {
        const res = await fetch('/api/public/courts');
        if (res.ok) {
          const data = await res.json();
          setCourts(data);
        }
      } catch (err) {
        console.error('Failed to load courts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourts();
  }, []);

  const sportsFilter = ['all', 'Tennis', 'Badminton', 'Cricket'];

  const filteredCourts = courts.filter(c => {
    if (selectedSport === 'all') return true;
    return c.sport_name?.toLowerCase() === selectedSport.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Arena Inventory & Schedule</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Courts & Facilities</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Explore our tournament courts, surface types, and real-time operating availability.
          Members can reserve courts in 30-minute intervals through the Member Portal.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2">
        {sportsFilter.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              selectedSport === sport
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {sport === 'all' ? 'All Courts & Arenas' : sport}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading courts and schedules...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map(court => (
            <div key={court.id} className="glass-panel rounded-2xl overflow-hidden glass-card-hover border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={court.image_url || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80'}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/90 text-emerald-400 border border-slate-800">
                    {court.sport_name}
                  </span>
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    court.status === 'Available' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  }`}>
                    ● {court.status}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{court.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{court.facility_name} • {court.location}</span>
                    </div>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Surface Type</div>
                      <div className="font-semibold text-slate-200">{court.court_type}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Operating Hours</div>
                      <div className="font-semibold text-slate-200">06:00 - 23:00</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Member: </span>
                      <span className="font-mono font-bold text-emerald-400">${court.hourly_rate_member}/hr</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Walk-in: </span>
                      <span className="font-mono font-semibold text-slate-300">${court.hourly_rate_walkin}/hr</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Instant confirmation
                </span>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
