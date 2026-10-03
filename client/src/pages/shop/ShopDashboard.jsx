import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Search, Plus, Minus, Trash2, Printer, CheckCircle, AlertTriangle, ArrowRight, Package, RefreshCw } from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function ShopDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'orders'
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orders, setOrders] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockNotes, setRestockNotes] = useState('');

  const loadShopData = async () => {
    try {
      const [prodRes, ordRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/shop/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [token]);

  // Member search for POS discount
  const handleSearchMember = async (q) => {
    setMemberSearch(q);
    if (!q || q.length < 2) {
      setMembers([]);
      return;
    }
    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMembers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Cart operations
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert('Cannot add more than in-stock count.');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty > item.product.stock_quantity) return item;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const discountPct = selectedMember ? (selectedMember.discount_shop_override || selectedMember.shop_discount_pct || 0) : 0;
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  const discountAmount = Number(((rawSubtotal * discountPct) / 100).toFixed(2));
  const taxable = rawSubtotal - discountAmount;
  const taxAmount = Number((taxable * 0.05).toFixed(2));
  const finalTotal = Number((taxable + taxAmount).toFixed(2));

  // POS Checkout
  const handlePosCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const itemsPayload = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: itemsPayload,
          order_type: 'pickup',
          payment_method: paymentMethod,
          member_id: selectedMember ? selectedMember.id : null,
          customer_name: selectedMember ? selectedMember.full_name : 'Walk-in Customer'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'POS checkout failed');

      setReceiptData(data.order);
      setShowReceipt(true);
      setCart([]);
      setSelectedMember(null);
      setMemberSearch('');
      loadShopData();
    } catch (err) {
      alert(`POS Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Stock Restock/Adjustment
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;

    try {
      const res = await fetch(`/api/products/${restockProduct.id}/adjust-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          change_qty: Number(restockQty),
          transaction_type: 'restock',
          notes: restockNotes || 'Pro Shop Manager Restock Intake'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');

      alert(data.message);
      setRestockProduct(null);
      loadShopData();
    } catch (err) {
      alert(`Restock Error: ${err.message}`);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`/api/shop/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) loadShopData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
              Pro Shop Staff Terminal
            </span>
            <span className="text-xs text-slate-400">Inventory & POS Station</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Retail Operations & Orders</h1>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pos' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terminal POS
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'inventory' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inventory Stock
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Customer Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* POS TERMINAL TAB */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Fast Product Catalog</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(p => (
                <button
                  key={p.id}
                  disabled={p.stock_quantity <= 0}
                  onClick={() => addToCart(p)}
                  className="p-3 rounded-xl glass-panel border border-slate-800 text-left hover:border-amber-500/50 transition-all flex flex-col justify-between group disabled:opacity-50"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                    <div className="font-bold text-xs text-white line-clamp-1 group-hover:text-amber-400">{p.name}</div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs mt-2 border-t border-slate-800">
                    <span className="font-mono font-bold text-amber-400">${p.selling_price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">Qty: {p.stock_quantity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* POS Checkout Register Sidebar */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 h-fit sticky top-20">
            <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">Active POS Register</h3>

            {/* Member Search / Lookup for auto discount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Member Discount Lookup</label>
              <input
                type="text"
                placeholder="Search member name or code..."
                value={memberSearch}
                onChange={(e) => handleSearchMember(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              {members.length > 0 && !selectedMember && (
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-900 text-xs">
                  {members.map(m => (
                    <div
                      key={m.id}
                      onClick={() => { setSelectedMember(m); setMembers([]); setMemberSearch(m.full_name); }}
                      className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between"
                    >
                      <span className="text-white font-semibold">{m.full_name} ({m.member_code})</span>
                      <span className="text-amber-400 font-bold">{m.shop_discount_pct}% Off</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between text-xs text-amber-300">
                  <div>
                    <span className="font-bold">{selectedMember.full_name}</span>
                    <div className="text-[10px] text-amber-400">{selectedMember.plan_name} • {discountPct}% Shop Discount</div>
                  </div>
                  <button onClick={() => { setSelectedMember(null); setMemberSearch(''); }} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-2 border-t border-slate-800 pt-3 max-h-48 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">Register is empty.</div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="font-semibold text-white truncate">{item.product.name}</div>
                      <div className="text-[10px] text-slate-400">${item.product.selling_price.toFixed(2)} ea</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateCartQty(item.product.id, -1)} className="p-1 rounded bg-slate-800 text-white">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product.id, 1)} className="p-1 rounded bg-slate-800 text-white">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">${rawSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Member Discount ({discountPct}%)</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Sales Tax (5%)</span>
                <span className="font-mono">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Due</span>
                <span className="font-mono text-amber-400">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['cash', 'card', 'upi'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    paymentMethod === m ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              disabled={loading || cart.length === 0}
              onClick={handlePosCheckout}
              className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 disabled:bg-slate-800 disabled:text-slate-600 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : `Charge $${finalTotal.toFixed(2)} (${paymentMethod.toUpperCase()})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Pro Shop Inventory & Stock Levels</h3>
            <span className="text-xs text-slate-400">{products.length} products tracked</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Sell Price</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Alert Threshold</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {products.map(p => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono font-bold text-slate-300">{p.sku}</td>
                      <td className="p-3 font-semibold text-white">{p.name}</td>
                      <td className="p-3 text-slate-400">{p.category_name}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">${p.selling_price.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          isLow ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{p.low_stock_threshold}</td>
                      <td className="p-3 text-slate-400">{p.supplier_name || 'Standard'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setRestockProduct(p)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMER ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-white">Customer Pickup & Delivery Orders</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Fulfillment</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-white">{o.order_number}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{o.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{o.customer_phone}</div>
                    </td>
                    <td className="p-3 capitalize">
                      <span className="font-semibold">{o.order_type}</span>
                      {o.delivery_address && <div className="text-[10px] text-slate-400 truncate max-w-xs">{o.delivery_address}</div>}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">${o.total_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={o.order_status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Intake Restock: {restockProduct.name}</h3>
              <button onClick={() => setRestockProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRestock} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Additional Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-base focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Intake Reference / Notes</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="e.g. PO-8821 from Wilson Distributor"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md"
              >
                Confirm Restock Intake
              </button>
            </form>
          </div>
        </div>
      )}

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receiptData}
      />
    </div>
  );
}
