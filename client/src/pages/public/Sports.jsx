import React from 'react';
import { ArrowRight, Trophy, Zap, Target, ShieldCheck, Check } from 'lucide-react';

export default function Sports({ onNavigate }) {
  const sportsDetail = [
    {
      id: 'tennis',
      title: 'Championship Tennis',
      subtitle: 'Clay & Hard Tournament Arenas',
      icon: Trophy,
      image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
      description: 'Our tennis facilities feature 3 international standard courts: Center Red Clay with French imported crushed brick, and 2 DecoTurf tournament cushioned hard courts with 1000-lux anti-shadow LED lighting.',
      features: [
        'French imported Red Clay with automated moisture sub-irrigation',
        '2 DecoTurf cushioned courts matching US Open specifications',
        'Hawkeye video rally & serve speed analysis cameras',
        'High-performance private clinics and junior academy programs',
        'Friday Sunset Doubles social mixer with complimentary refreshments'
      ],
      hourlyMember: '$20 - $25/hr',
      hourlyWalkin: '$40 - $45/hr'
    },
    {
      id: 'badminton',
      title: 'Pro Badminton Dome',
      subtitle: 'BWF Certified Sprung Wooden Courts',
      icon: Zap,
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
      description: 'Engineered specifically for badminton aerodynamics and rapid footwork. Features 8-meter ceiling clearances, non-drift ventilation shafts, and tournament-grade BWF certified non-slip green mats.',
      features: [
        'Multi-layer Canadian maple sprung flooring with subfloor shock pads',
        'Certified BWF tournament PVC non-slip surface mats',
        'Zero-glare high-bay vertical lumination to eliminate shuttle blind spots',
        'High-speed Yonex racquet restringing machine in pro-shop',
        'Weekly ladder tournaments and singles challenge leagues'
      ],
      hourlyMember: '$18/hr',
      hourlyWalkin: '$32/hr'
    },
    {
      id: 'cricket',
      title: 'Cricket Performance Hub',
      subtitle: 'Pace Lanes & Automated Bowling Machines',
      icon: Target,
      image: 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?auto=format&fit=crop&w=1200&q=80',
      description: 'Designed for serious batsmen and bowlers. 2 full-length AstroTurf lanes equipped with programmable RoboArm & BOLA bowling machines capable of speeds up to 150 km/h with variable swing and spin settings.',
      features: [
        'Programmable multi-speed bowling machine with in-swing, out-swing, and spin',
        'Ultra-dense AstroTurf with realistic bounce and seam response',
        'Full protective net enclosures with shock-absorbing backstop curtains',
        'Bowling biomechanics video review system',
        'Club match play practice and masterclass workshops'
      ],
      hourlyMember: '$25/hr',
      hourlyWalkin: '$45/hr'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Disciplines & Arenas</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Championship Sports Programs</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Every court and lane at The Champions Club is designed to international tournament specifications.
        </p>
      </div>

      <div className="space-y-12">
        {sportsDetail.map((sport, idx) => {
          const Icon = sport.icon;
          const isEven = idx % 2 === 1;

          return (
            <div
              key={sport.id}
              className={`glass-panel rounded-3xl overflow-hidden border border-slate-800 grid grid-cols-1 lg:grid-cols-2 ${
                isEven ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className={`relative h-72 lg:h-auto overflow-hidden ${isEven ? 'lg:order-2' : ''}`}>
                <img
                  src={sport.image}
                  alt={sport.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-slate-800">
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className={`p-8 lg:p-12 space-y-6 flex flex-col justify-between ${isEven ? 'lg:order-1' : ''}`}>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{sport.subtitle}</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{sport.title}</h2>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {sport.description}
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Specifications & Features:</div>
                    <ul className="space-y-2">
                      {sport.features.map((f, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] text-slate-400">Member Hourly Rate:</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{sport.hourlyMember}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigate('facilities')}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                    >
                      Court Schedule
                    </button>
                    <button
                      onClick={() => onNavigate('trial')}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Book Trial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
