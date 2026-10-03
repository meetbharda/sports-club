import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Search, Plus, Minus, Trash2, CheckCircle, Package, Truck, ArrowRight } from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function MemberShop() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [orderType, setOrderType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/shop/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const discountPct = user?.member?.shop_discount_pct || 0;

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Cannot add more than available stock (${product.stock_quantity}).`);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock_quantity) {
            alert(`Maximum available stock reached (${item.product.stock_quantity}).`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);
  const discountAmount = Number(((rawSubtotal * discountPct) / 100).toFixed(2));
  const taxable = rawSubtotal - discountAmount;
  const taxAmount = Number((taxable * 0.05).toFixed(2));
  const finalTotal = Number((taxable + taxAmount).toFixed(2));

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      alert('Please provide a valid delivery address.');
      return;
    }

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
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? deliveryAddress : null,
          payment_method: 'card'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setCart([]);
      setReceiptData(data.order);
      setShowReceipt(true);
      loadData();
    } catch (err) {
      alert(`Checkout Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Pro Shop & Member Equipment</h1>
        <p className="text-xs text-slate-400 mt-1">
          Your <strong>{user?.member?.plan_name}</strong> unlocks an automatic <strong>{discountPct}% discount</strong> applied upon checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products List (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="relative h-40 rounded-xl overflow-hidden mb-3 bg-slate-900">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-emerald-400">
                      Stock: {p.stock_quantity}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-3">
                  <div>
                    <div className="text-[10px] text-slate-500 line-through">${p.selling_price.toFixed(2)}</div>
                    <div className="text-base font-mono font-bold text-emerald-400">
                      ${(p.selling_price * (1 - discountPct / 100)).toFixed(2)}
                    </div>
                  </div>

                  <button
                    disabled={p.stock_quantity <= 0}
                    onClick={() => addToCart(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {p.stock_quantity <= 0 ? 'Out of Stock' : '+ Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Past Orders */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white">Your Order History</h3>
            {orders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No past orders yet.</div>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        <span>{o.order_number}</span>
                        <span className="text-[10px] font-normal text-slate-400">({o.order_type})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {o.created_at.slice(0, 16)} • {o.items ? `${o.items.length} item(s)` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">${o.total_amount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Paid ({o.payment_method})</div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.order_status === 'Ready for Pickup' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        o.order_status === 'Delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {o.order_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Member Cart & Checkout Sidebar */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 h-fit sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>Checkout Cart</span>
            </h3>
            <span className="text-xs text-slate-400">{cart.length} item(s)</span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Your cart is empty. Click "+ Add" on any equipment item.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.product.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="font-semibold text-white truncate">{item.product.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        ${item.product.selling_price.toFixed(2)} ea
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-red-400 hover:text-red-300 ml-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pickup or Delivery Option */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300">Fulfillment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType('pickup')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      orderType === 'pickup' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Club Pickup</span>
                  </button>
                  <button
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      orderType === 'delivery' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Home Delivery</span>
                  </button>
                </div>

                {orderType === 'delivery' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Delivery street address..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Price Calculation breakdown */}
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
                  <span>Total Amount</span>
                  <span className="font-mono text-emerald-400">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleCheckout}
                className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Processing...' : 'Complete Payment ($' + finalTotal.toFixed(2) + ')'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receiptData}
      />
    </div>
  );
}
