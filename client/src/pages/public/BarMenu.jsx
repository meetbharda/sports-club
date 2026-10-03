import React, { useState, useEffect } from 'react';
import { Coffee, Utensils, Sparkles, Clock, Wine } from 'lucide-react';

export default function BarMenu({ onNavigate }) {
  const [menu, setMenu] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch('/api/public/bar-menu');
        if (res.ok) setMenu(await res.json());
      } catch (err) {
        console.error('Failed to load bar menu:', err);
      }
    }
    loadMenu();
  }, []);

  const categories = ['all', 'Coffee', 'Smoothies', 'Cold Drinks', 'Sandwiches', 'Mains', 'Snacks'];

  const filtered = menu.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Clubhouse Lounge & Cafeteria</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Artisanal Nutrition & Refreshment</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Refuel post-rally with organic recovery smoothies, single-origin espresso, gourmet smash burgers, and fresh cold-pressed tonics.
          Gold members enjoy 15% and Silver members enjoy 5% discount on all items.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bar & Kitchen Hours: 07:00 AM - 10:30 PM Daily</span>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(item => (
          <div key={item.id} className="glass-panel rounded-2xl overflow-hidden glass-card-hover border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="relative h-44 overflow-hidden">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-amber-300 backdrop-blur-sm">
                  {item.category}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-white">{item.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0">
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-base font-mono font-bold text-amber-400">${item.price.toFixed(2)}</span>
                <span className="text-[10px] text-slate-500 font-medium">Available at Lounge</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
