import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Tag, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ShopCatalog({ onNavigate, onOpenAuth }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/products/categories')
        ]);
        if (prodRes.ok) setProducts(await prodRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (err) {
        console.error('Failed to load shop items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = products.filter(p => {
    const matchCat = selectedCat === 'all' || p.category_id === Number(selectedCat);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Champions Pro Shop</span>
        <h1 className="text-4xl sm:text-5xl font-black text-white">Elite Athletic Gear & Apparel</h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Tournament racquets, feather shuttles, high-performance court footwear, and club apparel.
          Active members receive up to 10% discount automatically upon checkout.
        </p>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rackets, shoes, balls..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCat === 'all' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Products
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCat === c.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No products matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(product => {
            const isOutOfStock = product.stock_quantity <= 0;
            const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;

            return (
              <div key={product.id} className="glass-panel rounded-2xl overflow-hidden glass-card-hover border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="relative h-52 overflow-hidden bg-slate-900">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-slate-300 backdrop-blur-sm">
                      {product.brand || product.category_name}
                    </span>

                    {/* Stock badge */}
                    {isOutOfStock ? (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                        Only {product.stock_quantity} left
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        In Stock ({product.stock_quantity})
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-white line-clamp-1">{product.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Retail Price</div>
                      <div className="text-base font-mono font-bold text-emerald-400">${product.selling_price.toFixed(2)}</div>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => {
                        if (!user) {
                          onOpenAuth('login');
                        } else {
                          onNavigate('member-shop');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isOutOfStock
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Order Item'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
