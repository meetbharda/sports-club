import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wine, Coffee, Utensils, Clock, CheckCircle, Plus, DollarSign, X, ChefHat, RefreshCw } from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

export default function BarDashboard() {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState('tables'); // 'tables' or 'kds'
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [kdsOrders, setKdsOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeTabOrder, setActiveTabOrder] = useState(null);
  const [orderItemsToAdd, setOrderItemsToAdd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const loadBarData = async () => {
    try {
      const [tRes, mRes, kRes] = await Promise.all([
        fetch('/api/bar/tables', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/public/bar-menu'),
        fetch('/api/bar/kds/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (tRes.ok) setTables(await tRes.json());
      if (mRes.ok) setMenu(await mRes.json());
      if (kRes.ok) setKdsOrders(await kRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBarData();
    const interval = setInterval(loadBarData, 10000); // Polling for live KDS updates
    return () => clearInterval(interval);
  }, [token]);

  // Open Table Modal / Tab
  const handleOpenTable = async (tableId) => {
    const customer = prompt('Enter Guest or Member Name for this table:', 'Lounge Guest');
    if (!customer) return;

    try {
      const res = await fetch(`/api/bar/tables/${tableId}/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customer_name: customer })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open table');

      loadBarData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Click on Occupied Table to view/add items
  const handleSelectTable = async (table) => {
    setSelectedTable(table);
    if (table.tab_id) {
      try {
        const res = await fetch(`/api/bar/orders/${table.tab_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setActiveTabOrder(await res.json());
      } catch (err) {
        console.error(err);
      }
    } else {
      setActiveTabOrder(null);
    }
  };

  // Add Item to Temporary Tab Basket
  const handleAddItemToBasket = (menuItem) => {
    setOrderItemsToAdd(prev => {
      const existing = prev.find(i => i.name === menuItem.name);
      if (existing) {
        return prev.map(i => i.name === menuItem.name ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { name: menuItem.name, category: menuItem.category, unit_price: menuItem.price, quantity: 1 }];
    });
  };

  // Send items to Kitchen and save to Tab
  const handleSendToKitchen = async () => {
    if (!activeTabOrder || orderItemsToAdd.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/bar/orders/${activeTabOrder.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: orderItemsToAdd })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add items');

      setOrderItemsToAdd([]);
      loadBarData();
      handleSelectTable(selectedTable);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Settle Tab
  const handleSettleTab = async (paymentMethod = 'card') => {
    if (!activeTabOrder) return;
    if (!window.confirm(`Settle Tab #${activeTabOrder.order_number} for $${activeTabOrder.total_amount.toFixed(2)} via ${paymentMethod.toUpperCase()}?`)) return;

    setSettling(true);
    try {
      const res = await fetch(`/api/bar/orders/${activeTabOrder.id}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_method: paymentMethod })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to settle tab');

      setReceiptData({
        order_number: data.receipt.order_number,
        total_amount: data.receipt.total_amount,
        discount_amount: data.receipt.discount_amount,
        payment_method: data.receipt.payment_method,
        customer_name: activeTabOrder.customer_name,
        items: activeTabOrder.items
      });
      setShowReceipt(true);
      setSelectedTable(null);
      setActiveTabOrder(null);
      loadBarData();
    } catch (err) {
      alert(`Settle Error: ${err.message}`);
    } finally {
      setSettling(false);
    }
  };

  // KDS Status Transition
  const handleUpdateKdsStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/bar/orders/${orderId}/kds-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ kitchen_status: newStatus })
      });
      if (res.ok) loadBarData();
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
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase">
              Clubhouse Bar & Cafeteria
            </span>
            <span className="text-xs text-slate-400">POS & Kitchen Display System (KDS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Table Floor Plan & KDS Orders</h1>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveView('tables')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeView === 'tables' ? 'bg-rose-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Table Floor Plan
          </button>
          <button
            onClick={() => setActiveView('kds')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'kds' ? 'bg-rose-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Display ({kdsOrders.length})</span>
          </button>
        </div>
      </div>

      {/* TABLE FLOOR MAP VIEW */}
      {activeView === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual 10 Table Floor Layout */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Restaurant & Lounge Floor Map</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {tables.map(table => {
                const isOccupied = table.status === 'Occupied';
                const isSelected = selectedTable?.id === table.id;

                return (
                  <div
                    key={table.id}
                    onClick={() => {
                      if (isOccupied) handleSelectTable(table);
                      else handleOpenTable(table.id);
                    }}
                    className={`p-4 rounded-2xl border text-center cursor-pointer transition-all flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-950/30'
                        : isOccupied
                        ? 'bg-amber-950/30 border-amber-800/80 hover:border-amber-500'
                        : 'glass-panel border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-black text-xl text-white">{table.table_number}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{table.capacity} Seats</div>
                    </div>

                    <div>
                      {isOccupied ? (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            Occupied
                          </span>
                          <div className="text-[11px] font-bold text-white truncate">
                            {table.customer_name}
                          </div>
                          <div className="font-mono text-[10px] text-emerald-400 font-bold">
                            ${(table.total_amount || 0).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900">
                          + Open Table
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Table Details & Order Builder */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5 h-fit sticky top-20">
            {selectedTable && activeTabOrder ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedTable.table_number}: {activeTabOrder.customer_name}</h3>
                    <div className="text-[10px] text-slate-400 font-mono">Tab #{activeTabOrder.order_number}</div>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {/* Existing items on this Tab */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Current Items on Bill:</div>
                  {activeTabOrder.items && activeTabOrder.items.map(item => (
                    <div key={item.id} className="p-2 rounded bg-slate-900 flex justify-between">
                      <span>{item.quantity}x {item.item_name}</span>
                      <span className="font-mono text-emerald-400">${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Items in builder basket to add */}
                {orderItemsToAdd.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-800/60 space-y-2">
                    <div className="text-[10px] font-bold text-amber-400 uppercase">New Items to Send to Kitchen:</div>
                    {orderItemsToAdd.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono">${(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <button
                      disabled={loading}
                      onClick={handleSendToKitchen}
                      className="w-full py-1.5 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow"
                    >
                      {loading ? 'Routing...' : 'Send Order to Kitchen Display'}
                    </button>
                  </div>
                )}

                {/* Quick Add from Menu */}
                <div className="space-y-1.5 border-t border-slate-800 pt-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Quick Add Menu Items:</div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {menu.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleAddItemToBasket(m)}
                        className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-[11px] truncate flex justify-between"
                      >
                        <span className="truncate mr-1 text-slate-300">{m.name}</span>
                        <span className="font-mono font-bold text-emerald-400">${m.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Totals */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">${activeTabOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {activeTabOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Member Discount:</span>
                      <span className="font-mono">-${activeTabOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-slate-800">
                    <span>Running Total:</span>
                    <span className="font-mono text-emerald-400">${activeTabOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Settle Tab Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    disabled={settling}
                    onClick={() => handleSettleTab('cash')}
                    className="py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  >
                    Cash
                  </button>
                  <button
                    disabled={settling}
                    onClick={() => handleSettleTab('card')}
                    className="py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Card
                  </button>
                  <button
                    disabled={settling}
                    onClick={() => handleSettleTab('upi')}
                    className="py-2 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                  >
                    UPI QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500">
                Click on any table on the left to view active running tab, add food/drinks, or settle bill.
              </div>
            )}
          </div>
        </div>
      )}

      {/* KITCHEN DISPLAY SYSTEM (KDS) TAB */}
      {activeView === 'kds' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-rose-400" />
              <span>Live Kitchen Order Stream</span>
            </h3>
            <span className="text-xs text-slate-400">Auto-refreshing every 10 seconds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kdsOrders.map(order => (
              <div key={order.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-mono font-bold text-base text-white">{order.order_number}</span>
                    <div className="text-xs text-slate-400">{order.table_name || 'Table'} ({order.customer_name})</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    order.kitchen_status === 'NEW' ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse' :
                    order.kitchen_status === 'PREPARING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    order.kitchen_status === 'READY' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {order.kitchen_status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-200">
                  {order.items && order.items.map(item => (
                    <div key={item.id} className="p-2 rounded bg-slate-900 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">{item.quantity}x</span> {item.item_name}
                        {item.notes && <div className="text-[10px] text-amber-400 italic font-mono mt-0.5">Note: {item.notes}</div>}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{item.category}</span>
                    </div>
                  ))}
                </div>

                {/* Kitchen Status progression buttons */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateKdsStatus(order.id, 'PREPARING')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      order.kitchen_status === 'PREPARING' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Prep
                  </button>
                  <button
                    onClick={() => handleUpdateKdsStatus(order.id, 'READY')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      order.kitchen_status === 'READY' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Ready
                  </button>
                  <button
                    onClick={() => handleUpdateKdsStatus(order.id, 'COMPLETED')}
                    className="py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 hover:bg-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
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
