import React from 'react';
import { ArrowRight, Trophy, Zap, Activity, Users, Shield, Calendar, Award, Star, Clock, MapPin, Sparkles } from 'lucide-react';

export default function Home({ onNavigate, onOpenAuth }) {
  const sports = [
    {
      name: 'Championship Tennis',
      desc: '3 Red Clay and DecoTurf tournament courts with professional floodlights & Hawkeye tracking.',
      image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
      badge: 'Clay & Hard',
      rate: 'From $20/hr'
    },
    {
      name: 'Pro Badminton Arena',
      desc: 'BWF certified sprung wooden floors and tournament PVC mats with zero-glare lumination.',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      badge: 'BWF Certified',
      rate: 'From $18/hr'
    },
    {
      name: 'Elite Cricket Complex',
      desc: 'Indoor automated programmable bowling machine lanes and natural outdoor spin match nets.',
      image: 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?auto=format&fit=crop&w=800&q=80',
      badge: 'Bowling Machines',
      rate: 'From $25/hr'
    },
  ];

  const highlights = [
    { title: 'Digital Court Operating System', desc: 'Real-time 30-minute slot availability, instant booking engine, and zero double-bookings.', icon: Shield },
    { title: 'Full Pro Retail & Stringing', desc: 'Wilson, Yonex, and Asics pro gear with custom tension racquet stringing services.', icon: Trophy },
    { title: 'Clubhouse Bar & Kitchen', desc: 'Craft nitro coffees, organic recovery protein shakes, artisan burgers and member tabs.', icon: Sparkles },
    { title: 'Social Friday Mixers', desc: 'Weekly community tournaments, clinics, and mixer evenings for every athletic level.', icon: Users },
  ];

  const testimonials = [
    { name: 'Alexander Wright', role: 'Club Champion 2025', quote: 'The surface quality on Center Clay is on par with Roland Garros practice facilities. Having instant court booking on my phone has transformed how our team trains.' },
    { name: 'Elena Rostova', role: 'Badminton League Finalist', quote: 'The BWF mats protect joints during high-impact lunges, and the social mix-ins on Friday evenings are the highlight of my week.' },
    { name: 'Marcus Vance', role: 'Head Coach', quote: 'We run a high-performance athletic academy with automated bowling machines and video analysis. Truly world-class infrastructure.' },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-8">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80"
            alt="Champions Club Athletic Arena"
            className="w-full h-full object-cover opacity-25 filter brightness-75 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-transparent to-[#0b0f19]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pt-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5" />
            <span>Grand Opening Season 2026 • Exclusive Memberships Open</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
            The Club Where <br />
            <span className="sports-gradient-text">Champions Play.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Welcome to the premier multi-sport destination for Tennis, Badminton, and Cricket.
            Engineered for competitive athletes, social enthusiasts, and community camaraderie.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('trial')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <span>Book a Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('membership')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition-all backdrop-blur-md"
            >
              Explore Memberships
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-800/80 max-w-3xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">7+</div>
              <div className="text-xs text-slate-400 font-medium">Tournament Courts</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 font-medium">Real-Time Booking</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-sky-400">17 hrs</div>
              <div className="text-xs text-slate-400 font-medium">Daily 06:00 - 23:00</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400">VIP</div>
              <div className="text-xs text-slate-400 font-medium">Lounge & Bar POS</div>
            </div>
          </div>
        </div>
      </section>

      {/* SPORTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Our Athletic Arenas</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">World-Class Multi-Sport Facilities</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Tour-grade surfaces, precision LED tournament lighting, and Olympic coaching staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sports.map((sport, idx) => (
            <div key={idx} className="glass-panel rounded-2xl overflow-hidden glass-card-hover group flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/90 text-emerald-400 border border-slate-700/60 backdrop-blur-md">
                  {sport.badge}
                </span>
                <span className="absolute bottom-3 right-4 font-mono font-bold text-xs text-white bg-slate-950/80 px-2 py-1 rounded">
                  {sport.rate}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {sport.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {sport.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <button
                    onClick={() => onNavigate('facilities')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    View Availability <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('trial')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                  >
                    Trial Slot
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HIGHLIGHTS / CLUB OPERATING SYSTEM */}
      <section className="bg-slate-900/40 border-y border-slate-800/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl glass-card border border-slate-800/80 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Tiers & Privileges</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Configurable Membership Plans</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Choose the tier tailored to your ambition. Enjoy booking allowances, retail discounts, and lounge access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Gold */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
              Most Popular • Championship Tier
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">Gold Championship</h3>
                <p className="text-xs text-slate-400 mt-1">Full premier court privileges and peak priority.</p>
              </div>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black font-mono">$149</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ 2 bookings per day</li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ 14-day advance reservation</li>
                <li className="flex items-center gap-2">✓ 10% Pro Shop discount</li>
                <li className="flex items-center gap-2">✓ 15% Clubhouse Bar discount</li>
                <li className="flex items-center gap-2">✓ Complimentary racquet restringing (1x/mo)</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('membership')}
              className="mt-8 w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
            >
              Select Gold Plan
            </button>
          </div>

          {/* Silver */}
          <div className="p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">Silver Club</h3>
                <p className="text-xs text-slate-400 mt-1">Standard member access with essential amenities.</p>
              </div>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black font-mono">$89</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ 1 booking per day</li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ 7-day advance reservation</li>
                <li className="flex items-center gap-2">✓ 5% Pro Shop discount</li>
                <li className="flex items-center gap-2">✓ 5% Clubhouse Bar discount</li>
                <li className="flex items-center gap-2">✓ Member rates for social mix-ins</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('membership')}
              className="mt-8 w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Select Silver Plan
            </button>
          </div>

          {/* Junior */}
          <div className="p-8 rounded-3xl glass-panel border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">Junior Stars</h3>
                <p className="text-xs text-slate-400 mt-1">Under 18 youth athletic development program.</p>
              </div>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black font-mono">$49</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ 1 booking per day</li>
                <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ 5-day advance reservation</li>
                <li className="flex items-center gap-2">✓ Academy clinic discounts</li>
                <li className="flex items-center gap-2">✓ 5% Pro Shop & Bar discount</li>
                <li className="flex items-center gap-2">✓ Supervised junior court sessions</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('membership')}
              className="mt-8 w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Select Junior Plan
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Athlete Feedback</span>
          <h2 className="text-3xl font-black text-white">What Our Members Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-white">{t.name}</div>
                  <div className="text-[10px] text-emerald-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-10 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Ready to Take the Court?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Book a complimentary trial session or register as a club member today. Your arena awaits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('trial')}
              className="px-8 py-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-xl shadow-emerald-500/20"
            >
              Book Complimentary Trial
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-8 py-3.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-all"
            >
              Instant Member Registration
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
